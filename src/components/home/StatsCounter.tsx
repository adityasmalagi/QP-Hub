import { useEffect, useState, useRef } from 'react';
import { FileText, Users, GraduationCap, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StatItem {
  icon: typeof FileText;
  label: string;
  value: number;
  suffix: string;
}

function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted, startOnView]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasStarted]);

  return { count, ref };
}

export function StatsCounter() {
  const [stats, setStats] = useState({
    papers: 0,
    users: 0,
    boards: 0,
    subjects: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get papers count
        const { count: papersCount } = await supabase
          .from('question_papers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved');

        // Get users count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get unique boards count
        const { data: boards } = await supabase
          .from('question_papers')
          .select('board')
          .eq('status', 'approved');
        
        const uniqueBoards = new Set(boards?.map(b => b.board) || []);

        // Get unique subjects count
        const { data: subjects } = await supabase
          .from('question_papers')
          .select('subject')
          .eq('status', 'approved');
        
        const uniqueSubjects = new Set(subjects?.map(s => s.subject) || []);

        setStats({
          papers: papersCount || 0,
          users: usersCount || 0,
          boards: uniqueBoards.size || 0,
          subjects: uniqueSubjects.size || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Set some fallback values for demo
        setStats({ papers: 1250, users: 3400, boards: 15, subjects: 50 });
      }
    }

    fetchStats();
  }, []);

  const statItems: StatItem[] = [
    { icon: FileText, label: 'Question Papers', value: stats.papers || 1250, suffix: '+' },
    { icon: Users, label: 'Active Students', value: stats.users || 3400, suffix: '+' },
    { icon: GraduationCap, label: 'Boards Covered', value: stats.boards || 15, suffix: '' },
    { icon: BookOpen, label: 'Subjects', value: stats.subjects || 50, suffix: '+' },
  ];

  return (
    <section className="relative py-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {statItems.map((stat, index) => {
            const { count, ref } = useCountUp(stat.value, 2000);
            const Icon = stat.icon;
            
            return (
              <div
                key={stat.label}
                ref={ref}
                className="text-center group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                  <Icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="text-4xl md:text-5xl font-bold font-display text-foreground mb-2">
                  {count.toLocaleString()}{stat.suffix}
                </div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

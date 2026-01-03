import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Upload, BookOpen, ArrowRight, CheckCircle, Sparkles, Filter, RefreshCw, Zap, Shield, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PaperCard } from '@/components/PaperCard';
import { PaperCardSkeleton } from '@/components/PaperCardSkeleton';
import { ScrollAnimation } from '@/hooks/useScrollAnimation';
import { FloatingElements } from '@/components/home/FloatingElements';
import { StatsCounter } from '@/components/home/StatsCounter';
import { WaveDivider } from '@/components/home/WaveDivider';
import { BoardsMarquee } from '@/components/home/BoardsMarquee';
import qphubLogo from '@/assets/qphub-logo.png';

const uploadSteps = [
  { step: 1, title: 'Select Your Paper', description: 'Choose subject, board, year' },
  { step: 2, title: 'Upload File', description: 'Drag & drop or browse files' },
  { step: 3, title: 'Add Details', description: 'Add description and tags' },
  { step: 4, title: 'Submit', description: "We'll review and publish" },
];

const uploadFeatures = [
  { title: 'Simple Upload Process', description: 'Upload PDFs or images with just a few details' },
  { title: 'Verified by Community', description: 'Our moderators verify authenticity and quality' },
  { title: 'Earn Recognition', description: 'Get badges and recognition for contributions' },
];

const filterTips = [
  { title: 'Select Your Board', description: 'Choose from CBSE, ICSE, IB, Cambridge, State Boards, and more', icon: Filter },
  { title: 'Pick Your Class', description: 'Filter by class level from Class 9 to Class 12 and beyond', icon: BookOpen },
  { title: 'Choose Subject', description: 'Browse Mathematics, Science, English, and 50+ subjects', icon: Search },
  { title: 'Select Year', description: 'Access papers from 2015 to present year', icon: Star },
];

const features = [
  { icon: Search, title: 'Advanced Filters', description: 'Find exactly what you need with powerful search and filtering by board, class, subject, and year.' },
  { icon: Upload, title: 'Easy Uploads', description: 'Share your question papers effortlessly. Drag, drop, and help fellow students succeed.' },
  { icon: BookOpen, title: 'Academic Success', description: 'Access thousands of past papers from Indian and International boards to ace your exams.' },
  { icon: Zap, title: 'Lightning Fast', description: 'Instantly download papers with no waiting. Our platform is optimized for speed.' },
  { icon: Shield, title: 'Verified Content', description: 'All papers are reviewed by our community to ensure quality and authenticity.' },
  { icon: Star, title: 'Free Forever', description: 'Access all papers completely free. No hidden fees, no premium tiers, no ads.' },
];

interface RecommendedPaper {
  id: string;
  title: string;
  subject: string;
  board: string;
  class_level: string;
  year: number;
  exam_type: string;
  views_count: number;
  downloads_count: number;
  semester: number | null;
  internal_number: number | null;
  institute_name: string | null;
  user_id: string;
  created_at: string | null;
  uploaderName?: string | null;
}

export default function Index() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedPaper[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bgLayer1Ref = useRef<HTMLDivElement>(null);
  const bgLayer2Ref = useRef<HTMLDivElement>(null);
  const bgLayer3Ref = useRef<HTMLDivElement>(null);
  const bgLayer4Ref = useRef<HTMLDivElement>(null);

  // Parallax scroll effect (optimized to avoid re-rendering on scroll)
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (reduceMotion || isMobile) return;

    let rafId = 0;
    const onScroll = () => {
      const y = window.scrollY || 0;
      if (rafId) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = 0;

        if (bgLayer1Ref.current) {
          bgLayer1Ref.current.style.transform = `translate3d(0, ${y * 0.3}px, 0)`;
        }
        if (bgLayer2Ref.current) {
          bgLayer2Ref.current.style.transform = `translate3d(0, ${y * 0.2}px, 0) scale(${1 + y * 0.0005})`;
        }
        if (bgLayer3Ref.current) {
          bgLayer3Ref.current.style.transform = `translate3d(0, ${y * 0.15}px, 0)`;
        }
        if (bgLayer4Ref.current) {
          bgLayer4Ref.current.style.transform = `translate3d(0, ${y * 0.1}px, 0)`;
        }
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);


  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoadingRecs(true);
    }
    
    try {
      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('class_level, board')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.class_level || profile?.board) {
        let query = supabase
          .from('question_papers')
          .select('id, title, subject, board, class_level, year, exam_type, views_count, downloads_count, semester, internal_number, institute_name, user_id, created_at')
          .eq('status', 'approved')
          .limit(20);

        if (profile.class_level) {
          query = query.eq('class_level', profile.class_level);
        }
        if (profile.board) {
          query = query.eq('board', profile.board);
        }

        const { data } = await query;
        
        // Fetch uploader names and shuffle
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map(p => p.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
          
          const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
          const papersWithUploaders = data.map(paper => ({
            ...paper,
            uploaderName: profileMap.get(paper.user_id) || null
          }));
          
          const shuffled = papersWithUploaders.sort(() => Math.random() - 0.5);
          setRecommendations(shuffled.slice(0, 4));
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecs(false);
      setIsRefreshing(false);
    }
  }, [user]);

  const handleRefresh = () => {
    fetchRecommendations(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section with Floating Elements */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background layers */}
        <div
          ref={bgLayer1Ref}
          className="absolute inset-0 gradient-hero-dark will-change-transform"
        />
        <div
          ref={bgLayer2Ref}
          className="absolute inset-0 will-change-transform bg-[radial-gradient(ellipse_at_top,_hsl(280,50%,20%,0.4)_0%,_transparent_50%)]"
        />
        <div
          ref={bgLayer3Ref}
          className="absolute inset-0 will-change-transform bg-[radial-gradient(circle_at_30%_70%,_hsl(var(--primary)/0.2)_0%,_transparent_40%)]"
        />
        <div
          ref={bgLayer4Ref}
          className="absolute inset-0 will-change-transform bg-[radial-gradient(circle_at_70%_30%,_hsl(var(--accent)/0.15)_0%,_transparent_35%)]"
        />
        
        {/* Floating Elements */}
        <FloatingElements />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        
        <div className="container relative mx-auto px-4 py-20 text-center z-10">
          <div className="mx-auto max-w-4xl">
            <ScrollAnimation animation="fade-up" delay={0}>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 backdrop-blur-sm glow-pulse">
                <Sparkles className="h-4 w-4 text-primary animate-bounce-subtle" />
                <span className="text-sm font-semibold text-primary">
                  Your Academic Success Partner
                </span>
              </div>
            </ScrollAnimation>
            
            <ScrollAnimation animation="fade-up" delay={100}>
              <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl font-display">
                Access Question Papers{' '}
                <span className="text-gradient block mt-2">
                  From Anywhere
                </span>
              </h1>
            </ScrollAnimation>
            
            <ScrollAnimation animation="fade-up" delay={200}>
              <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
                The ultimate platform for students to discover, download, and share academic question papers. 
                Prepare smarter with our vast collection spanning multiple boards and years.
              </p>
            </ScrollAnimation>
            
            <ScrollAnimation animation="fade-up" delay={300}>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to={user ? "/browse" : "/auth?redirect=/browse"}>
                  <Button size="lg" className="gradient-primary px-10 py-7 text-lg font-semibold shadow-glow glow-purple hover:scale-105 transition-transform duration-300 shimmer">
                    Browse Papers
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to={user ? "/upload-mobile" : "/auth?redirect=/upload-mobile"}>
                        <Button size="lg" variant="outline" className="px-10 py-7 text-lg font-semibold border-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105">
                          <Upload className="mr-2 h-5 w-5" />
                          Upload Paper
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px] text-center">
                      <p>Upload photos, PDFs, or DOC files of question papers</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </ScrollAnimation>
            
            {/* Scroll indicator */}
            <ScrollAnimation animation="fade-up" delay={600}>
              <div className="mt-16 flex flex-col items-center gap-2 text-muted-foreground/50">
                <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
                <div className="w-6 h-10 rounded-full border-2 border-current p-1">
                  <div className="w-1.5 h-2.5 mx-auto rounded-full bg-current animate-bounce" />
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <StatsCounter />

      {/* Boards Marquee */}
      <BoardsMarquee />

      {/* Wave Divider */}
      <div className="bg-card/30">
        <WaveDivider variant="wave" flip />
      </div>

      {/* Recommended Papers Section - Only for logged in users */}
      {user && (loadingRecs || recommendations.length > 0) && (
        <section className="bg-card/30 py-16">
          <div className="container mx-auto px-4">
            <ScrollAnimation animation="fade-up">
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-foreground md:text-4xl font-display">
                    Recommended <span className="text-gradient">For You</span>
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Based on your profile preferences
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Link to="/browse">
                    <Button variant="outline" size="sm" className="gap-2">
                      View All
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollAnimation>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {loadingRecs ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <PaperCardSkeleton key={i} />
                  ))}
                </>
              ) : (
                recommendations.map((paper, index) => (
                  <ScrollAnimation
                    key={paper.id}
                    animation="fade-up"
                    delay={index * 100}
                  >
                    <PaperCard
                      id={paper.id}
                      title={paper.title}
                      subject={paper.subject}
                      board={paper.board}
                      classLevel={paper.class_level}
                      year={paper.year}
                      examType={paper.exam_type}
                      viewsCount={paper.views_count ?? 0}
                      downloadsCount={paper.downloads_count ?? 0}
                      semester={paper.semester}
                      internalNumber={paper.internal_number}
                      instituteName={paper.institute_name}
                      uploaderName={paper.uploaderName}
                      uploaderId={paper.user_id}
                      createdAt={paper.created_at}
                    />
                  </ScrollAnimation>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* How to Find Papers Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.05)_0%,_transparent_70%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollAnimation animation="fade-up" className="mb-16 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-5 py-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Finding Papers Made Easy</span>
            </div>
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl font-display">
              How to Find the <span className="text-gradient">Right Paper</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Use our powerful filters to quickly find exactly what you need
            </p>
          </ScrollAnimation>
          
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filterTips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <ScrollAnimation
                  key={index}
                  animation="fade-up"
                  delay={index * 100}
                >
                  <Card className="group h-full glass-card hover-tilt feature-card-glow transition-all duration-500 hover:shadow-lg hover:shadow-primary/10">
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary font-bold text-lg group-hover:scale-110 transition-transform duration-300">
                          {index + 1}
                        </div>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-foreground">{tip.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{tip.description}</p>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              );
            })}
          </div>
        </div>
      </section>

      {/* Peaks Wave Divider */}
      <WaveDivider variant="peaks" />

      {/* Share Your Knowledge Section */}
      <section className="py-24 bg-card/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
            {/* Left Content */}
            <ScrollAnimation animation="slide-right">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-5 py-2">
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Contribute</span>
                </div>
                <h2 className="mb-6 text-4xl font-bold text-foreground md:text-5xl font-display">
                  Share Your <span className="text-gradient">Knowledge</span>
                </h2>
                <p className="mb-8 text-lg text-muted-foreground leading-relaxed">
                  Help fellow students by uploading question papers from your exams. 
                  It takes just a few seconds and makes a real difference.
                </p>
                
                <div className="mb-10 space-y-5">
                  {uploadFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-4 group">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Link to={user ? "/upload" : "/auth?redirect=/upload"}>
                  <Button size="lg" className="gradient-primary glow-purple px-8 py-6 text-lg font-semibold hover:scale-105 transition-transform duration-300">
                    <Upload className="mr-2 h-5 w-5" />
                    Start Uploading
                  </Button>
                </Link>
              </div>
            </ScrollAnimation>
            
            {/* Right - Steps Card */}
            <ScrollAnimation animation="slide-left">
              <div className="relative">
                {/* Decorative ring */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 blur-xl opacity-50" />
                
                <div className="relative rounded-3xl gradient-border p-1">
                  <div className="rounded-[calc(var(--radius)*2-2px)] glass-card-strong p-8">
                    <div className="space-y-4">
                      {uploadSteps.map((item, index) => (
                        <div 
                          key={index} 
                          className={`rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] ${
                            index === 3 
                              ? 'border-primary/50 bg-gradient-to-r from-primary/15 to-accent/15 shadow-lg shadow-primary/10' 
                              : 'border-border/50 bg-secondary/30 hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              index === 3 ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
                            } font-bold`}>
                              {item.step}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{item.title}</div>
                              <div className="text-sm text-muted-foreground">{item.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Curve Wave Divider */}
      <WaveDivider variant="curve" flip />

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(var(--accent)/0.05)_0%,_transparent_70%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollAnimation animation="fade-up" className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-foreground md:text-5xl font-display">
              Why Choose <span className="text-gradient">QP Hub</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to excel in your exams, all in one place.
            </p>
          </ScrollAnimation>
          
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <ScrollAnimation key={index} animation="scale-in" delay={index * 80}>
                  <Card className="group h-full glass-card hover-tilt feature-card-glow transition-all duration-500 hover:shadow-lg hover:shadow-primary/10">
                    <CardContent className="p-8">
                      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 group-hover:from-primary group-hover:to-primary/80 transition-all duration-500">
                        <Icon className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors duration-500 group-hover:scale-110 transform" />
                      </div>
                      <h3 className="mb-3 text-xl font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero-dark" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.2)_0%,_transparent_60%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollAnimation animation="fade-up" className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-display">
              Ready to <span className="text-gradient">Excel</span> in Your Exams?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of students who are already preparing smarter with QP Hub.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/browse" : "/auth"}>
                <Button size="lg" className="gradient-primary px-10 py-7 text-lg font-semibold shadow-glow glow-purple hover:scale-105 transition-transform duration-300">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-border/50">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="flex flex-col items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={qphubLogo} alt="QP Hub" className="h-12 w-12 rounded-xl object-contain" />
              <span className="text-2xl font-bold text-foreground font-display">QP Hub</span>
            </div>
            
            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/browse" className="text-muted-foreground hover:text-primary transition-colors">
                Browse Papers
              </Link>
              <Link to={user ? "/upload" : "/auth?redirect=/upload"} className="text-muted-foreground hover:text-primary transition-colors">
                Upload Paper
              </Link>
              <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                Sign In
              </Link>
            </div>
            
            {/* Copyright */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} QP Hub. Empowering students worldwide.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2">
                Made with ❤️ for students, by students
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

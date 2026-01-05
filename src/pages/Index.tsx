import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Upload, BookOpen, ArrowRight, CheckCircle, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PaperCard } from '@/components/PaperCard';
import { PaperCardSkeleton } from '@/components/PaperCardSkeleton';
import { ScrollAnimation, useScrollAnimation } from '@/hooks/useScrollAnimation';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/PullToRefresh';
import { TrendingSection } from '@/components/TrendingSection';
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
  { title: 'Select Your Board', description: 'Choose from CBSE, ICSE, IB, Cambridge, State Boards, and more' },
  { title: 'Pick Your Class', description: 'Filter by class level from Class 9 to Class 12 and beyond' },
  { title: 'Choose Subject', description: 'Browse Mathematics, Science, English, and 50+ subjects' },
  { title: 'Select Year', description: 'Access papers from 2015 to present year' },
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
  const [scrollY, setScrollY] = useState(0);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
          .limit(20); // Fetch more to randomize from

        if (profile.class_level) {
          query = query.eq('class_level', profile.class_level);
        }
        if (profile.board) {
          query = query.eq('board', profile.board);
        }

        const { data } = await query;
        
        // Fetch uploader names and shuffle from public_profiles (limited fields)
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map(p => p.user_id))];
          const { data: profiles } = await supabase
            .from('public_profiles')
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

  // Pull-to-refresh for mobile
  const handlePullRefresh = useCallback(async () => {
    await fetchRecommendations(true);
  }, [fetchRecommendations]);

  const {
    containerRef: pullContainerRef,
    pullDistance,
    isRefreshing: isPullRefreshing,
    progress: pullProgress,
    shouldTrigger,
  } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    threshold: 60,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section with Parallax */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 gradient-hero-dark transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
        <div 
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(280,50%,20%,0.3)_0%,_transparent_50%)] transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${scrollY * 0.2}px) scale(${1 + scrollY * 0.0005})` }}
        />
        <div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,_hsl(var(--primary)/0.15)_0%,_transparent_40%)] transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
        
        <div className="container relative mx-auto px-4 pb-20 pt-24 text-center">
          <div className="mx-auto max-w-4xl">
            <ScrollAnimation animation="fade-up" delay={0}>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-2 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Your Academic Success Partner
                </span>
              </div>
            </ScrollAnimation>
            
            <ScrollAnimation animation="fade-up" delay={100}>
              <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                Access Question Papers{' '}
                <span className="text-gradient">
                  From Anywhere
                </span>
              </h1>
            </ScrollAnimation>
            
            <ScrollAnimation animation="fade-up" delay={200}>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
                The ultimate platform for students to discover, download, and share academic question papers. 
                Prepare smarter with our vast collection spanning multiple boards and years.
              </p>
            </ScrollAnimation>
            
            <ScrollAnimation animation="fade-up" delay={300}>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to={user ? "/browse" : "/auth?redirect=/browse"}>
                  <Button size="lg" className="gradient-primary px-8 py-6 text-lg shadow-glow glow-purple">
                    Browse Papers
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to={user ? "/upload-mobile" : "/auth?redirect=/upload-mobile"}>
                        <Button size="lg" className="gradient-primary px-8 py-6 text-lg shadow-glow glow-purple">
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
          </div>
        </div>
      </section>

      {/* Recommended Papers Section - Only for logged in users */}
      {user && (loadingRecs || recommendations.length > 0) && (
        <section className="border-t border-border bg-card/30 py-12">
          <div className="container mx-auto px-4">
            <ScrollAnimation animation="fade-up">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                    Recommended For You
                  </h2>
                  <p className="mt-1 text-muted-foreground">
                    Based on your profile preferences
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                    Pull down to refresh
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="hidden gap-2 sm:inline-flex"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Link to="/browse">
                    <Button variant="outline" size="sm">
                      View All
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollAnimation>
            
            {/* Pull-to-refresh container for mobile */}
            <div ref={pullContainerRef} className="sm:hidden touch-pan-y">
              <PullToRefreshIndicator
                pullDistance={pullDistance}
                isRefreshing={isPullRefreshing}
                progress={pullProgress}
                shouldTrigger={shouldTrigger}
              />
            </div>
            
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

      {/* Trending Papers Section */}
      <TrendingSection />

      {/* How to Find Papers Section */}
      <section className="border-t border-border bg-card/30 py-20">
        <div className="container mx-auto px-4">
          <ScrollAnimation animation="fade-up" className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary/50 px-4 py-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Finding Papers Made Easy</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              How to Find the <span className="text-gradient">Right Paper</span>
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Use our powerful filters to quickly find exactly what you need
            </p>
          </ScrollAnimation>
          
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filterTips.map((tip, index) => (
              <ScrollAnimation
                key={index}
                animation="fade-up"
                delay={index * 100}
              >
                <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold">
                      {index + 1}
                    </div>
                    <h3 className="mb-2 font-semibold text-foreground">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Share Your Knowledge Section */}
      <section className="border-t border-border py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <ScrollAnimation animation="slide-right">
              <div>
                <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">
                  Share Your <span className="text-gradient">Knowledge</span>
                </h2>
                <p className="mb-8 text-lg text-muted-foreground">
                  Help fellow students by uploading question papers from your exams. 
                  It takes just a few seconds and makes a real difference.
                </p>
                
                <div className="mb-8 space-y-4">
                  {uploadFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <h4 className="font-semibold text-foreground">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Link to={user ? "/upload" : "/auth?redirect=/upload"}>
                  <Button size="lg" className="gradient-primary glow-purple">
                    <Upload className="mr-2 h-5 w-5" />
                    Start Uploading
                  </Button>
                </Link>
              </div>
            </ScrollAnimation>
            
            {/* Right - Steps Card */}
            <ScrollAnimation animation="slide-left">
              <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-secondary/20 p-1">
                <div className="rounded-xl bg-card/80 p-6 backdrop-blur-sm">
                  <div className="space-y-4">
                    {uploadSteps.map((item, index) => (
                      <div 
                        key={index} 
                        className={`rounded-xl border p-4 transition-all ${
                          index === 3 
                            ? 'border-primary/50 bg-gradient-to-r from-primary/10 to-accent/10' 
                            : 'border-border/50 bg-secondary/30'
                        }`}
                      >
                        <div className="mb-1 text-xs font-medium text-primary">Step {item.step}</div>
                        <div className="font-semibold text-foreground">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-card/30 py-20">
        <div className="container mx-auto px-4">
          <ScrollAnimation animation="fade-up" className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Why Choose <span className="text-gradient">QP Hub</span>?
            </h2>
            <p className="text-muted-foreground">
              Everything you need to excel in your exams, all in one place.
            </p>
          </ScrollAnimation>
          
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            <ScrollAnimation animation="scale-in" delay={0}>
              <Card className="group h-full border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary transition-colors group-hover:bg-primary">
                    <Search className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Advanced Filters</h3>
                  <p className="text-sm text-muted-foreground">
                    Find exactly what you need with powerful search and filtering by board, class, subject, and year.
                  </p>
                </CardContent>
              </Card>
            </ScrollAnimation>
            
            <ScrollAnimation animation="scale-in" delay={100}>
              <Card className="group h-full border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary transition-colors group-hover:bg-primary">
                    <Upload className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Easy Uploads</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your question papers effortlessly. Drag, drop, and help fellow students succeed.
                  </p>
                </CardContent>
              </Card>
            </ScrollAnimation>
            
            <ScrollAnimation animation="scale-in" delay={200}>
              <Card className="group h-full border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary transition-colors group-hover:bg-primary">
                    <BookOpen className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Academic Success</h3>
                  <p className="text-sm text-muted-foreground">
                    Access thousands of past papers from Indian and International boards to ace your exams.
                  </p>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={qphubLogo} alt="QP Hub" className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-lg font-bold text-foreground">QP Hub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} QP Hub. Empowering students worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Upload, BookOpen, ArrowRight, CheckCircle, Filter, RefreshCw, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PaperCard } from '@/components/PaperCard';
import { PaperCardSkeleton } from '@/components/PaperCardSkeleton';
import { ScrollAnimation, useScrollAnimation } from '@/hooks/useScrollAnimation';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/PullToRefresh';
import { TrendingSection } from '@/components/TrendingSection';
import { SEO } from '@/components/SEO';
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
  uploaderAvatar?: string | null;
  uploaderPaperCount?: number | null;
}

export default function Index() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedPaper[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);



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
        
        // Fetch uploader names, avatars and paper counts from public_profiles
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map(p => p.user_id))];
          const { data: profiles } = await supabase
            .from('public_profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);
          
          // Get paper counts for each uploader
          const { data: paperCounts } = await supabase
            .from('question_papers')
            .select('user_id')
            .eq('status', 'approved')
            .in('user_id', userIds);
          
          const countMap = new Map<string, number>();
          paperCounts?.forEach(p => {
            countMap.set(p.user_id, (countMap.get(p.user_id) || 0) + 1);
          });

          const profileMap = new Map(profiles?.map(p => [p.id, { name: p.full_name, avatar: p.avatar_url }]) || []);
          const papersWithUploaders = data.map(paper => ({
            ...paper,
            uploaderName: profileMap.get(paper.user_id)?.name || null,
            uploaderAvatar: profileMap.get(paper.user_id)?.avatar || null,
            uploaderPaperCount: countMap.get(paper.user_id) || null,
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
      <SEO
        title="QP Hub — Access and Share Question Papers"
        description="Discover, upload and download past question papers across boards, classes and subjects. Built for students and educators."
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'QP Hub',
          url: 'https://qphub.lovable.app/',
        }}
      />
      <Navbar />
      <main className="-mt-[80px] md:-mt-[80px]">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-[80px] md:pt-[80px]">
        {/* Animated mesh gradient backdrop */}
        <div className="absolute inset-0 gradient-hero-dark" />
        <div className="mesh-gradient" aria-hidden="true">
          <span className="mesh-blob" />
        </div>
        <div className="absolute inset-0 dot-grid opacity-60" aria-hidden="true" />
        <div className="absolute left-1/2 top-10 hidden h-28 w-px -translate-x-1/2 bg-gradient-to-b from-primary/0 via-primary/40 to-primary/0 animate-float-slow md:block" />

        <div className="container relative mx-auto px-3 pb-16 pt-14 text-center sm:px-4 sm:pb-16 sm:pt-14 md:pb-20 md:pt-16">
          <div className="mx-auto max-w-4xl">
            <ScrollAnimation animation="fade-up" delay={0}>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/40 px-4 py-1.5 backdrop-blur-md sm:mb-8 sm:px-4 sm:py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase sm:text-xs">
                  Your academic success partner
                </span>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animation="fade-up" delay={100}>
              <h1 className="mb-6 font-display text-[2.5rem] font-bold leading-[1.05] tracking-tight text-foreground [@media(min-width:360px)]:text-[2.75rem] [@media(min-width:400px)]:text-[3.1rem] sm:mb-5 sm:text-[3.75rem] sm:leading-tight md:text-6xl lg:text-[4.5rem] lg:leading-[1.05]">
                Access Question Papers{' '}
                <span className="aurora-text">From Anywhere</span>
              </h1>
            </ScrollAnimation>

            <ScrollAnimation animation="fade-up" delay={200}>
              <p className="mx-auto mb-8 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:mb-8 sm:text-base md:text-lg">
                The ultimate platform for students to discover, download, and share academic question papers.
                Prepare smarter with our vast collection spanning multiple boards and years.
              </p>
            </ScrollAnimation>

            <ScrollAnimation animation="fade-up" delay={300}>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:items-center">
                <Link to={user ? "/browse" : "/auth?redirect=/browse"}>
                  <Button size="lg" className="group gradient-primary shine-sweep hover-lift w-[260px] rounded-full px-7 py-5 text-base font-semibold shadow-glow glow-purple sm:w-auto sm:rounded-md sm:px-7 sm:py-5 sm:text-base">
                    Browse Papers
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link to={user ? "/upload-mobile" : "/auth?redirect=/upload-mobile"}>
                        <Button
                          size="lg"
                          variant="outline"
                          className="hover-lift w-[260px] rounded-full border-foreground/15 bg-background/30 px-7 py-5 text-base font-semibold text-foreground backdrop-blur-md hover:bg-background/50 hover:text-foreground hover:border-primary/40 dark:hover:text-foreground sm:w-auto sm:rounded-md sm:px-7 sm:py-5 sm:text-base"
                        >
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

            {/* Scroll cue */}
            <div className="mt-12 hidden justify-center md:flex">
              <ChevronDown className="h-6 w-6 text-muted-foreground animate-scroll-bounce" />
            </div>
          </div>
        </div>
      </section>


      {/* Recommended Papers Section - Only for logged in users */}
      {user && (loadingRecs || recommendations.length > 0) && (
        <section className="relative bg-secondary/30 py-16">
          <div className="divider-fade absolute inset-x-0 top-0" />
          <div className="container mx-auto px-4">
            <ScrollAnimation animation="fade-up">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="accent-bar mb-3" />
                  <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                    Recommended For You
                  </h2>
                  <p className="mt-2 text-muted-foreground">
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
                      uploaderAvatar={paper.uploaderAvatar}
                      uploaderPaperCount={paper.uploaderPaperCount}
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

      <section className="relative py-24">
        <div className="divider-fade absolute inset-x-0 top-0" />
        <div className="container mx-auto px-4">
          <ScrollAnimation animation="fade-up" className="mb-14 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-secondary/40 px-4 py-1.5 backdrop-blur-sm">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Finding Papers Made Easy</span>
            </div>
            <h2 className="mb-4 font-display text-4xl font-bold text-foreground md:text-5xl">
              How to Find the <span className="aurora-text">Right Paper</span>
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
                <div className="card-premium group h-full p-6">
                  <div className="number-badge mb-4 flex h-10 w-10 items-center justify-center rounded-xl font-bold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    {index + 1}
                  </div>
                  <h3 className="mb-2 font-display font-semibold text-foreground">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Share Your Knowledge Section */}
      <section className="relative bg-secondary/30 py-24">
        <div className="divider-fade absolute inset-x-0 top-0" />
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <ScrollAnimation animation="slide-right">
              <div>
                <span className="accent-bar mb-4" />
                <h2 className="mb-6 font-display text-4xl font-bold text-foreground md:text-5xl">
                  Share Your <span className="aurora-text">Knowledge</span>
                </h2>
                <p className="mb-8 text-lg text-muted-foreground">
                  Help fellow students by uploading question papers from your exams. 
                  It takes just a few seconds and makes a real difference.
                </p>
                
                <div className="mb-8 space-y-4">
                  {uploadFeatures.map((feature, index) => (
                    <div key={index} className="group flex items-start gap-3 rounded-lg p-2 transition-all duration-300 hover:bg-secondary/40">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-hover:scale-110" />
                      <div>
                        <h4 className="font-semibold text-foreground">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Link to={user ? "/upload" : "/auth?redirect=/upload"}>
                  <Button size="lg" className="gradient-primary shine-sweep hover-lift glow-purple">
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
                        className={`group rounded-xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-card ${
                          index === 3 
                            ? 'border-primary/50 bg-gradient-to-r from-primary/10 to-accent/10' 
                            : 'border-border/50 bg-secondary/30'
                        }`}
                      >
                        <div className="mb-1 text-xs font-medium text-primary transition-transform duration-300 group-hover:translate-x-1">Step {item.step}</div>
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
      <section className="relative py-24">
        <div className="divider-fade absolute inset-x-0 top-0" />
        <div className="container mx-auto px-4">
          <ScrollAnimation animation="fade-up" className="mb-14 text-center">
            <span className="accent-bar mb-4" />
            <h2 className="mb-4 font-display text-4xl font-bold text-foreground md:text-5xl">
              Why Choose <span className="aurora-text">QP Hub</span>?
            </h2>
            <p className="text-muted-foreground">
              Everything you need to excel in your exams, all in one place.
            </p>
          </ScrollAnimation>
          
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {[
              { Icon: Search, title: 'Advanced Filters', desc: 'Find exactly what you need with powerful search and filtering by board, class, subject, and year.' },
              { Icon: Upload, title: 'Easy Uploads', desc: 'Share your question papers effortlessly. Drag, drop, and help fellow students succeed.' },
              { Icon: BookOpen, title: 'Academic Success', desc: 'Access thousands of past papers from Indian and International boards to ace your exams.' },
            ].map(({ Icon, title, desc }, i) => (
              <ScrollAnimation key={title} animation="scale-in" delay={i * 100}>
                <div className="card-premium group h-full p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 transition-all duration-300 group-hover:rotate-3 group-hover:scale-110 group-hover:from-primary group-hover:to-primary">
                    <Icon className="h-6 w-6 text-primary transition-colors group-hover:text-primary-foreground" />
                  </div>
                  <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={qphubLogo} alt="QP Hub" className="h-8 w-8 rounded-lg object-contain animate-float" />
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

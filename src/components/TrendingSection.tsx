import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTrendingPapers } from '@/hooks/useTrendingPapers';
import { PaperCard } from '@/components/PaperCard';
import { PaperCardSkeleton } from '@/components/PaperCardSkeleton';
import { ScrollAnimation } from '@/hooks/useScrollAnimation';
import { TrendingUp, ArrowRight, Flame } from 'lucide-react';

type TimeFrame = 'daily' | 'weekly' | 'monthly';

export function TrendingSection() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
  const { papers, loading } = useTrendingPapers(timeFrame, 4);

  return (
    <section className="border-t border-border bg-card/30 py-12">
      <div className="container mx-auto px-4">
        <ScrollAnimation animation="fade-up">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground md:text-3xl flex items-center gap-2">
                  Trending Papers
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </h2>
                <p className="text-muted-foreground text-sm">
                  Most popular papers right now
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Tabs value={timeFrame} onValueChange={(v) => setTimeFrame(v as TimeFrame)}>
                <TabsList className="h-9">
                  <TabsTrigger value="daily" className="text-xs px-3">Today</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs px-3">This Week</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs px-3">This Month</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Link to="/browse?sort=trending">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </ScrollAnimation>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <PaperCardSkeleton key={i} />
            ))
          ) : papers.length > 0 ? (
            papers.map((paper, index) => (
              <ScrollAnimation key={paper.id} animation="fade-up" delay={index * 100}>
                <div className="relative">
                  {index < 3 && (
                    <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                      {index + 1}
                    </div>
                  )}
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
                    uploaderId={paper.user_id}
                    createdAt={paper.created_at}
                  />
                </div>
              </ScrollAnimation>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No trending papers found for this period</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

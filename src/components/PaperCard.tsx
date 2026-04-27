import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Download, FileText, Building2, FileUp, Star } from 'lucide-react';
import { BookmarkButton } from '@/components/BookmarkButton';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface PaperCardProps {
  id: string;
  title: string;
  subject: string;
  board: string;
  classLevel: string;
  year: number;
  examType: string;
  viewsCount: number;
  downloadsCount: number;
  uploaderName?: string | null;
  uploaderId?: string | null;
  uploaderAvatar?: string | null;
  uploaderPaperCount?: number | null;
  semester?: number | null;
  internalNumber?: number | null;
  instituteName?: string | null;
  createdAt?: string | null;
  avgDifficulty?: string | null;
  ratingsCount?: number | null;
}

// Helper to get/set clicked papers from localStorage
const getClickedPapers = (): Set<string> => {
  try {
    const stored = localStorage.getItem('clickedNewPapers');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const markPaperAsClicked = (id: string) => {
  const clicked = getClickedPapers();
  clicked.add(id);
  localStorage.setItem('clickedNewPapers', JSON.stringify([...clicked]));
};

export function PaperCard({
  id,
  title,
  subject,
  board,
  classLevel,
  year,
  examType,
  viewsCount,
  downloadsCount,
  uploaderName,
  uploaderId,
  uploaderAvatar,
  uploaderPaperCount,
  semester,
  internalNumber,
  instituteName,
  createdAt,
  avgDifficulty,
  ratingsCount,
}: PaperCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasBeenClicked, setHasBeenClicked] = useState(false);

  // Check if paper was uploaded within last 24 hours and hasn't been clicked
  const isNewPaper = createdAt ? (Date.now() - new Date(createdAt).getTime()) < 24 * 60 * 60 * 1000 : false;
  
  useEffect(() => {
    if (isNewPaper) {
      setHasBeenClicked(getClickedPapers().has(id));
    }
  }, [id, isNewPaper]);

  const showNewAnimation = isNewPaper && !hasBeenClicked;

  const handleCardClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (isNewPaper) {
      markPaperAsClicked(id);
      setHasBeenClicked(true);
    }
    if (user) {
      navigate(`/paper/${id}`);
    } else {
      navigate(`/auth?redirect=/paper/${id}`);
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleCardClick(e);
    }
  };

  const handleUploaderClick = (e: React.MouseEvent) => {
    if (uploaderId) {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/user/${uploaderId}`);
    }
  };
  return (
    <div className="h-full touch-manipulation">
      <Card className={`group relative h-full overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 border-border/50 bg-card ${showNewAnimation ? 'animate-pulse-subtle ring-2 ring-primary/20' : ''}`}>
        {showNewAnimation && (
          <div className="absolute -top-2 -right-2 z-10">
            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 animate-pulse">
              NEW
            </Badge>
          </div>
        )}
        <CardContent className="relative p-3 sm:p-4">
          <div className="absolute right-3 top-3 z-10 flex min-h-11 min-w-11 items-center justify-center sm:right-4 sm:top-4 sm:min-h-8 sm:min-w-8">
            <BookmarkButton paperId={id} variant="icon" className="h-10 w-10 sm:h-8 sm:w-8" />
          </div>
          <div
            role="button"
            aria-label={`Open ${title}`}
            tabIndex={0}
            onClick={handleCardClick}
            onKeyDown={handleCardKeyDown}
            className="min-w-0 cursor-pointer rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
          <div className="mb-1.5 flex items-start justify-between gap-1.5 pr-12 sm:mb-2 sm:gap-2 sm:pr-11">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary sm:h-10 sm:w-10">
              <FileText className="h-4.5 w-4.5 text-primary sm:h-5 sm:w-5" />
            </div>
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <Badge variant="secondary" className="max-w-[96px] min-w-0 truncate text-[11px] font-medium sm:max-w-[120px] sm:text-xs">
                {board.toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <h3 className="mb-1 line-clamp-2 min-h-[2.15rem] break-words text-sm font-semibold leading-[1.15rem] text-foreground transition-colors group-hover:text-primary sm:mb-1.5 sm:min-h-[2.35rem] sm:text-base sm:leading-[1.18rem]">
            {title}
          </h3>
          
          <div className="mb-1.5 flex min-w-0 flex-wrap gap-1 sm:mb-2 sm:gap-1">
            <Badge variant="outline" className="max-w-full min-w-0 truncate text-[11px] sm:max-w-[9.5rem] sm:text-xs">
              {subject}
            </Badge>
            <Badge variant="outline" className="max-w-[7rem] min-w-0 truncate text-[11px] sm:text-xs">
              Class {classLevel}
            </Badge>
            <Badge variant="outline" className="max-w-[4rem] min-w-0 truncate text-[11px] sm:text-xs">
              {year}
            </Badge>
            {examType === 'internals' && internalNumber && (
              <Badge className="max-w-[7.5rem] min-w-0 truncate text-[11px] bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/30 sm:text-xs">
                Internal {internalNumber}
              </Badge>
            )}
            {examType === 'sem_paper' && semester && (
              <Badge className="max-w-[5rem] min-w-0 truncate text-[11px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 sm:text-xs">
                Sem {semester}
              </Badge>
            )}
            <DifficultyBadge 
              difficulty={avgDifficulty as 'easy' | 'medium' | 'hard' | null} 
              ratingsCount={ratingsCount ?? 0}
              className="max-w-[6rem] min-w-0 truncate text-[11px] sm:text-xs"
            />
          </div>
          
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground sm:gap-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="flex min-h-6 items-center gap-1 pr-2 hover:text-foreground transition-colors cursor-default group/stat sm:min-h-0 sm:pr-0">
                <Eye className="h-3.5 w-3.5 group-hover/stat:scale-110 transition-transform" />
                {viewsCount}
              </span>
              <span className="flex min-h-6 items-center gap-1 pr-2 hover:text-foreground transition-colors cursor-default group/stat sm:min-h-0 sm:pr-0">
                <Download className="h-3.5 w-3.5 group-hover/stat:scale-110 transition-transform" />
                {downloadsCount}
              </span>
            </div>
            {uploaderName && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`flex min-h-7 min-w-0 items-center gap-1.5 group/uploader sm:min-h-0 ${uploaderId ? 'cursor-pointer hover:text-primary transition-colors' : 'hover:text-foreground transition-colors'}`}
                      onClick={uploaderId ? handleUploaderClick : undefined}
                    >
                      <Avatar className="h-4 w-4 ring-1 ring-border shrink-0">
                        <AvatarImage src={uploaderAvatar || undefined} alt={uploaderName} />
                        <AvatarFallback className="text-[7px] bg-primary/10 text-primary font-medium">
                          {uploaderName.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">Uploaded by {uploaderName}</span>
                      {uploaderPaperCount && uploaderPaperCount > 10 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="h-4 px-1.5 text-[10px] font-medium gap-0.5 shrink-0 bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/30">
                                <Star className="h-2.5 w-2.5 fill-current" />
                                Top
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Top Contributor - {uploaderPaperCount} papers uploaded</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View {uploaderName}'s profile ({uploaderPaperCount || 0} papers uploaded)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {instituteName && (
              <div className="flex min-h-7 min-w-0 items-center gap-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors group/inst sm:min-h-0">
                <Building2 className="h-3.5 w-3.5 group-hover/inst:scale-110 transition-transform" />
                <span className="truncate">{instituteName}</span>
              </div>
            )}
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

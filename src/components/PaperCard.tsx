import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Download, FileText, User, Building2 } from 'lucide-react';
import { BookmarkButton } from '@/components/BookmarkButton';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';

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
  semester,
  internalNumber,
  instituteName,
  createdAt,
  avgDifficulty,
  ratingsCount,
}: PaperCardProps) {
  const navigate = useNavigate();
  const [hasBeenClicked, setHasBeenClicked] = useState(false);

  // Check if paper was uploaded within last 24 hours and hasn't been clicked
  const isNewPaper = createdAt ? (Date.now() - new Date(createdAt).getTime()) < 24 * 60 * 60 * 1000 : false;
  
  useEffect(() => {
    if (isNewPaper) {
      setHasBeenClicked(getClickedPapers().has(id));
    }
  }, [id, isNewPaper]);

  const showNewAnimation = isNewPaper && !hasBeenClicked;

  const handleCardClick = () => {
    if (isNewPaper) {
      markPaperAsClicked(id);
      setHasBeenClicked(true);
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
    <Link to={`/paper/${id}`} onClick={handleCardClick}>
      <Card className={`group relative h-full transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 border-border/50 bg-card ${showNewAnimation ? 'animate-pulse-subtle ring-2 ring-primary/20' : ''}`}>
        {showNewAnimation && (
          <div className="absolute -top-2 -right-2 z-10">
            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 animate-pulse">
              NEW
            </Badge>
          </div>
        )}
        <CardContent className="p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium max-w-[120px] truncate">
                {board.toUpperCase()}
              </Badge>
              <BookmarkButton paperId={id} variant="icon" />
            </div>
          </div>
          
          <h3 className="mb-2 line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <div className="mb-4 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">
              {subject}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Class {classLevel}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {year}
            </Badge>
            {examType === 'internals' && internalNumber && (
              <Badge className="text-xs bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/30">
                Internal {internalNumber}
              </Badge>
            )}
            {examType === 'sem_paper' && semester && (
              <Badge className="text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
                Sem {semester}
              </Badge>
            )}
            <DifficultyBadge 
              difficulty={avgDifficulty as 'easy' | 'medium' | 'hard' | null} 
              ratingsCount={ratingsCount ?? 0}
            />
          </div>
          
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 hover:text-foreground transition-colors cursor-default group/stat">
                <Eye className="h-3.5 w-3.5 group-hover/stat:scale-110 transition-transform" />
                {viewsCount}
              </span>
              <span className="flex items-center gap-1 hover:text-foreground transition-colors cursor-default group/stat">
                <Download className="h-3.5 w-3.5 group-hover/stat:scale-110 transition-transform" />
                {downloadsCount}
              </span>
            </div>
            {uploaderName && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`flex items-center gap-1 group/uploader ${uploaderId ? 'cursor-pointer hover:text-primary transition-colors' : 'hover:text-foreground transition-colors'}`}
                      onClick={uploaderId ? handleUploaderClick : undefined}
                    >
                      <User className="h-3.5 w-3.5 group-hover/uploader:scale-110 transition-transform" />
                      <span className="truncate">Uploaded by {uploaderName}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Uploaded by {uploaderName}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {instituteName && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors group/inst">
                      <Building2 className="h-3.5 w-3.5 group-hover/inst:scale-110 transition-transform" />
                      <span className="truncate">{instituteName}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{instituteName}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

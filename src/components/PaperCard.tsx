import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Download, FileText, User } from 'lucide-react';
import { BookmarkButton } from '@/components/BookmarkButton';

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
}

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
}: PaperCardProps) {
  const navigate = useNavigate();

  const handleUploaderClick = (e: React.MouseEvent) => {
    if (uploaderId) {
      e.preventDefault();
      e.stopPropagation();
      navigate(`/user/${uploaderId}`);
    }
  };
  return (
    <Link to={`/paper/${id}`}>
      <Card className="group relative h-full transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 border-border/50 bg-card">
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
          </div>
          
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {viewsCount}
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-3.5 w-3.5" />
                {downloadsCount}
              </span>
            </div>
            {uploaderName && (
              <div 
                className={`flex items-center gap-1 text-muted-foreground ${uploaderId ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                onClick={uploaderId ? handleUploaderClick : undefined}
              >
                <User className="h-3.5 w-3.5" />
                <span className="truncate">Uploaded by {uploaderName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

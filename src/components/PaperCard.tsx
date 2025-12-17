import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Download, FileText } from 'lucide-react';
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
}: PaperCardProps) {
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
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
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
            <span className="capitalize">{examType.replace('_', ' ')}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

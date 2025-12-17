import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { PaperCard } from '@/components/PaperCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { supabase } from '@/integrations/supabase/client';
import { BOARDS, CLASS_LEVELS, SUBJECTS, EXAM_TYPES, YEARS, SEMESTERS, INTERNAL_NUMBERS } from '@/lib/constants';
import { Search, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuestionPaper {
  id: string;
  title: string;
  subject: string;
  board: string;
  class_level: string;
  year: number;
  exam_type: string;
  views_count: number;
  downloads_count: number;
}

export default function Browse() {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    board: '',
    classLevel: '',
    subject: '',
    year: '',
    examType: '',
    semester: '',
    internalNumber: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  const fetchPapers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('question_papers')
        .select('id, title, subject, board, class_level, year, exam_type, views_count, downloads_count, semester, internal_number')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
      if (filters.board) {
        query = query.eq('board', filters.board);
      }
      if (filters.classLevel) {
        query = query.eq('class_level', filters.classLevel);
      }
      if (filters.subject) {
        query = query.eq('subject', filters.subject);
      }
      if (filters.year) {
        query = query.eq('year', parseInt(filters.year));
      }
      if (filters.examType) {
        query = query.eq('exam_type', filters.examType);
      }
      if (filters.semester) {
        query = query.eq('semester', parseInt(filters.semester));
      }
      if (filters.internalNumber) {
        query = query.eq('internal_number', parseInt(filters.internalNumber));
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setPapers(data || []);
    } catch (error) {
      console.error('Error fetching papers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load question papers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPapers();
  };

  const clearFilters = () => {
    setFilters({
      board: '',
      classLevel: '',
      subject: '',
      year: '',
      examType: '',
      semester: '',
      internalNumber: '',
    });
    setSearchQuery('');
  };

  const showSemesterFilter = filters.examType === 'sem_paper' || filters.examType === 'internals';
  const showInternalFilter = filters.examType === 'internals';

  const hasActiveFilters = Object.values(filters).some(v => v) || searchQuery;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Browse Question Papers
          </h1>
          <p className="text-muted-foreground">
            Find past exam papers from various boards and subjects
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </form>

          {/* Filter Panel */}
          {showFilters && (
            <div className="rounded-lg border border-border bg-card p-4 animate-fade-in">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-medium text-foreground">Filter Papers</span>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-1 h-4 w-4" />
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">
                <div className="space-y-2">
                  <Label>Board</Label>
                  <SearchableSelect
                    value={filters.board}
                    onValueChange={(v) => setFilters(f => ({ ...f, board: v }))}
                    options={BOARDS}
                    placeholder="All boards"
                    searchPlaceholder="Search boards..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Class</Label>
                  <SearchableSelect
                    value={filters.classLevel}
                    onValueChange={(v) => setFilters(f => ({ ...f, classLevel: v }))}
                    options={CLASS_LEVELS}
                    placeholder="All classes"
                    searchPlaceholder="Search classes..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <SearchableSelect
                    value={filters.subject}
                    onValueChange={(v) => setFilters(f => ({ ...f, subject: v }))}
                    options={SUBJECTS}
                    placeholder="All subjects"
                    searchPlaceholder="Search subjects..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Year</Label>
                  <SearchableSelect
                    value={filters.year}
                    onValueChange={(v) => setFilters(f => ({ ...f, year: v }))}
                    options={YEARS}
                    placeholder="All years"
                    searchPlaceholder="Search years..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Exam Type</Label>
                  <SearchableSelect
                    value={filters.examType}
                    onValueChange={(v) => setFilters(f => ({ ...f, examType: v, semester: '', internalNumber: '' }))}
                    options={EXAM_TYPES}
                    placeholder="All types"
                    searchPlaceholder="Search exam types..."
                  />
                </div>

                {showSemesterFilter && (
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <SearchableSelect
                      value={filters.semester}
                      onValueChange={(v) => setFilters(f => ({ ...f, semester: v }))}
                      options={SEMESTERS}
                      placeholder="All semesters"
                      searchPlaceholder="Search semesters..."
                    />
                  </div>
                )}

                {showInternalFilter && (
                  <div className="space-y-2">
                    <Label>Internal Number</Label>
                    <SearchableSelect
                      value={filters.internalNumber}
                      onValueChange={(v) => setFilters(f => ({ ...f, internalNumber: v }))}
                      options={INTERNAL_NUMBERS}
                      placeholder="All internals"
                      searchPlaceholder="Search internals..."
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              No papers found
            </h3>
            <p className="mb-4 text-muted-foreground">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Showing {papers.length} paper{papers.length !== 1 ? 's' : ''}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {papers.map((paper) => (
                <PaperCard
                  key={paper.id}
                  id={paper.id}
                  title={paper.title}
                  subject={paper.subject}
                  board={paper.board}
                  classLevel={paper.class_level}
                  year={paper.year}
                  examType={paper.exam_type}
                  viewsCount={paper.views_count}
                  downloadsCount={paper.downloads_count}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

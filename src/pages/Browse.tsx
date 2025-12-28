import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { PaperCard } from '@/components/PaperCard';
import { ScrollAnimation } from '@/hooks/useScrollAnimation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { supabase } from '@/integrations/supabase/client';
import { BOARDS, CLASS_LEVELS, SUBJECTS, EXAM_TYPES, YEARS, SEMESTERS, INTERNAL_NUMBERS } from '@/lib/constants';
import { Search, Filter, X, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sanitizeSearchInput, browseFiltersSchema } from '@/lib/validation';

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
  user_id: string;
  semester: number | null;
  internal_number: number | null;
  institute_name: string | null;
  uploaderName?: string | null;
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
    instituteName: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  const fetchPapers = async () => {
    setLoading(true);
    try {
      // Validate filters using zod schema
      const validatedFilters = browseFiltersSchema.safeParse(filters);
      if (!validatedFilters.success) {
        toast({
          title: 'Invalid filters',
          description: 'Some filter values are invalid',
          variant: 'destructive',
        });
        return;
      }

      let query = supabase
        .from('question_papers')
        .select('id, title, subject, board, class_level, year, exam_type, views_count, downloads_count, semester, internal_number, institute_name, user_id')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      // Sanitize search query to prevent issues with special characters
      const sanitizedSearch = sanitizeSearchInput(searchQuery);
      if (sanitizedSearch) {
        query = query.ilike('title', `%${sanitizedSearch}%`);
      }
      if (validatedFilters.data.board) {
        query = query.eq('board', validatedFilters.data.board);
      }
      if (validatedFilters.data.classLevel) {
        query = query.eq('class_level', validatedFilters.data.classLevel);
      }
      if (validatedFilters.data.subject) {
        query = query.eq('subject', validatedFilters.data.subject);
      }
      if (validatedFilters.data.year) {
        const yearNum = parseInt(validatedFilters.data.year);
        if (!isNaN(yearNum) && yearNum >= 2000 && yearNum <= new Date().getFullYear() + 1) {
          query = query.eq('year', yearNum);
        }
      }
      if (validatedFilters.data.examType) {
        query = query.eq('exam_type', validatedFilters.data.examType);
      }
      if (validatedFilters.data.semester) {
        const semNum = parseInt(validatedFilters.data.semester);
        if (!isNaN(semNum) && semNum >= 1 && semNum <= 8) {
          query = query.eq('semester', semNum);
        }
      }
      if (validatedFilters.data.internalNumber) {
        const intNum = parseInt(validatedFilters.data.internalNumber);
        if (!isNaN(intNum) && intNum >= 1 && intNum <= 3) {
          query = query.eq('internal_number', intNum);
        }
      }
      if (validatedFilters.data.instituteName) {
        const sanitizedInstitute = sanitizeSearchInput(validatedFilters.data.instituteName);
        if (sanitizedInstitute) {
          query = query.ilike('institute_name', `%${sanitizedInstitute}%`);
        }
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      
      // Fetch uploader names for all papers
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
        setPapers(papersWithUploaders);
      } else {
        setPapers([]);
      }
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
      instituteName: '',
    });
    setSearchQuery('');
  };

  const showSemesterFilter = filters.examType === 'sem_paper' || filters.examType === 'internals';
  const showInternalFilter = filters.examType === 'internals';

  const hasActiveFilters = Object.values(filters).some(v => v) || searchQuery;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 flex-1 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
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

                <div className="space-y-2">
                  <Label>Institute Name</Label>
                  <Input
                    placeholder="Type institute name..."
                    value={filters.instituteName}
                    onChange={(e) => setFilters(f => ({ ...f, instituteName: e.target.value }))}
                    className="h-10"
                  />
                </div>
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
              {papers.map((paper, index) => (
                <ScrollAnimation
                  key={paper.id}
                  animation="fade-up"
                  delay={Math.min(index * 50, 300)}
                  duration={400}
                >
                  <PaperCard
                    id={paper.id}
                    title={paper.title}
                    subject={paper.subject}
                    board={paper.board}
                    classLevel={paper.class_level}
                    year={paper.year}
                    examType={paper.exam_type}
                    viewsCount={paper.views_count}
                    downloadsCount={paper.downloads_count}
                    uploaderName={paper.uploaderName}
                    uploaderId={paper.user_id}
                    semester={paper.semester}
                    internalNumber={paper.internal_number}
                    instituteName={paper.institute_name}
                  />
                </ScrollAnimation>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Target, 
  BookOpen, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle2,
  FileText,
  Clock,
  TrendingUp,
  Sparkles,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStudyPlans, StudyPlan, StudyPlanItem } from '@/hooks/useStudyPlans';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { format, differenceInDays, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { SUBJECTS } from '@/lib/constants';

interface RecommendedPaper {
  id: string;
  title: string;
  subject: string;
  board: string;
  class_level: string;
  year: number;
}

export default function StudyPlanPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    plans, 
    loading, 
    createPlan, 
    updatePlan, 
    deletePlan,
    fetchPlanItems,
    addPlanItem,
    updatePlanItem,
    deletePlanItem
  } = useStudyPlans();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [planItems, setPlanItems] = useState<StudyPlanItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [recommendedPapers, setRecommendedPapers] = useState<RecommendedPaper[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // New plan form state
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanExam, setNewPlanExam] = useState('');
  const [newPlanDate, setNewPlanDate] = useState<Date>();
  const [newPlanSubjects, setNewPlanSubjects] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Add item form state
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDate, setNewItemDate] = useState<Date>();
  const [newItemNotes, setNewItemNotes] = useState('');

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth?redirect=/study-plan');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (selectedPlan) {
      loadPlanItems(selectedPlan.id);
      loadRecommendations(selectedPlan.subjects || []);
    }
  }, [selectedPlan]);

  const loadPlanItems = async (planId: string) => {
    setLoadingItems(true);
    const items = await fetchPlanItems(planId);
    setPlanItems(items);
    setLoadingItems(false);
  };

  const loadRecommendations = async (subjects: string[]) => {
    if (subjects.length === 0) {
      setRecommendedPapers([]);
      return;
    }

    setLoadingRecommendations(true);
    try {
      const { data, error } = await supabase
        .from('question_papers')
        .select('id, title, subject, board, class_level, year')
        .eq('status', 'approved')
        .in('subject', subjects)
        .order('views_count', { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecommendedPapers(data);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) return;

    setCreating(true);
    const plan = await createPlan({
      name: newPlanName,
      target_exam: newPlanExam || null,
      target_date: newPlanDate ? format(newPlanDate, 'yyyy-MM-dd') : null,
      subjects: newPlanSubjects.length > 0 ? newPlanSubjects : null,
      status: 'active',
    });

    if (plan) {
      setCreateDialogOpen(false);
      setNewPlanName('');
      setNewPlanExam('');
      setNewPlanDate(undefined);
      setNewPlanSubjects([]);
      setSelectedPlan(plan);
    }
    setCreating(false);
  };

  const handleAddItem = async () => {
    if (!selectedPlan || !newItemTitle.trim()) return;

    const item = await addPlanItem({
      plan_id: selectedPlan.id,
      title: newItemTitle,
      paper_id: null,
      day_number: planItems.length + 1,
      scheduled_date: newItemDate ? format(newItemDate, 'yyyy-MM-dd') : null,
      completed: false,
      notes: newItemNotes || null,
    });

    if (item) {
      setPlanItems(prev => [...prev, item]);
      setAddItemDialogOpen(false);
      setNewItemTitle('');
      setNewItemDate(undefined);
      setNewItemNotes('');
    }
  };

  const handleAddPaperToplan = async (paper: RecommendedPaper) => {
    if (!selectedPlan) return;

    const item = await addPlanItem({
      plan_id: selectedPlan.id,
      title: paper.title,
      paper_id: paper.id,
      day_number: planItems.length + 1,
      scheduled_date: null,
      completed: false,
      notes: `${paper.subject} - ${paper.board} - ${paper.year}`,
    });

    if (item) {
      setPlanItems(prev => [...prev, item]);
    }
  };

  const handleToggleComplete = async (item: StudyPlanItem) => {
    await updatePlanItem(item.id, { completed: !item.completed });
    setPlanItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, completed: !i.completed } : i
    ));
  };

  const handleDeleteItem = async (itemId: string) => {
    await deletePlanItem(itemId);
    setPlanItems(prev => prev.filter(i => i.id !== itemId));
  };

  const getProgress = () => {
    if (planItems.length === 0) return 0;
    const completed = planItems.filter(i => i.completed).length;
    return Math.round((completed / planItems.length) * 100);
  };

  const getDaysUntilExam = () => {
    if (!selectedPlan?.target_date) return null;
    return differenceInDays(new Date(selectedPlan.target_date), new Date());
  };

  const toggleSubject = (subject: string) => {
    setNewPlanSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">Sign in to create study plans</h1>
          <p className="mb-6 text-muted-foreground">
            Create personalized study schedules and track your progress.
          </p>
          <Link to="/auth?redirect=/study-plan">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">Study Plans</h1>
            <p className="text-muted-foreground">Create and manage your personalized study schedules</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Study Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Plan Name *</Label>
                  <Input
                    id="plan-name"
                    placeholder="e.g., Board Exam Preparation"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-exam">Target Exam (Optional)</Label>
                  <Input
                    id="target-exam"
                    placeholder="e.g., CBSE Class 12 Boards"
                    value={newPlanExam}
                    onChange={(e) => setNewPlanExam(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newPlanDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newPlanDate ? format(newPlanDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newPlanDate}
                        onSelect={setNewPlanDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Subjects (Select multiple)</Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {SUBJECTS.slice(0, 20).map((subject) => (
                      <Badge
                        key={subject.value}
                        variant={newPlanSubjects.includes(subject.label) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSubject(subject.label)}
                      >
                        {subject.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlan} disabled={creating || !newPlanName.trim()}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Plans List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Plans</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))
                ) : plans.length === 0 ? (
                  <div className="py-8 text-center">
                    <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No study plans yet</p>
                    <p className="text-xs text-muted-foreground">Create your first plan to get started</p>
                  </div>
                ) : (
                  plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={cn(
                        "cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50",
                        selectedPlan?.id === plan.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">{plan.name}</h4>
                          {plan.target_exam && (
                            <p className="text-xs text-muted-foreground">{plan.target_exam}</p>
                          )}
                        </div>
                        <Badge 
                          variant={plan.status === 'active' ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {plan.status}
                        </Badge>
                      </div>
                      {plan.target_date && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(plan.target_date), 'MMM d, yyyy')}
                        </div>
                      )}
                      {plan.subjects && plan.subjects.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {plan.subjects.slice(0, 3).map((subject) => (
                            <Badge key={subject} variant="outline" className="text-[9px] px-1 py-0">
                              {subject}
                            </Badge>
                          ))}
                          {plan.subjects.length > 3 && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              +{plan.subjects.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Plan Details */}
          <div className="lg:col-span-2">
            {selectedPlan ? (
              <div className="space-y-6">
                {/* Plan Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{selectedPlan.name}</CardTitle>
                        {selectedPlan.target_exam && (
                          <CardDescription>{selectedPlan.target_exam}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {selectedPlan.status === 'active' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updatePlan(selectedPlan.id, { status: 'paused' })}
                          >
                            <Pause className="mr-1 h-3 w-3" />
                            Pause
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updatePlan(selectedPlan.id, { status: 'active' })}
                          >
                            <Play className="mr-1 h-3 w-3" />
                            Resume
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            deletePlan(selectedPlan.id);
                            setSelectedPlan(null);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <TrendingUp className="mx-auto mb-1 h-5 w-5 text-primary" />
                        <p className="text-2xl font-bold">{getProgress()}%</p>
                        <p className="text-xs text-muted-foreground">Progress</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-green-500" />
                        <p className="text-2xl font-bold">
                          {planItems.filter(i => i.completed).length}/{planItems.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <Clock className="mx-auto mb-1 h-5 w-5 text-orange-500" />
                        <p className="text-2xl font-bold">
                          {getDaysUntilExam() !== null ? `${getDaysUntilExam()}` : '-'}
                        </p>
                        <p className="text-xs text-muted-foreground">Days Left</p>
                      </div>
                    </div>
                    <Progress value={getProgress()} className="mt-4" />
                  </CardContent>
                </Card>

                {/* Study Items */}
                <Tabs defaultValue="items">
                  <TabsList>
                    <TabsTrigger value="items">Study Items</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  </TabsList>

                  <TabsContent value="items" className="mt-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Study Items</CardTitle>
                        <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="mr-1 h-3 w-3" />
                              Add Item
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Study Item</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Title *</Label>
                                <Input
                                  placeholder="e.g., Complete Chapter 5 revision"
                                  value={newItemTitle}
                                  onChange={(e) => setNewItemTitle(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Scheduled Date (Optional)</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !newItemDate && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {newItemDate ? format(newItemDate, "PPP") : "Pick a date"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={newItemDate}
                                      onSelect={setNewItemDate}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="space-y-2">
                                <Label>Notes (Optional)</Label>
                                <Textarea
                                  placeholder="Add any notes..."
                                  value={newItemNotes}
                                  onChange={(e) => setNewItemNotes(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddItem} disabled={!newItemTitle.trim()}>
                                Add Item
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardHeader>
                      <CardContent>
                        {loadingItems ? (
                          <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Skeleton key={i} className="h-14 w-full" />
                            ))}
                          </div>
                        ) : planItems.length === 0 ? (
                          <div className="py-8 text-center">
                            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No items yet</p>
                            <p className="text-xs text-muted-foreground">Add study items or papers from recommendations</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {planItems.map((item) => (
                              <div
                                key={item.id}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg border p-3 transition-all",
                                  item.completed 
                                    ? "border-green-500/30 bg-green-500/5" 
                                    : "border-border"
                                )}
                              >
                                <Checkbox
                                  checked={item.completed}
                                  onCheckedChange={() => handleToggleComplete(item)}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "font-medium",
                                    item.completed && "line-through text-muted-foreground"
                                  )}>
                                    {item.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {item.scheduled_date && (
                                      <span className="flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        {format(new Date(item.scheduled_date), 'MMM d')}
                                      </span>
                                    )}
                                    {item.notes && (
                                      <span className="truncate">{item.notes}</span>
                                    )}
                                  </div>
                                </div>
                                {item.paper_id && (
                                  <Link to={`/paper/${item.paper_id}`}>
                                    <Button variant="ghost" size="sm">
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="recommendations" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Recommended Papers
                        </CardTitle>
                        <CardDescription>
                          Based on your selected subjects
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingRecommendations ? (
                          <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <Skeleton key={i} className="h-14 w-full" />
                            ))}
                          </div>
                        ) : recommendedPapers.length === 0 ? (
                          <div className="py-8 text-center">
                            <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No recommendations</p>
                            <p className="text-xs text-muted-foreground">Add subjects to your plan to get paper recommendations</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {recommendedPapers.map((paper) => (
                              <div
                                key={paper.id}
                                className="flex items-center justify-between rounded-lg border border-border p-3 transition-all hover:border-primary/50"
                              >
                                <div className="min-w-0 flex-1">
                                  <Link 
                                    to={`/paper/${paper.id}`}
                                    className="font-medium text-foreground hover:text-primary line-clamp-1"
                                  >
                                    {paper.title}
                                  </Link>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-[10px]">
                                      {paper.subject}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px]">
                                      {paper.year}
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddPaperToplan(paper)}
                                  disabled={planItems.some(i => i.paper_id === paper.id)}
                                >
                                  {planItems.some(i => i.paper_id === paper.id) ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Plus className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">Select a plan</h3>
                  <p className="text-muted-foreground">
                    Choose a study plan from the list or create a new one
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

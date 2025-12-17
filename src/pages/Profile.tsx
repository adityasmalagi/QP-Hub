import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, FileText, Download, Eye, Save, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BOARDS, CLASS_LEVELS } from '@/lib/constants';

interface Profile {
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  class_level: string | null;
  board: string | null;
  year: number | null;
  course: string | null;
  semester: number | null;
}

interface Paper {
  id: string;
  title: string;
  subject: string;
  board: string;
  class_level: string;
  year: number;
  status: string;
  views_count: number;
  downloads_count: number;
  created_at: string;
}

const COURSES = [
  'Science',
  'Commerce',
  'Arts/Humanities',
  'Engineering',
  'Medical',
  'Law',
  'Management',
  'Other'
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - i);

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ 
    full_name: '', 
    bio: '', 
    avatar_url: '',
    class_level: '',
    board: '',
    year: null,
    course: '',
    semester: null
  });
  const [myPapers, setMyPapers] = useState<Paper[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const isUndergraduate = profile.class_level === 'undergraduate' || profile.class_level === 'postgraduate';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyPapers();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, bio, avatar_url, class_level, board, year, course, semester')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        full_name: data.full_name || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        class_level: data.class_level || '',
        board: data.board || '',
        year: data.year || null,
        course: data.course || '',
        semester: data.semester || null
      });
    }
    setLoadingProfile(false);
  };

  const fetchMyPapers = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('question_papers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setMyPapers(data);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        bio: profile.bio,
        class_level: profile.class_level || null,
        board: profile.board || null,
        year: profile.year,
        course: profile.course || null,
        semester: isUndergraduate ? profile.semester : null
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
    }
    setSaving(false);
  };

  const deletePaper = async (paperId: string) => {
    const { error } = await supabase
      .from('question_papers')
      .delete()
      .eq('id', paperId);

    if (error) {
      toast.error('Failed to delete paper');
    } else {
      toast.success('Paper deleted');
      fetchMyPapers();
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto flex items-center justify-center px-4 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">My Profile</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="papers" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Papers ({myPapers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="max-w-2xl border-border bg-card">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details visible to other users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Write a short bio about yourself..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(profile.bio || '').length}/500 characters
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="class">Class/Level</Label>
                    <Select 
                      value={profile.class_level || ''} 
                      onValueChange={(value) => setProfile({ ...profile, class_level: value, semester: null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASS_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="board">Board</Label>
                    <Select 
                      value={profile.board || ''} 
                      onValueChange={(value) => setProfile({ ...profile, board: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select board" />
                      </SelectTrigger>
                      <SelectContent>
                        {BOARDS.map((board) => (
                          <SelectItem key={board.value} value={board.value}>{board.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select 
                      value={profile.year?.toString() || ''} 
                      onValueChange={(value) => setProfile({ ...profile, year: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((year) => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course">Course/Stream</Label>
                    <Select 
                      value={profile.course || ''} 
                      onValueChange={(value) => setProfile({ ...profile, course: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSES.map((course) => (
                          <SelectItem key={course} value={course}>{course}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isUndergraduate && (
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select 
                      value={profile.semester?.toString() || ''} 
                      onValueChange={(value) => setProfile({ ...profile, semester: parseInt(value) })}
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={handleSaveProfile} disabled={saving} className="gradient-primary">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="papers">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>My Uploaded Papers</CardTitle>
                <CardDescription>
                  Manage your uploaded question papers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myPapers.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">You haven't uploaded any papers yet</p>
                    <Link to="/upload">
                      <Button className="mt-4 gradient-primary">Upload Your First Paper</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myPapers.map((paper) => (
                      <div key={paper.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link to={`/paper/${paper.id}`} className="font-medium text-foreground hover:text-primary">
                              {paper.title}
                            </Link>
                            <Badge 
                              variant={paper.status === 'approved' ? 'default' : paper.status === 'pending' ? 'secondary' : 'destructive'}
                            >
                              {paper.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{paper.subject}</Badge>
                            <Badge variant="outline">{paper.board}</Badge>
                            <Badge variant="outline">Class {paper.class_level}</Badge>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" /> {paper.views_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" /> {paper.downloads_count}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deletePaper(paper.id)}
                        >
                          Delete
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
    </div>
  );
}
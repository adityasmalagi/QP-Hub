import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { User, FileText, Download, Eye, Save, Loader2, Settings, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BOARDS, CLASS_LEVELS, ENGINEERING_BRANCHES } from '@/lib/constants';

interface Profile {
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  class_level: string | null;
  board: string | null;
  year: number | null;
  course: string | null;
  semester: number | null;
  age: number | null;
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

interface DownloadedPaper {
  id: string;
  paper_id: string;
  downloaded_at: string;
  paper: {
    id: string;
    title: string;
    subject: string;
    board: string;
    class_level: string;
    year: number;
  } | null;
}

interface ValidationErrors {
  full_name?: string;
  class_level?: string;
  board?: string;
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
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';
  
  const [profile, setProfile] = useState<Profile>({ 
    full_name: '', 
    bio: '', 
    avatar_url: '',
    class_level: '',
    board: '',
    year: null,
    course: '',
    semester: null,
    age: null
  });
  const [myPapers, setMyPapers] = useState<Paper[]>([]);
  const [downloads, setDownloads] = useState<DownloadedPaper[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingDownloads, setLoadingDownloads] = useState(true);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [settingsAge, setSettingsAge] = useState<number | null>(null);

  const isEngineeringBranch = ENGINEERING_BRANCHES.includes(profile.class_level || '');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyPapers();
      fetchDownloads();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, bio, avatar_url, class_level, board, year, course, semester, age')
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
        semester: data.semester || null,
        age: data.age || null
      });
      setSettingsAge(data.age || null);
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

  const fetchDownloads = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_downloads')
      .select(`
        id,
        paper_id,
        downloaded_at,
        paper:question_papers(id, title, subject, board, class_level, year)
      `)
      .eq('user_id', user.id)
      .order('downloaded_at', { ascending: false });

    if (data) {
      setDownloads(data as DownloadedPaper[]);
    }
    setLoadingDownloads(false);
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!profile.full_name || profile.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name is required (min 2 characters)';
    }
    
    if (!profile.class_level) {
      newErrors.class_level = 'Class/Level is required';
    }
    
    if (!profile.board) {
      newErrors.board = 'Board is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name?.trim(),
        bio: profile.bio,
        class_level: profile.class_level || null,
        board: profile.board || null,
        year: profile.year,
        course: profile.course || null,
        semester: isEngineeringBranch ? profile.semester : null
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
    }
    setSaving(false);
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setSavingSettings(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        age: settingsAge
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update settings');
    } else {
      toast.success('Settings updated successfully');
      setProfile(prev => ({ ...prev, age: settingsAge }));
    }
    setSavingSettings(false);
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

  const removeDownload = async (downloadId: string) => {
    const { error } = await supabase
      .from('user_downloads')
      .delete()
      .eq('id', downloadId);

    if (error) {
      toast.error('Failed to remove from downloads');
    } else {
      toast.success('Removed from downloads');
      fetchDownloads();
    }
  };

  const isFormValid = profile.full_name && profile.full_name.trim().length >= 2 && profile.class_level && profile.board;

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

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="papers" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Papers ({myPapers.length})
            </TabsTrigger>
            <TabsTrigger value="downloads" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Downloads ({downloads.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="max-w-2xl border-border bg-card">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile details visible to other users. Fields marked with * are required.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name || ''}
                    onChange={(e) => {
                      setProfile({ ...profile, full_name: e.target.value });
                      if (errors.full_name) setErrors({ ...errors, full_name: undefined });
                    }}
                    placeholder="Enter your full name"
                    className={errors.full_name ? 'border-destructive' : ''}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-destructive">{errors.full_name}</p>
                  )}
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
                    <Label htmlFor="class">Class/Level *</Label>
                    <Select 
                      value={profile.class_level || ''} 
                      onValueChange={(value) => {
                        setProfile({ ...profile, class_level: value, semester: null });
                        if (errors.class_level) setErrors({ ...errors, class_level: undefined });
                      }}
                    >
                      <SelectTrigger className={errors.class_level ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASS_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.class_level && (
                      <p className="text-sm text-destructive">{errors.class_level}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="board">Board *</Label>
                    <Select 
                      value={profile.board || ''} 
                      onValueChange={(value) => {
                        setProfile({ ...profile, board: value });
                        if (errors.board) setErrors({ ...errors, board: undefined });
                      }}
                    >
                      <SelectTrigger className={errors.board ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select board" />
                      </SelectTrigger>
                      <SelectContent>
                        {BOARDS.map((board) => (
                          <SelectItem key={board.value} value={board.value}>{board.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.board && (
                      <p className="text-sm text-destructive">{errors.board}</p>
                    )}
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

                {isEngineeringBranch && (
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

                <Button 
                  onClick={handleSaveProfile} 
                  disabled={saving || !isFormValid} 
                  className="gradient-primary"
                >
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

          <TabsContent value="downloads">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>My Downloads</CardTitle>
                <CardDescription>
                  Papers you have downloaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDownloads ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : downloads.length === 0 ? (
                  <div className="py-8 text-center">
                    <Download className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">You haven't downloaded any papers yet</p>
                    <Link to="/browse">
                      <Button className="mt-4 gradient-primary">Browse Papers</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {downloads.map((download) => (
                      <div key={download.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="space-y-1">
                          {download.paper ? (
                            <>
                              <Link to={`/paper/${download.paper.id}`} className="font-medium text-foreground hover:text-primary">
                                {download.paper.title}
                              </Link>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline">{download.paper.subject}</Badge>
                                <Badge variant="outline">{download.paper.board}</Badge>
                                <Badge variant="outline">Class {download.paper.class_level}</Badge>
                                <span>Downloaded: {new Date(download.downloaded_at).toLocaleDateString()}</span>
                              </div>
                            </>
                          ) : (
                            <p className="text-muted-foreground">Paper no longer available</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeDownload(download.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="max-w-2xl border-border bg-card">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={user.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min={10}
                    max={100}
                    value={settingsAge || ''}
                    onChange={(e) => setSettingsAge(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Enter your age"
                    className="w-full sm:w-48"
                  />
                </div>

                <Button 
                  onClick={handleSaveSettings} 
                  disabled={savingSettings} 
                  className="gradient-primary"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

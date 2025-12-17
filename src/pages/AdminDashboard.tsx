import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Users, 
  Download, 
  Eye, 
  Check, 
  X, 
  Clock,
  Shield,
  ShieldOff,
  Search,
  Settings,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

interface Paper {
  id: string;
  title: string;
  subject: string;
  board: string;
  class_level: string;
  year: number;
  status: string;
  created_at: string;
  views_count: number;
  downloads_count: number;
  institute_name: string | null;
}

interface UserWithRole {
  id: string;
  full_name: string | null;
  created_at: string | null;
  isAdmin: boolean;
}

interface Stats {
  totalPapers: number;
  pendingPapers: number;
  approvedPapers: number;
  totalDownloads: number;
  totalViews: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const { theme, setTheme } = useTheme();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPapers: 0,
    pendingPapers: 0,
    approvedPapers: 0,
    totalDownloads: 0,
    totalViews: 0,
    totalUsers: 0
  });
  const [loadingPapers, setLoadingPapers] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
      toast.error('Access denied. Admin privileges required.');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchPapers();
      fetchStats();
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast.error('Failed to load users');
      setLoadingUsers(false);
      return;
    }

    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError) {
      toast.error('Failed to load user roles');
      setLoadingUsers(false);
      return;
    }

    const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);
    const usersWithRoles: UserWithRole[] = (profiles || []).map(p => ({
      id: p.id,
      full_name: p.full_name,
      created_at: p.created_at,
      isAdmin: adminUserIds.has(p.id)
    }));

    setUsers(usersWithRoles);
    setLoadingUsers(false);
  };

  const toggleAdminRole = async (userId: string, currentlyAdmin: boolean) => {
    if (userId === user?.id) {
      toast.error("You cannot modify your own admin role");
      return;
    }

    if (currentlyAdmin) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) {
        toast.error('Failed to remove admin role');
      } else {
        toast.success('Admin role removed');
        fetchUsers();
      }
    } else {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) {
        toast.error('Failed to grant admin role');
      } else {
        toast.success('Admin role granted');
        fetchUsers();
      }
    }
  };

  const fetchPapers = async () => {
    const { data, error } = await supabase
      .from('question_papers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load papers');
    } else {
      setPapers(data || []);
    }
    setLoadingPapers(false);
  };

  const fetchStats = async () => {
    const { data: papersData } = await supabase
      .from('question_papers')
      .select('status, views_count, downloads_count');

    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (papersData) {
      const totalDownloads = papersData.reduce((sum, p) => sum + (p.downloads_count || 0), 0);
      const totalViews = papersData.reduce((sum, p) => sum + (p.views_count || 0), 0);
      const pendingPapers = papersData.filter(p => p.status === 'pending').length;
      const approvedPapers = papersData.filter(p => p.status === 'approved').length;

      setStats({
        totalPapers: papersData.length,
        pendingPapers,
        approvedPapers,
        totalDownloads,
        totalViews,
        totalUsers: usersCount || 0
      });
    }
  };

  const updatePaperStatus = async (paperId: string, status: string) => {
    const { error } = await supabase
      .from('question_papers')
      .update({ status })
      .eq('id', paperId);

    if (error) {
      toast.error('Failed to update paper status');
    } else {
      toast.success(`Paper ${status === 'approved' ? 'approved' : 'rejected'}`);
      fetchPapers();
      fetchStats();
    }
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
      fetchPapers();
      fetchStats();
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const pendingPapers = papers.filter(p => p.status === 'pending');
  const allPapers = papers;
  
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !userSearch || 
        (u.full_name?.toLowerCase().includes(userSearch.toLowerCase()));
      const matchesRole = roleFilter === 'all' || 
        (roleFilter === 'admin' && u.isAdmin) || 
        (roleFilter === 'user' && !u.isAdmin);
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, roleFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Papers</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalPapers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.approvedPapers} approved, {stats.pendingPapers} pending
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalDownloads}</div>
              <p className="text-xs text-muted-foreground">All time downloads</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalViews}</div>
              <p className="text-xs text-muted-foreground">All time views</p>
            </CardContent>
          </Card>
        </div>

        {/* Papers Management */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingPapers.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              All Papers ({allPapers.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Pending Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPapers ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : pendingPapers.length === 0 ? (
                  <p className="text-muted-foreground">No pending submissions</p>
                ) : (
                  <div className="space-y-4">
                    {pendingPapers.map((paper) => (
                      <div key={paper.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="space-y-1">
                          <h3 className="font-medium text-foreground">{paper.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{paper.subject}</Badge>
                            <Badge variant="outline">{paper.board}</Badge>
                            <Badge variant="outline">Class {paper.class_level}</Badge>
                            <Badge variant="outline">{paper.year}</Badge>
                            {paper.institute_name && (
                              <Badge variant="outline" className="text-xs">{paper.institute_name}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updatePaperStatus(paper.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updatePaperStatus(paper.id, 'rejected')}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>All Papers</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPapers ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : allPapers.length === 0 ? (
                  <p className="text-muted-foreground">No papers found</p>
                ) : (
                  <div className="space-y-4">
                    {allPapers.map((paper) => (
                      <div key={paper.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{paper.title}</h3>
                            <Badge 
                              variant={paper.status === 'approved' ? 'default' : paper.status === 'pending' ? 'secondary' : 'destructive'}
                            >
                              {paper.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{paper.subject}</Badge>
                            <Badge variant="outline">{paper.board}</Badge>
                            {paper.institute_name && (
                              <Badge variant="outline" className="text-xs">{paper.institute_name}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {paper.views_count} views • {paper.downloads_count} downloads
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {paper.status !== 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updatePaperStatus(paper.id, 'approved')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deletePaper(paper.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={(value: 'all' | 'admin' | 'user') => setRoleFilter(value)}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="admin">Admins Only</SelectItem>
                      <SelectItem value="user">Non-Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-muted-foreground">No users found</p>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">
                              {u.full_name || 'Unnamed User'}
                            </h3>
                            {u.isAdmin && (
                              <Badge className="bg-primary">Admin</Badge>
                            )}
                            {u.id === user?.id && (
                              <Badge variant="outline">You</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={u.isAdmin ? "destructive" : "default"}
                          onClick={() => toggleAdminRole(u.id, u.isAdmin)}
                          disabled={u.id === user?.id}
                        >
                          {u.isAdmin ? (
                            <>
                              <ShieldOff className="mr-1 h-4 w-4" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <Shield className="mr-1 h-4 w-4" />
                              Make Admin
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium">Theme</Label>
                  <p className="text-sm text-muted-foreground">Choose the appearance of the site</p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                      className="flex items-center gap-2"
                    >
                      <Sun className="h-4 w-4" />
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                      className="flex items-center gap-2"
                    >
                      <Moon className="h-4 w-4" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      onClick={() => setTheme('system')}
                      className="flex items-center gap-2"
                    >
                      <Monitor className="h-4 w-4" />
                      System Default
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
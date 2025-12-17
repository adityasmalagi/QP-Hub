import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { User, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { PaperCard } from '@/components/PaperCard';

interface PublicProfileData {
  id: string;
  full_name: string | null;
  bio: string | null;
  class_level: string | null;
  board: string | null;
  course: string | null;
}

interface UploadedPaper {
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

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [papers, setPapers] = useState<UploadedPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfileAndPapers();
    }
  }, [userId]);

  const fetchProfileAndPapers = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, bio, class_level, board, course')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch approved papers by this user
      const { data: papersData, error: papersError } = await supabase
        .from('question_papers')
        .select('id, title, subject, board, class_level, year, exam_type, views_count, downloads_count')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (papersError) throw papersError;
      setPapers(papersData || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold text-foreground">User not found</h1>
          <p className="mb-6 text-muted-foreground">
            The profile you're looking for doesn't exist.
          </p>
          <Link to="/browse" className="text-primary hover:underline">
            Browse Papers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link
          to="/browse"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Browse
        </Link>

        {/* Profile Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {profile.full_name || 'Anonymous User'}
                </h1>
                
                {(profile.class_level || profile.board || profile.course) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.class_level && (
                      <Badge variant="secondary">{profile.class_level}</Badge>
                    )}
                    {profile.board && (
                      <Badge variant="outline">{profile.board}</Badge>
                    )}
                    {profile.course && (
                      <Badge variant="outline">{profile.course}</Badge>
                    )}
                  </div>
                )}
                
                {profile.bio && (
                  <p className="mt-4 text-muted-foreground">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Papers Section */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
            <FileText className="h-5 w-5" />
            Uploaded Papers ({papers.length})
          </h2>
          
          {papers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No papers uploaded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
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
          )}
        </div>
      </div>
    </div>
  );
}

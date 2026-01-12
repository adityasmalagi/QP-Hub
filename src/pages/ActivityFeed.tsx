import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Users, RefreshCw } from 'lucide-react';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { ActivityFeedCard } from '@/components/ActivityFeedCard';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

export default function ActivityFeed() {
  const { user } = useAuth();
  const { activities, loading, error, refresh } = useActivityFeed();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <Activity className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold">Sign in to see activity</h1>
          <p className="mb-6 text-muted-foreground">
            Follow other users to see their activity in your feed.
          </p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity Feed</h1>
            <p className="text-sm text-muted-foreground">See what people you follow are up to</p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {error}
            </CardContent>
          </Card>
        ) : activities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No activity yet</h3>
              <p className="mb-4 text-muted-foreground">
                Follow other users to see their activity here.
              </p>
              <Link to="/browse">
                <Button variant="outline">Browse Papers</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityFeedCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

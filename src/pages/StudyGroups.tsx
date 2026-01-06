import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useStudyGroups } from '@/hooks/useStudyGroups';
import { GroupCard } from '@/components/GroupCard';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Loader2, Users, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function StudyGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { groups, myGroups, loading, joinGroup, leaveGroup } = useStudyGroups();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(user ? 'my-groups' : 'discover');

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMyGroups = myGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGroupCreated = (groupId: string) => {
    navigate(`/groups/${groupId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Study Groups</h1>
            <p className="text-muted-foreground mt-1">
              Join groups to collaborate and share papers with fellow students
            </p>
          </div>
          {user && <CreateGroupModal onSuccess={handleGroupCreated} />}
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            {user && <TabsTrigger value="my-groups">My Groups</TabsTrigger>}
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>

          {user && (
            <TabsContent value="my-groups">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredMyGroups.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-1">
                    {searchQuery ? 'No groups found' : "You haven't joined any groups yet"}
                  </h3>
                  <p className="text-sm">
                    {searchQuery
                      ? 'Try a different search term'
                      : 'Create a new group or discover existing ones!'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredMyGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      onLeave={leaveGroup}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="discover">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="mx-auto h-16 w-16 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-1">
                  {searchQuery ? 'No groups found' : 'No public groups yet'}
                </h3>
                <p className="text-sm">
                  {searchQuery ? 'Try a different search term' : 'Be the first to create one!'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onJoin={joinGroup}
                    onLeave={leaveGroup}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

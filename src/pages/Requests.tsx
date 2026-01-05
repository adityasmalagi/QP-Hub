import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { usePaperRequests } from '@/hooks/usePaperRequests';
import { PaperRequestCard } from '@/components/PaperRequestCard';
import { CreateRequestModal } from '@/components/CreateRequestModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileQuestion } from 'lucide-react';

export default function Requests() {
  const { requests, loading, toggleUpvote, deleteRequest, refetch } = usePaperRequests();
  const [activeTab, setActiveTab] = useState<'open' | 'fulfilled' | 'closed'>('open');

  const handleTabChange = (value: string) => {
    const status = value as 'open' | 'fulfilled' | 'closed';
    setActiveTab(status);
    refetch(status);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Paper Requests</h1>
            <p className="text-muted-foreground mt-1">
              Request papers you need or help fulfill requests from others
            </p>
          </div>
          <CreateRequestModal onSuccess={() => refetch('open')} />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList>
            <TabsTrigger value="open">Open Requests</TabsTrigger>
            <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileQuestion className="mx-auto h-16 w-16 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-1">No {activeTab} requests</h3>
                <p className="text-sm">
                  {activeTab === 'open' 
                    ? 'Be the first to request a paper!' 
                    : `No ${activeTab} requests yet.`
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {requests.map((request) => (
                  <PaperRequestCard
                    key={request.id}
                    request={request}
                    onUpvote={toggleUpvote}
                    onDelete={deleteRequest}
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

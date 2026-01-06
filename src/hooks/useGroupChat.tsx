import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string | null;
  content: string;
  message_type: 'text' | 'paper_share' | 'system';
  paper_reference_id: string | null;
  created_at: string;
  user_name?: string | null;
  user_avatar?: string | null;
  paper_title?: string | null;
}

export function useGroupChat(groupId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!groupId) return;

    try {
      const { data: messagesData, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set(messagesData?.filter(m => m.user_id).map(m => m.user_id!) || [])];
      const paperIds = [...new Set(messagesData?.filter(m => m.paper_reference_id).map(m => m.paper_reference_id!) || [])];

      let profiles: Record<string, { name: string | null; avatar: string | null }> = {};
      let papers: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        profilesData?.forEach(p => {
          profiles[p.id] = { name: p.full_name, avatar: p.avatar_url };
        });
      }

      if (paperIds.length > 0) {
        const { data: papersData } = await supabase
          .from('question_papers')
          .select('id, title')
          .in('id', paperIds);

        papersData?.forEach(p => {
          papers[p.id] = p.title;
        });
      }

      const enrichedMessages = (messagesData || []).map(m => ({
        ...m,
        message_type: m.message_type as 'text' | 'paper_share' | 'system',
        user_name: m.user_id ? profiles[m.user_id]?.name : null,
        user_avatar: m.user_id ? profiles[m.user_id]?.avatar : null,
        paper_title: m.paper_reference_id ? papers[m.paper_reference_id] : null,
      }));

      setMessages(enrichedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time messages
    if (groupId) {
      const channel = supabase
        .channel(`group-chat-${groupId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'group_messages',
            filter: `group_id=eq.${groupId}`,
          },
          async (payload) => {
            const newMessage = payload.new as GroupMessage;
            
            // Enrich the new message
            let userName = null;
            let userAvatar = null;
            let paperTitle = null;

            if (newMessage.user_id) {
              const { data: profile } = await supabase
                .from('public_profiles')
                .select('full_name, avatar_url')
                .eq('id', newMessage.user_id)
                .maybeSingle();
              
              userName = profile?.full_name;
              userAvatar = profile?.avatar_url;
            }

            if (newMessage.paper_reference_id) {
              const { data: paper } = await supabase
                .from('question_papers')
                .select('title')
                .eq('id', newMessage.paper_reference_id)
                .maybeSingle();
              
              paperTitle = paper?.title;
            }

            setMessages(prev => [...prev, {
              ...newMessage,
              message_type: newMessage.message_type as 'text' | 'paper_share' | 'system',
              user_name: userName,
              user_avatar: userAvatar,
              paper_title: paperTitle,
            }]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'group_messages',
            filter: `group_id=eq.${groupId}`,
          },
          (payload) => {
            const deletedId = (payload.old as { id: string }).id;
            setMessages(prev => prev.filter(m => m.id !== deletedId));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchMessages, groupId]);

  const sendMessage = async (content: string) => {
    if (!user || !groupId || !content.trim()) return false;

    setSending(true);
    try {
      const { error } = await supabase.from('group_messages').insert({
        group_id: groupId,
        user_id: user.id,
        content: content.trim(),
        message_type: 'text',
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSending(false);
    }
  };

  const sharePaper = async (paperId: string, note?: string) => {
    if (!user || !groupId) return false;

    try {
      const { error } = await supabase.from('group_messages').insert({
        group_id: groupId,
        user_id: user.id,
        content: note || 'Shared a paper',
        message_type: 'paper_share',
        paper_reference_id: paperId,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sharing paper:', error);
      return false;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  };

  return {
    messages,
    loading,
    sending,
    sendMessage,
    sharePaper,
    deleteMessage,
    refetch: fetchMessages,
  };
}

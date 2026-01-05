import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface PaperContext {
  id: string;
  title: string;
  subject: string;
  board: string;
  class_level: string;
  year: number;
  exam_type: string;
  description?: string | null;
}

export function useAIChat(paperContext?: PaperContext) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to use the AI Study Assistant',
        variant: 'destructive',
      });
      return;
    }

    if (!content.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Create conversation if not exists
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const { data: convData, error: convError } = await supabase
          .from('ai_conversations')
          .insert({
            user_id: user.id,
            paper_id: paperContext?.id || null,
            title: paperContext ? `Chat about ${paperContext.title}` : 'Study Assistant Chat',
          })
          .select('id')
          .single();

        if (convError) throw convError;
        currentConversationId = convData.id;
        setConversationId(currentConversationId);
      }

      // Save user message to database
      await supabase.from('ai_messages').insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: content.trim(),
      });

      // Build conversation history for context (last 10 messages)
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Call edge function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: content.trim(),
          paperContext,
          conversationHistory,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database
      await supabase.from('ai_messages').insert({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: data.message,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, conversationId, messages, paperContext, toast]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
  };
}

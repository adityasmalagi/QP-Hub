import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ExamEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  exam_date: string;
  subject: string | null;
  board: string | null;
  class_level: string | null;
  reminder_days: number[];
  color: string;
  created_at: string;
}

interface ExamReminder {
  id: string;
  exam_event_id: string;
  user_id: string;
  reminder_date: string;
  is_sent: boolean;
  exam_event?: ExamEvent;
}

interface CreateEventData {
  title: string;
  description?: string;
  exam_date: string;
  subject?: string;
  board?: string;
  class_level?: string;
  reminder_days?: number[];
  color?: string;
}

export function useExamCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<ExamEvent[]>([]);
  const [reminders, setReminders] = useState<ExamReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('exam_events')
        .select('*')
        .eq('user_id', user.id)
        .order('exam_date', { ascending: true });

      if (error) throw error;

      setEvents(
        (data || []).map((e) => ({
          ...e,
          reminder_days: e.reminder_days || [7, 1],
        }))
      );
    } catch (error) {
      console.error('Error fetching exam events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingReminders = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('exam_reminders')
        .select('*, exam_events(*)')
        .eq('user_id', user.id)
        .gte('reminder_date', today)
        .eq('is_sent', false)
        .order('reminder_date', { ascending: true });

      if (error) throw error;

      setReminders(
        (data || []).map((r) => ({
          ...r,
          exam_event: r.exam_events as ExamEvent | undefined,
        }))
      );
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchUpcomingReminders();
  }, [user]);

  const createEvent = async (data: CreateEventData) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add exam events',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase.from('exam_events').insert({
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        exam_date: data.exam_date,
        subject: data.subject || null,
        board: data.board || null,
        class_level: data.class_level || null,
        reminder_days: data.reminder_days || [7, 1],
        color: data.color || '#6366f1',
      });

      if (error) throw error;

      toast({
        title: 'Event added',
        description: 'Your exam event has been added to the calendar',
      });

      fetchEvents();
      fetchUpcomingReminders();
      return true;
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Could not add event. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateEvent = async (eventId: string, data: Partial<CreateEventData>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('exam_events')
        .update({
          title: data.title,
          description: data.description,
          exam_date: data.exam_date,
          subject: data.subject,
          board: data.board,
          class_level: data.class_level,
          color: data.color,
        })
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Event updated',
        description: 'Your exam event has been updated',
      });

      fetchEvents();
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('exam_events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Event deleted',
        description: 'Your exam event has been removed',
      });

      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((e) => e.exam_date === dateStr);
  };

  const getUpcomingEvents = (days: number = 30) => {
    const today = new Date();
    const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    
    return events.filter((e) => {
      const eventDate = new Date(e.exam_date);
      return eventDate >= today && eventDate <= future;
    });
  };

  return {
    events,
    reminders,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getUpcomingEvents,
    refetch: fetchEvents,
  };
}

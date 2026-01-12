import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface StudyPlanItem {
  id: string;
  plan_id: string;
  paper_id: string | null;
  title: string;
  day_number: number | null;
  scheduled_date: string | null;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  name: string;
  target_exam: string | null;
  target_date: string | null;
  subjects: string[] | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
  items?: StudyPlanItem[];
}

export function useStudyPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans((data || []) as StudyPlan[]);
    } catch (error) {
      console.error('Error fetching study plans:', error);
      toast.error('Failed to load study plans');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const createPlan = async (plan: Omit<StudyPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('study_plans')
        .insert({
          ...plan,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setPlans(prev => [data as StudyPlan, ...prev]);
      toast.success('Study plan created!');
      return data as StudyPlan;
    } catch (error) {
      console.error('Error creating study plan:', error);
      toast.error('Failed to create study plan');
      return null;
    }
  };

  const updatePlan = async (id: string, updates: Partial<StudyPlan>) => {
    try {
      const { error } = await supabase
        .from('study_plans')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      setPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      toast.success('Plan updated');
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('study_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plan deleted');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const fetchPlanItems = async (planId: string): Promise<StudyPlanItem[]> => {
    try {
      const { data, error } = await supabase
        .from('study_plan_items')
        .select('*')
        .eq('plan_id', planId)
        .order('day_number', { ascending: true });

      if (error) throw error;
      return (data || []) as StudyPlanItem[];
    } catch (error) {
      console.error('Error fetching plan items:', error);
      return [];
    }
  };

  const addPlanItem = async (item: Omit<StudyPlanItem, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('study_plan_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data as StudyPlanItem;
    } catch (error) {
      console.error('Error adding plan item:', error);
      toast.error('Failed to add item');
      return null;
    }
  };

  const updatePlanItem = async (id: string, updates: Partial<StudyPlanItem>) => {
    try {
      const { error } = await supabase
        .from('study_plan_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Item updated');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const deletePlanItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('study_plan_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  return {
    plans,
    loading,
    refresh: fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    fetchPlanItems,
    addPlanItem,
    updatePlanItem,
    deletePlanItem,
  };
}

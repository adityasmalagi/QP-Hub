import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  class_level: string | null;
  board: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  max_members: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  is_member?: boolean;
  user_role?: 'owner' | 'admin' | 'member' | null;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user_name?: string | null;
  user_avatar?: string | null;
}

interface CreateGroupData {
  name: string;
  description?: string;
  subject?: string;
  class_level?: string;
  board?: string;
  is_public?: boolean;
}

export function useStudyGroups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      // Fetch public groups
      const { data: publicGroups, error } = await supabase
        .from('study_groups')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get member counts
      const groupIds = publicGroups?.map(g => g.id) || [];
      let memberCounts: Record<string, number> = {};
      let userMemberships: Record<string, string> = {};

      if (groupIds.length > 0) {
        const { data: members } = await supabase
          .from('group_members')
          .select('group_id, user_id, role')
          .in('group_id', groupIds);

        members?.forEach(m => {
          memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
          if (user && m.user_id === user.id) {
            userMemberships[m.group_id] = m.role;
          }
        });
      }

      const enrichedGroups = (publicGroups || []).map(group => ({
        ...group,
        is_public: group.is_public ?? true,
        max_members: group.max_members ?? 50,
        member_count: memberCounts[group.id] || 0,
        is_member: !!userMemberships[group.id],
        user_role: userMemberships[group.id] as 'owner' | 'admin' | 'member' | null,
      }));

      setGroups(enrichedGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMyGroups = useCallback(async () => {
    if (!user) {
      setMyGroups([]);
      return;
    }

    try {
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select('group_id, role')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberships?.length) {
        setMyGroups([]);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);
      const roleMap = new Map(memberships.map(m => [m.group_id, m.role]));

      const { data: groupsData, error } = await supabase
        .from('study_groups')
        .select('*')
        .in('id', groupIds);

      if (error) throw error;

      // Get member counts
      let memberCounts: Record<string, number> = {};
      const { data: members } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds);

      members?.forEach(m => {
        memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
      });

      const enrichedGroups = (groupsData || []).map(group => ({
        ...group,
        is_public: group.is_public ?? true,
        max_members: group.max_members ?? 50,
        member_count: memberCounts[group.id] || 0,
        is_member: true,
        user_role: roleMap.get(group.id) as 'owner' | 'admin' | 'member',
      }));

      setMyGroups(enrichedGroups);
    } catch (error) {
      console.error('Error fetching my groups:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
    fetchMyGroups();
  }, [fetchGroups, fetchMyGroups]);

  const createGroup = async (data: CreateGroupData) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to create a group',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data: newGroup, error } = await supabase
        .from('study_groups')
        .insert({
          name: data.name,
          description: data.description || null,
          subject: data.subject || null,
          class_level: data.class_level || null,
          board: data.board || null,
          is_public: data.is_public ?? true,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      await supabase.from('group_members').insert({
        group_id: newGroup.id,
        user_id: user.id,
        role: 'owner',
      });

      toast({ title: 'Group created successfully!' });
      fetchGroups();
      fetchMyGroups();
      return newGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive',
      });
      return null;
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to join groups',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
      });

      if (error) throw error;

      toast({ title: 'Joined group successfully!' });
      fetchGroups();
      fetchMyGroups();
      return true;
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: 'Error',
        description: 'Failed to join group',
        variant: 'destructive',
      });
      return false;
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Left group' });
      fetchGroups();
      fetchMyGroups();
      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      return false;
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('study_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({ title: 'Group deleted' });
      fetchGroups();
      fetchMyGroups();
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete group',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    groups,
    myGroups,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
    refetch: () => {
      fetchGroups();
      fetchMyGroups();
    },
  };
}

export function useGroupDetails(groupId: string | undefined) {
  const { user } = useAuth();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupDetails = useCallback(async () => {
    if (!groupId) return;

    try {
      const { data: groupData, error } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;

      // Fetch members
      const { data: membersData } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      // Get user profiles
      const userIds = membersData?.map(m => m.user_id) || [];
      let profiles: Record<string, { name: string | null; avatar: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        profilesData?.forEach(p => {
          profiles[p.id] = { name: p.full_name, avatar: p.avatar_url };
        });
      }

      const enrichedMembers = (membersData || []).map(m => ({
        ...m,
        role: m.role as 'owner' | 'admin' | 'member',
        user_name: profiles[m.user_id]?.name,
        user_avatar: profiles[m.user_id]?.avatar,
      }));

      // Check user role
      const userMember = enrichedMembers.find(m => m.user_id === user?.id);

      setGroup({
        ...groupData,
        is_public: groupData.is_public ?? true,
        max_members: groupData.max_members ?? 50,
        member_count: enrichedMembers.length,
        is_member: !!userMember,
        user_role: userMember?.role || null,
      });
      setMembers(enrichedMembers);
    } catch (error) {
      console.error('Error fetching group details:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => {
    fetchGroupDetails();

    // Subscribe to member changes
    if (groupId) {
      const channel = supabase
        .channel(`group-members-${groupId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_members',
            filter: `group_id=eq.${groupId}`,
          },
          () => fetchGroupDetails()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchGroupDetails, groupId]);

  return { group, members, loading, refetch: fetchGroupDetails };
}

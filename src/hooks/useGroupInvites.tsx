import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface GroupInvite {
  id: string;
  group_id: string;
  invite_code: string;
  created_by: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  is_active: boolean;
  created_at: string;
}

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useGroupInvites(groupId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchInvites = useCallback(async () => {
    if (!groupId || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_invites')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  const createInvite = async (options?: { expiresInDays?: number; maxUses?: number }) => {
    if (!groupId || !user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create an invite',
        variant: 'destructive',
      });
      return null;
    }

    setCreating(true);
    try {
      const inviteCode = generateInviteCode();
      const expiresAt = options?.expiresInDays 
        ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from('group_invites')
        .insert({
          group_id: groupId,
          invite_code: inviteCode,
          created_by: user.id,
          expires_at: expiresAt,
          max_uses: options?.maxUses || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Invite link created!' });
      await fetchInvites();
      return data;
    } catch (error) {
      console.error('Error creating invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invite link',
        variant: 'destructive',
      });
      return null;
    } finally {
      setCreating(false);
    }
  };

  const deactivateInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('group_invites')
        .update({ is_active: false })
        .eq('id', inviteId);

      if (error) throw error;

      toast({ title: 'Invite link deactivated' });
      await fetchInvites();
      return true;
    } catch (error) {
      console.error('Error deactivating invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate invite',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getInviteUrl = (inviteCode: string) => {
    return `${window.location.origin}/join/${inviteCode}`;
  };

  return {
    invites,
    loading,
    creating,
    fetchInvites,
    createInvite,
    deactivateInvite,
    getInviteUrl,
  };
}

// Hook for joining via invite code
export function useJoinViaInvite() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [joining, setJoining] = useState(false);

  const joinViaInvite = async (inviteCode: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to join a group',
        variant: 'destructive',
      });
      return null;
    }

    setJoining(true);
    try {
      // Look up invite via secure RPC
      const { data: inviteData, error: inviteError } = await supabase
        .rpc('lookup_invite_by_code', { p_invite_code: inviteCode });

      if (inviteError || !inviteData || inviteData.length === 0) {
        throw new Error('Invalid or expired invite link');
      }

      const invite = inviteData[0];

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', invite.group_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        toast({ title: 'You are already a member of this group' });
        return invite.group_id;
      }

      // Check expiration
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        throw new Error('Invite link has expired');
      }

      // Check max uses
      if (invite.max_uses && invite.use_count >= invite.max_uses) {
        throw new Error('Invite link has reached maximum uses');
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: invite.group_id,
          user_id: user.id,
          role: 'member',
        });

      if (joinError) throw joinError;

      // Increment use count
      await supabase
        .from('group_invites')
        .update({ use_count: invite.use_count + 1 })
        .eq('id', invite.id);

      toast({ title: 'Successfully joined the group!' });
      return invite.group_id;
    } catch (error: any) {
      console.error('Error joining via invite:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to join group',
        variant: 'destructive',
      });
      return null;
    } finally {
      setJoining(false);
    }
  };

  return { joinViaInvite, joining };
}

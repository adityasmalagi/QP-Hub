import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Medal, Star, Users, HandHelping } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: string;
  };
}

interface UserBadgesProps {
  userId: string;
  className?: string;
  showAll?: boolean;
  maxBadges?: number;
}

const TIER_COLORS = {
  bronze: 'bg-amber-600/20 text-amber-600 border-amber-600/30',
  silver: 'bg-slate-400/20 text-slate-400 border-slate-400/30',
  gold: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  platinum: 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30',
};

const ICONS: Record<string, React.ElementType> = {
  medal: Medal,
  star: Star,
  users: Users,
  'hand-helping': HandHelping,
};

export function UserBadges({ userId, className, showAll = false, maxBadges = 3 }: UserBadgesProps) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          badge_id,
          earned_at,
          badge:badge_definitions(id, name, description, icon, tier)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setBadges((data || []) as unknown as UserBadge[]);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || badges.length === 0) {
    return null;
  }

  const displayBadges = showAll ? badges : badges.slice(0, maxBadges);
  const remainingCount = badges.length - displayBadges.length;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      <TooltipProvider>
        {displayBadges.map((userBadge) => {
          const IconComponent = ICONS[userBadge.badge.icon] || Medal;
          const tierColor = TIER_COLORS[userBadge.badge.tier as keyof typeof TIER_COLORS] || TIER_COLORS.bronze;

          return (
            <Tooltip key={userBadge.id}>
              <TooltipTrigger asChild>
                <Badge 
                  className={cn(
                    "h-5 gap-1 px-1.5 text-[10px] font-medium cursor-help",
                    tierColor
                  )}
                >
                  <IconComponent className="h-3 w-3" />
                  {showAll && userBadge.badge.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">{userBadge.badge.name}</p>
                  <p className="text-xs text-muted-foreground">{userBadge.badge.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {remainingCount > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            +{remainingCount}
          </Badge>
        )}
      </TooltipProvider>
    </div>
  );
}

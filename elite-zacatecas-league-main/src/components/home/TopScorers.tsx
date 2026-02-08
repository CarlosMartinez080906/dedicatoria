import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface Scorer {
  player_id: string;
  player_name: string;
  jersey_number: number | null;
  team_name: string;
  total_goals: number;
}

interface TopScorersProps {
  categoryId: string;
}

export function TopScorers({ categoryId }: TopScorersProps) {
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTopScorers() {
      setIsLoading(true);

      // Get teams in this category first
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name')
        .eq('category_id', categoryId);

      if (!teams || teams.length === 0) {
        setScorers([]);
        setIsLoading(false);
        return;
      }

      const teamIds = teams.map(t => t.id);
      const teamMap = new Map(teams.map(t => [t.id, t.name]));

      // Get goals grouped by player
      const { data: goals } = await supabase
        .from('goals')
        .select('player_id, goals_count, team_id, players(name, jersey_number)')
        .in('team_id', teamIds);

      if (!goals) {
        setScorers([]);
        setIsLoading(false);
        return;
      }

      // Aggregate goals by player
      const scorerMap = new Map<string, Scorer>();
      
      goals.forEach(goal => {
        const player = goal.players as unknown as { name: string; jersey_number: number | null };
        const existing = scorerMap.get(goal.player_id);
        
        if (existing) {
          existing.total_goals += goal.goals_count;
        } else {
          scorerMap.set(goal.player_id, {
            player_id: goal.player_id,
            player_name: player?.name || 'Desconocido',
            jersey_number: player?.jersey_number,
            team_name: teamMap.get(goal.team_id) || 'Equipo',
            total_goals: goal.goals_count,
          });
        }
      });

      const sorted = Array.from(scorerMap.values())
        .sort((a, b) => b.total_goals - a.total_goals)
        .slice(0, 5);

      setScorers(sorted);
      setIsLoading(false);
    }

    fetchTopScorers();
  }, [categoryId]);

  return (
    <div className="card-gold">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Goleadores</h2>
          </div>
          <Link to="/goleadores">
            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 p-0 h-auto">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : scorers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No hay goles registrados
          </div>
        ) : (
          <div className="space-y-3">
            {scorers.map((scorer, index) => (
              <div key={scorer.player_id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  index === 0 ? 'bg-primary text-primary-foreground' :
                  index === 1 ? 'bg-primary/60 text-primary-foreground' :
                  index === 2 ? 'bg-primary/30 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index === 0 ? (
                    <Trophy className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{scorer.player_name}</span>
                    {scorer.jersey_number && (
                      <span className="text-xs text-muted-foreground">#{scorer.jersey_number}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{scorer.team_name}</span>
                </div>
                
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary">
                  <Target className="w-3 h-3" />
                  <span className="font-bold">{scorer.total_goals}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

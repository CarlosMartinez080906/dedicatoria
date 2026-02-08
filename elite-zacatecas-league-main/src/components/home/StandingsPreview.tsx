import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface TeamStanding {
  team_id: string;
  team_name: string;
  logo_url: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

interface StandingsPreviewProps {
  categoryId: string;
}

export function StandingsPreview({ categoryId }: StandingsPreviewProps) {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStandings() {
      setIsLoading(true);

      // Fetch teams for category
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, logo_url')
        .eq('category_id', categoryId)
        .eq('is_active', true);

      if (!teams || teams.length === 0) {
        setStandings([]);
        setIsLoading(false);
        return;
      }

      // Fetch finished matches
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('category_id', categoryId)
        .eq('status', 'finished');

      // Calculate standings
      const standingsMap = new Map<string, TeamStanding>();
      
      teams.forEach(team => {
        standingsMap.set(team.id, {
          team_id: team.id,
          team_name: team.name,
          logo_url: team.logo_url,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0,
        });
      });

      matches?.forEach(match => {
        const home = standingsMap.get(match.home_team_id);
        const away = standingsMap.get(match.away_team_id);

        if (home) {
          home.played++;
          home.goals_for += match.home_goals || 0;
          home.goals_against += match.away_goals || 0;
          
          if ((match.home_goals || 0) > (match.away_goals || 0)) {
            home.won++;
            home.points += 3;
          } else if ((match.home_goals || 0) === (match.away_goals || 0)) {
            home.drawn++;
            home.points += 1;
          } else {
            home.lost++;
          }
        }

        if (away) {
          away.played++;
          away.goals_for += match.away_goals || 0;
          away.goals_against += match.home_goals || 0;
          
          if ((match.away_goals || 0) > (match.home_goals || 0)) {
            away.won++;
            away.points += 3;
          } else if ((match.away_goals || 0) === (match.home_goals || 0)) {
            away.drawn++;
            away.points += 1;
          } else {
            away.lost++;
          }
        }
      });

      // Calculate goal difference and sort
      const sortedStandings = Array.from(standingsMap.values())
        .map(s => ({ ...s, goal_difference: s.goals_for - s.goals_against }))
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
          return b.goals_for - a.goals_for;
        });

      setStandings(sortedStandings.slice(0, 5));
      setIsLoading(false);
    }

    fetchStandings();
  }, [categoryId]);

  return (
    <div className="card-gold">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Tabla de Posiciones</h2>
          </div>
          <Link to="/tabla">
            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
              Ver todo
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : standings.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No hay equipos registrados
          </div>
        ) : (
          <table className="table-elite">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Equipo</th>
                <th className="text-center w-12">PJ</th>
                <th className="text-center w-12">PG</th>
                <th className="text-center w-12">PE</th>
                <th className="text-center w-12">PP</th>
                <th className="text-center w-12">DG</th>
                <th className="text-center w-16">PTS</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <tr key={team.team_id}>
                  <td>
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-primary text-primary-foreground' :
                      index < 3 ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.team_name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <span className="text-xs font-bold text-muted-foreground">
                            {team.team_name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium">{team.team_name}</span>
                    </div>
                  </td>
                  <td className="text-center text-muted-foreground">{team.played}</td>
                  <td className="text-center text-success">{team.won}</td>
                  <td className="text-center text-warning">{team.drawn}</td>
                  <td className="text-center text-destructive">{team.lost}</td>
                  <td className="text-center">
                    <span className={team.goal_difference > 0 ? 'text-success' : team.goal_difference < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                      {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg bg-primary/10 text-primary font-bold">
                      {team.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

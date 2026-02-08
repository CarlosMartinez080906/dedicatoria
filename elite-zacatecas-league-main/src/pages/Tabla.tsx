import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useCategory } from '@/contexts/CategoryContext';
import { supabase } from '@/integrations/supabase/client';

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

const Tabla = () => {
  const { selectedCategory, isLoading: categoryLoading } = useCategory();
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedCategory) return;

    async function fetchStandings() {
      setIsLoading(true);

      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, logo_url')
        .eq('category_id', selectedCategory.id)
        .eq('is_active', true);

      if (!teams || teams.length === 0) {
        setStandings([]);
        setIsLoading(false);
        return;
      }

      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('category_id', selectedCategory.id)
        .eq('status', 'finished');

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

      const sortedStandings = Array.from(standingsMap.values())
        .map(s => ({ ...s, goal_difference: s.goals_for - s.goals_against }))
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
          return b.goals_for - a.goals_for;
        });

      setStandings(sortedStandings);
      setIsLoading(false);
    }

    fetchStandings();
  }, [selectedCategory]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Tabla de Posiciones</h1>
              {selectedCategory && (
                <p className="text-muted-foreground">Categoría: <span className="text-primary">{selectedCategory.name}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {(isLoading || categoryLoading) && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !categoryLoading && standings.length === 0 && (
          <div className="text-center py-16 card-gold">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin equipos registrados</h3>
            <p className="text-muted-foreground">No hay equipos en esta categoría</p>
          </div>
        )}

        {/* Standings Table */}
        {!isLoading && !categoryLoading && standings.length > 0 && (
          <div className="card-gold overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-elite">
                <thead>
                  <tr>
                    <th className="w-14 text-center">#</th>
                    <th>Equipo</th>
                    <th className="text-center w-12">PJ</th>
                    <th className="text-center w-12">PG</th>
                    <th className="text-center w-12">PE</th>
                    <th className="text-center w-12">PP</th>
                    <th className="text-center w-12">GF</th>
                    <th className="text-center w-12">GC</th>
                    <th className="text-center w-12">DG</th>
                    <th className="text-center w-16">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, index) => (
                    <tr key={team.team_id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-primary text-primary-foreground' :
                          index < 3 ? 'bg-primary/20 text-primary' :
                          index >= standings.length - 2 ? 'bg-destructive/20 text-destructive' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          {team.logo_url ? (
                            <img src={team.logo_url} alt={team.team_name} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <span className="text-sm font-bold text-muted-foreground">
                                {team.team_name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="font-medium">{team.team_name}</span>
                        </div>
                      </td>
                      <td className="text-center text-muted-foreground font-medium">{team.played}</td>
                      <td className="text-center text-success font-medium">{team.won}</td>
                      <td className="text-center text-warning font-medium">{team.drawn}</td>
                      <td className="text-center text-destructive font-medium">{team.lost}</td>
                      <td className="text-center text-muted-foreground">{team.goals_for}</td>
                      <td className="text-center text-muted-foreground">{team.goals_against}</td>
                      <td className="text-center">
                        <span className={`font-medium ${
                          team.goal_difference > 0 ? 'text-success' : 
                          team.goal_difference < 0 ? 'text-destructive' : 
                          'text-muted-foreground'
                        }`}>
                          {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-lg">
                          {team.points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-border bg-muted/30">
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span>PJ = Partidos Jugados</span>
                <span>PG = Ganados</span>
                <span>PE = Empatados</span>
                <span>PP = Perdidos</span>
                <span>GF = Goles a Favor</span>
                <span>GC = Goles en Contra</span>
                <span>DG = Diferencia de Goles</span>
                <span>PTS = Puntos</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tabla;

import { useEffect, useState } from 'react';
import { Target, Trophy } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useCategory } from '@/contexts/CategoryContext';
import { supabase } from '@/integrations/supabase/client';

interface Scorer {
  player_id: string;
  player_name: string;
  jersey_number: number | null;
  team_id: string;
  team_name: string;
  team_logo: string | null;
  total_goals: number;
}

const Goleadores = () => {
  const { selectedCategory, isLoading: categoryLoading } = useCategory();
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedCategory) return;

    async function fetchScorers() {
      setIsLoading(true);

      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, logo_url')
        .eq('category_id', selectedCategory.id);

      if (!teams || teams.length === 0) {
        setScorers([]);
        setIsLoading(false);
        return;
      }

      const teamIds = teams.map(t => t.id);
      const teamMap = new Map(teams.map(t => [t.id, { name: t.name, logo: t.logo_url }]));

      const { data: goals } = await supabase
        .from('goals')
        .select('player_id, goals_count, team_id, players(name, jersey_number)')
        .in('team_id', teamIds);

      if (!goals) {
        setScorers([]);
        setIsLoading(false);
        return;
      }

      const scorerMap = new Map<string, Scorer>();
      
      goals.forEach(goal => {
        const player = goal.players as unknown as { name: string; jersey_number: number | null };
        const team = teamMap.get(goal.team_id);
        const existing = scorerMap.get(goal.player_id);
        
        if (existing) {
          existing.total_goals += goal.goals_count;
        } else {
          scorerMap.set(goal.player_id, {
            player_id: goal.player_id,
            player_name: player?.name || 'Desconocido',
            jersey_number: player?.jersey_number,
            team_id: goal.team_id,
            team_name: team?.name || 'Equipo',
            team_logo: team?.logo || null,
            total_goals: goal.goals_count,
          });
        }
      });

      const sorted = Array.from(scorerMap.values())
        .sort((a, b) => b.total_goals - a.total_goals);

      setScorers(sorted);
      setIsLoading(false);
    }

    fetchScorers();
  }, [selectedCategory]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Tabla de Goleadores</h1>
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
        {!isLoading && !categoryLoading && scorers.length === 0 && (
          <div className="text-center py-16 card-gold">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin goleadores registrados</h3>
            <p className="text-muted-foreground">Aún no hay goles registrados en esta categoría</p>
          </div>
        )}

        {/* Scorers List */}
        {!isLoading && !categoryLoading && scorers.length > 0 && (
          <div className="card-gold overflow-hidden">
            {/* Top 3 Highlight */}
            {scorers.length >= 3 && (
              <div className="p-6 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {/* Second Place */}
                  <div className="text-center pt-8">
                    <div className="relative inline-block">
                      {scorers[1].team_logo ? (
                        <img src={scorers[1].team_logo} alt="" className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-primary/30" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto border-2 border-primary/30">
                          <span className="text-lg font-bold">{scorers[1].player_name.substring(0, 2)}</span>
                        </div>
                      )}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary/60 text-primary-foreground flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                    </div>
                    <h3 className="mt-4 font-semibold text-sm">{scorers[1].player_name}</h3>
                    <p className="text-xs text-muted-foreground">{scorers[1].team_name}</p>
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      <Target className="w-3 h-3" />
                      {scorers[1].total_goals}
                    </div>
                  </div>

                  {/* First Place */}
                  <div className="text-center">
                    <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="relative inline-block">
                      {scorers[0].team_logo ? (
                        <img src={scorers[0].team_logo} alt="" className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-primary" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto border-4 border-primary">
                          <span className="text-xl font-bold text-primary">{scorers[0].player_name.substring(0, 2)}</span>
                        </div>
                      )}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                    </div>
                    <h3 className="mt-4 font-semibold">{scorers[0].player_name}</h3>
                    <p className="text-xs text-muted-foreground">{scorers[0].team_name}</p>
                    <div className="mt-2 inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-lg font-bold">
                      <Target className="w-4 h-4" />
                      {scorers[0].total_goals}
                    </div>
                  </div>

                  {/* Third Place */}
                  <div className="text-center pt-12">
                    <div className="relative inline-block">
                      {scorers[2].team_logo ? (
                        <img src={scorers[2].team_logo} alt="" className="w-14 h-14 rounded-full object-cover mx-auto border-2 border-primary/20" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto border-2 border-primary/20">
                          <span className="font-bold">{scorers[2].player_name.substring(0, 2)}</span>
                        </div>
                      )}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary/30 text-primary flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                    </div>
                    <h3 className="mt-4 font-semibold text-sm">{scorers[2].player_name}</h3>
                    <p className="text-xs text-muted-foreground">{scorers[2].team_name}</p>
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      <Target className="w-3 h-3" />
                      {scorers[2].total_goals}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full List */}
            <div className="overflow-x-auto">
              <table className="table-elite">
                <thead>
                  <tr>
                    <th className="w-14 text-center">#</th>
                    <th>Jugador</th>
                    <th>Equipo</th>
                    <th className="text-center w-20">Goles</th>
                  </tr>
                </thead>
                <tbody>
                  {scorers.map((scorer, index) => (
                    <tr key={scorer.player_id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                      <td className="text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-primary text-primary-foreground' :
                          index === 1 ? 'bg-primary/60 text-primary-foreground' :
                          index === 2 ? 'bg-primary/30 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{scorer.player_name}</span>
                          {scorer.jersey_number && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              #{scorer.jersey_number}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {scorer.team_logo ? (
                            <img src={scorer.team_logo} alt="" className="w-6 h-6 rounded object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                              <span className="text-[10px] font-bold">{scorer.team_name.substring(0, 2)}</span>
                            </div>
                          )}
                          <span className="text-muted-foreground">{scorer.team_name}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold">
                          <Target className="w-3 h-3" />
                          {scorer.total_goals}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Goleadores;

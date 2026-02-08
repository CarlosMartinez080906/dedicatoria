import { useState, useEffect } from 'react';
import { Target, Save, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCategory } from '@/contexts/CategoryContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Team {
  id: string;
  name: string;
}

interface Player {
  id: string;
  name: string;
  jersey_number: number | null;
  team_id: string;
}

interface Match {
  id: string;
  matchday: number;
  match_date: string | null;
  match_time: string | null;
  home_team_id: string;
  away_team_id: string;
  home_goals: number;
  away_goals: number;
  status: string;
}

export function AdminResults() {
  const { toast } = useToast();
  const { selectedCategory } = useCategory();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [scores, setScores] = useState<{ [matchId: string]: { home: number; away: number } }>({});
  const [goalScorers, setGoalScorers] = useState<{ [playerId: string]: number }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedCategory) {
      fetchData();
    }
  }, [selectedCategory]);

  async function fetchData() {
    if (!selectedCategory) return;
    setIsLoading(true);

    const [teamsRes, matchesRes, playersRes] = await Promise.all([
      supabase.from('teams').select('id, name').eq('category_id', selectedCategory.id),
      supabase.from('matches').select('*').eq('category_id', selectedCategory.id).order('matchday').order('match_time'),
      supabase.from('players').select('id, name, jersey_number, team_id').eq('is_active', true)
    ]);

    if (teamsRes.data) setTeams(teamsRes.data);
    if (matchesRes.data) {
      setMatches(matchesRes.data);
      // Initialize scores
      const initialScores: { [matchId: string]: { home: number; away: number } } = {};
      matchesRes.data.forEach(m => {
        initialScores[m.id] = { home: m.home_goals || 0, away: m.away_goals || 0 };
      });
      setScores(initialScores);
    }
    if (playersRes.data) setPlayers(playersRes.data);
    
    setIsLoading(false);
  }

  async function loadExistingGoals(matchId: string) {
    const { data } = await supabase
      .from('goals')
      .select('player_id, goals_count')
      .eq('match_id', matchId);
    
    if (data) {
      const existing: { [playerId: string]: number } = {};
      data.forEach(g => {
        existing[g.player_id] = g.goals_count;
      });
      setGoalScorers(existing);
    }
  }

  function handleExpand(matchId: string) {
    if (expandedMatch === matchId) {
      setExpandedMatch(null);
      setGoalScorers({});
    } else {
      setExpandedMatch(matchId);
      setGoalScorers({});
      loadExistingGoals(matchId);
    }
  }

  async function handleSaveResult(match: Match) {
    const score = scores[match.id];
    if (!score) return;

    setIsSaving(true);

    // Validate goals sum matches score
    const homeTeamGoals = Object.entries(goalScorers)
      .filter(([playerId]) => players.find(p => p.id === playerId)?.team_id === match.home_team_id)
      .reduce((sum, [, goals]) => sum + goals, 0);
    
    const awayTeamGoals = Object.entries(goalScorers)
      .filter(([playerId]) => players.find(p => p.id === playerId)?.team_id === match.away_team_id)
      .reduce((sum, [, goals]) => sum + goals, 0);

    if (homeTeamGoals !== score.home || awayTeamGoals !== score.away) {
      toast({ 
        title: 'Error de validación', 
        description: `Los goles de jugadores (${homeTeamGoals}-${awayTeamGoals}) no coinciden con el marcador (${score.home}-${score.away})`,
        variant: 'destructive' 
      });
      setIsSaving(false);
      return;
    }

    // Update match
    const { error: matchError } = await supabase
      .from('matches')
      .update({ 
        home_goals: score.home, 
        away_goals: score.away, 
        status: 'finished' 
      })
      .eq('id', match.id);

    if (matchError) {
      toast({ title: 'Error', description: matchError.message, variant: 'destructive' });
      setIsSaving(false);
      return;
    }

    // Delete existing goals for this match
    await supabase.from('goals').delete().eq('match_id', match.id);

    // Insert new goals
    const goalInserts = Object.entries(goalScorers)
      .filter(([, goals]) => goals > 0)
      .map(([playerId, goalsCount]) => {
        const player = players.find(p => p.id === playerId);
        return {
          match_id: match.id,
          player_id: playerId,
          team_id: player?.team_id,
          goals_count: goalsCount
        };
      });

    if (goalInserts.length > 0) {
      const { error: goalsError } = await supabase.from('goals').insert(goalInserts);
      if (goalsError) {
        toast({ title: 'Error al guardar goles', description: goalsError.message, variant: 'destructive' });
      }
    }

    toast({ title: 'Resultado guardado', description: 'El partido ha sido finalizado' });
    setExpandedMatch(null);
    setGoalScorers({});
    fetchData();
    setIsSaving(false);
  }

  const teamMap = new Map(teams.map(t => [t.id, t.name]));
  const scheduledMatches = matches.filter(m => m.status === 'scheduled');
  const finishedMatches = matches.filter(m => m.status === 'finished');

  if (!selectedCategory) {
    return (
      <div className="card-gold p-8 text-center text-muted-foreground">
        Selecciona una categoría
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card-gold p-8 flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Matches */}
      <div className="card-gold">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Partidos Pendientes
          </h2>
        </div>

        <div className="p-4 space-y-3">
          {scheduledMatches.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay partidos pendientes</p>
          ) : (
            scheduledMatches.map(match => {
              const isExpanded = expandedMatch === match.id;
              const homePlayers = players.filter(p => p.team_id === match.home_team_id);
              const awayPlayers = players.filter(p => p.team_id === match.away_team_id);
              
              return (
                <div key={match.id} className="rounded-lg bg-muted/30 overflow-hidden">
                  {/* Match Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleExpand(match.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">J{match.matchday}</span>
                          {match.match_date && (
                            <span>{format(new Date(match.match_date), "d 'de' MMM", { locale: es })}</span>
                          )}
                          {match.match_time && (
                            <span>{match.match_time.substring(0, 5)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium flex-1">{teamMap.get(match.home_team_id)}</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              className="w-14 text-center font-bold"
                              value={scores[match.id]?.home || 0}
                              onChange={(e) => setScores({
                                ...scores,
                                [match.id]: { ...scores[match.id], home: parseInt(e.target.value) || 0 }
                              })}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                              type="number"
                              min="0"
                              className="w-14 text-center font-bold"
                              value={scores[match.id]?.away || 0}
                              onChange={(e) => setScores({
                                ...scores,
                                [match.id]: { ...scores[match.id], away: parseInt(e.target.value) || 0 }
                              })}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <span className="font-medium flex-1 text-right">{teamMap.get(match.away_team_id)}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded: Goal Scorers */}
                  {isExpanded && (
                    <div className="p-4 border-t border-border bg-card/50 animate-fade-in">
                      <p className="text-sm text-muted-foreground mb-4">
                        Ingresa los goles de cada jugador. El total debe coincidir con el marcador.
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Home Team */}
                        <div>
                          <h4 className="font-semibold mb-3 text-primary">{teamMap.get(match.home_team_id)}</h4>
                          {homePlayers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sin jugadores registrados</p>
                          ) : (
                            <div className="space-y-2">
                              {homePlayers.map(player => (
                                <div key={player.id} className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-8">#{player.jersey_number || '-'}</span>
                                  <span className="flex-1 text-sm truncate">{player.name}</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    className="w-16 text-center"
                                    value={goalScorers[player.id] || 0}
                                    onChange={(e) => setGoalScorers({
                                      ...goalScorers,
                                      [player.id]: parseInt(e.target.value) || 0
                                    })}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Away Team */}
                        <div>
                          <h4 className="font-semibold mb-3 text-primary">{teamMap.get(match.away_team_id)}</h4>
                          {awayPlayers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sin jugadores registrados</p>
                          ) : (
                            <div className="space-y-2">
                              {awayPlayers.map(player => (
                                <div key={player.id} className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-8">#{player.jersey_number || '-'}</span>
                                  <span className="flex-1 text-sm truncate">{player.name}</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    className="w-16 text-center"
                                    value={goalScorers[player.id] || 0}
                                    onChange={(e) => setGoalScorers({
                                      ...goalScorers,
                                      [player.id]: parseInt(e.target.value) || 0
                                    })}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <Button onClick={() => handleSaveResult(match)} disabled={isSaving}>
                          {isSaving ? (
                            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Finalizar Partido
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Finished Matches */}
      {finishedMatches.length > 0 && (
        <div className="card-gold">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Check className="w-5 h-5 text-success" />
              Partidos Finalizados ({finishedMatches.length})
            </h2>
          </div>

          <div className="p-4 space-y-2">
            {finishedMatches.map(match => (
              <div key={match.id} className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-success/10 text-success">J{match.matchday}</span>
                </div>
                <div className="flex items-center gap-3 flex-1 justify-center">
                  <span className="font-medium text-right flex-1">{teamMap.get(match.home_team_id)}</span>
                  <span className={`text-xl font-bold px-3 py-1 rounded ${
                    match.home_goals > match.away_goals ? 'text-success' :
                    match.home_goals < match.away_goals ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {match.home_goals}
                  </span>
                  <span className="text-muted-foreground">-</span>
                  <span className={`text-xl font-bold px-3 py-1 rounded ${
                    match.away_goals > match.home_goals ? 'text-success' :
                    match.away_goals < match.home_goals ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {match.away_goals}
                  </span>
                  <span className="font-medium text-left flex-1">{teamMap.get(match.away_team_id)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

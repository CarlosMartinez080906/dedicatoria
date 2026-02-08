import { useState, useEffect } from 'react';
import { Calendar, Plus, RefreshCw, Trash2, Save, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCategory } from '@/contexts/CategoryContext';
import { format } from 'date-fns';

interface Team {
  id: string;
  name: string;
}

interface Match {
  id: string;
  matchday: number;
  match_date: string | null;
  match_time: string | null;
  field_number: number | null;
  home_team_id: string;
  away_team_id: string;
  status: string;
}

export function AdminMatches() {
  const { toast } = useToast();
  const { selectedCategory } = useCategory();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (selectedCategory) {
      fetchTeams();
      fetchMatches();
    }
  }, [selectedCategory]);

  async function fetchTeams() {
    if (!selectedCategory) return;

    const { data } = await supabase
      .from('teams')
      .select('id, name')
      .eq('category_id', selectedCategory.id)
      .eq('is_active', true)
      .order('name');
    
    if (data) setTeams(data);
  }

  async function fetchMatches() {
    if (!selectedCategory) return;
    setIsLoading(true);

    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('category_id', selectedCategory.id)
      .order('matchday')
      .order('match_time');
    
    if (data) setMatches(data);
    setIsLoading(false);
  }

  // Round Robin Schedule Generator
  function generateRoundRobin(teams: Team[]): { home: string; away: string; matchday: number }[] {
    const n = teams.length;
    if (n < 2) return [];
    
    const teamList = [...teams];
    // If odd number of teams, add a "bye" placeholder
    if (n % 2 !== 0) {
      teamList.push({ id: 'bye', name: 'Descansa' });
    }

    const totalTeams = teamList.length;
    const rounds = totalTeams - 1;
    const matchesPerRound = totalTeams / 2;
    const schedule: { home: string; away: string; matchday: number }[] = [];

    // Create a working copy for rotation
    const fixed = teamList[0];
    const rotating = teamList.slice(1);

    for (let round = 0; round < rounds; round++) {
      const matchday = round + 1;
      
      // First match: fixed team vs first of rotating
      if (fixed.id !== 'bye' && rotating[0].id !== 'bye') {
        schedule.push({
          home: round % 2 === 0 ? fixed.id : rotating[0].id,
          away: round % 2 === 0 ? rotating[0].id : fixed.id,
          matchday
        });
      }

      // Remaining matches
      for (let i = 1; i < matchesPerRound; i++) {
        const home = rotating[i];
        const away = rotating[totalTeams - 1 - i];
        
        if (home.id !== 'bye' && away.id !== 'bye') {
          schedule.push({ home: home.id, away: away.id, matchday });
        }
      }

      // Rotate: move last to front
      rotating.unshift(rotating.pop()!);
    }

    return schedule;
  }

  async function handleGenerateSchedule() {
    if (!selectedCategory || teams.length < 2) {
      toast({ title: 'Error', description: 'Se necesitan al menos 2 equipos', variant: 'destructive' });
      return;
    }

    // Check if there are existing matches
    if (matches.length > 0) {
      if (!confirm('Ya existen partidos. ¿Deseas eliminarlos y generar un nuevo rol?')) return;
      
      // Delete existing matches
      await supabase.from('matches').delete().eq('category_id', selectedCategory.id);
    }

    setIsGenerating(true);

    const schedule = generateRoundRobin(teams);
    
    const matchInserts = schedule.map(m => ({
      category_id: selectedCategory.id,
      matchday: m.matchday,
      home_team_id: m.home,
      away_team_id: m.away,
      status: 'scheduled' as const
    }));

    const { error } = await supabase.from('matches').insert(matchInserts);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rol generado', description: `${schedule.length} partidos creados` });
      fetchMatches();
    }

    setIsGenerating(false);
  }

  async function handleUpdateMatch() {
    if (!editingMatch) return;

    const { error } = await supabase
      .from('matches')
      .update({
        match_date: editingMatch.match_date || null,
        match_time: editingMatch.match_time || null,
        field_number: editingMatch.field_number || null
      })
      .eq('id', editingMatch.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Partido actualizado' });
      setEditingMatch(null);
      fetchMatches();
    }
  }

  async function handleDeleteMatch(id: string) {
    if (!confirm('¿Eliminar este partido?')) return;

    const { error } = await supabase.from('matches').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Partido eliminado' });
      fetchMatches();
    }
  }

  const teamMap = new Map(teams.map(t => [t.id, t.name]));
  const matchdays = [...new Set(matches.map(m => m.matchday))].sort((a, b) => a - b);

  if (!selectedCategory) {
    return (
      <div className="card-gold p-8 text-center text-muted-foreground">
        Selecciona una categoría
      </div>
    );
  }

  return (
    <div className="card-gold">
      <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Gestión de Jornadas</h2>
        </div>
        <Button 
          onClick={handleGenerateSchedule} 
          disabled={isGenerating || teams.length < 2}
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Generar Rol (Round Robin)
        </Button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No hay partidos programados</p>
            <p className="text-sm text-muted-foreground">
              {teams.length < 2 
                ? `Necesitas al menos 2 equipos (tienes ${teams.length})`
                : 'Haz clic en "Generar Rol" para crear las jornadas automáticamente'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {matchdays.map(matchday => (
              <div key={matchday} className="space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-primary/10">Jornada {matchday}</span>
                </h3>
                
                <div className="space-y-2">
                  {matches.filter(m => m.matchday === matchday).map(match => (
                    <div key={match.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      {editingMatch?.id === match.id ? (
                        <div className="space-y-3 animate-fade-in">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{teamMap.get(match.home_team_id)}</span>
                            <span className="text-muted-foreground">vs</span>
                            <span className="font-medium">{teamMap.get(match.away_team_id)}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              type="date"
                              value={editingMatch.match_date || ''}
                              onChange={(e) => setEditingMatch({ ...editingMatch, match_date: e.target.value })}
                            />
                            <Input
                              type="time"
                              value={editingMatch.match_time || ''}
                              onChange={(e) => setEditingMatch({ ...editingMatch, match_time: e.target.value })}
                            />
                            <Select 
                              value={editingMatch.field_number?.toString() || ''} 
                              onValueChange={(v) => setEditingMatch({ ...editingMatch, field_number: v ? parseInt(v) : null })}
                            >
                              <SelectTrigger className="bg-input">
                                <SelectValue placeholder="Cancha" />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border">
                                <SelectItem value="1">Cancha 1</SelectItem>
                                <SelectItem value="2">Cancha 2</SelectItem>
                                <SelectItem value="3">Cancha 3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleUpdateMatch} size="sm">
                              <Save className="w-4 h-4 mr-2" />
                              Guardar
                            </Button>
                            <Button onClick={() => setEditingMatch(null)} variant="ghost" size="sm">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{teamMap.get(match.home_team_id)}</span>
                              <span className="text-muted-foreground">vs</span>
                              <span className="font-medium">{teamMap.get(match.away_team_id)}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {match.match_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(match.match_date), 'dd/MM/yyyy')}
                                </span>
                              )}
                              {match.match_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {match.match_time.substring(0, 5)}
                                </span>
                              )}
                              {match.field_number && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  Cancha {match.field_number}
                                </span>
                              )}
                              {!match.match_date && !match.match_time && (
                                <span className="text-warning">Sin programar</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              onClick={() => setEditingMatch(match)} 
                              variant="ghost" 
                              size="sm"
                              disabled={match.status === 'finished'}
                            >
                              Editar
                            </Button>
                            <Button 
                              onClick={() => handleDeleteMatch(match.id)} 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

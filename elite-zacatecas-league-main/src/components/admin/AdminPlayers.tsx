import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, Check, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCategory } from '@/contexts/CategoryContext';

interface Team {
  id: string;
  name: string;
}

interface Player {
  id: string;
  name: string;
  jersey_number: number | null;
  team_id: string;
  has_credential: boolean;
  has_bond: boolean;
}

export function AdminPlayers() {
  const { toast } = useToast();
  const { selectedCategory } = useCategory();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', jersey_number: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ name: '', jersey_number: '' });

  useEffect(() => {
    if (selectedCategory) fetchTeams();
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedTeam) fetchPlayers();
  }, [selectedTeam]);

  async function fetchTeams() {
    if (!selectedCategory) return;

    const { data } = await supabase
      .from('teams')
      .select('id, name')
      .eq('category_id', selectedCategory.id)
      .order('name');
    
    if (data) {
      setTeams(data);
      if (data.length > 0 && !selectedTeam) {
        setSelectedTeam(data[0].id);
      }
    }
    setIsLoading(false);
  }

  async function fetchPlayers() {
    if (!selectedTeam) return;
    setIsLoading(true);

    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', selectedTeam)
      .eq('is_active', true)
      .order('jersey_number', { nullsFirst: false });
    
    if (data) setPlayers(data);
    setIsLoading(false);
  }

  async function handleAdd() {
    if (!newPlayer.name.trim() || !selectedTeam) return;

    const { error } = await supabase
      .from('players')
      .insert({ 
        name: newPlayer.name.trim(), 
        jersey_number: newPlayer.jersey_number ? parseInt(newPlayer.jersey_number) : null,
        team_id: selectedTeam
      });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Jugador agregado' });
      setIsAdding(false);
      setNewPlayer({ name: '', jersey_number: '' });
      fetchPlayers();
    }
  }

  async function handleUpdate(id: string) {
    const { error } = await supabase
      .from('players')
      .update({ 
        name: editForm.name.trim(), 
        jersey_number: editForm.jersey_number ? parseInt(editForm.jersey_number) : null
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Jugador actualizado' });
      setEditingId(null);
      fetchPlayers();
    }
  }

  async function handleToggle(id: string, field: 'has_credential' | 'has_bond', value: boolean) {
    const { error } = await supabase
      .from('players')
      .update({ [field]: !value })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchPlayers();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este jugador?')) return;

    const { error } = await supabase.from('players').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Jugador eliminado' });
      fetchPlayers();
    }
  }

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
          <h2 className="text-lg font-semibold">Jugadores</h2>
          <Select value={selectedTeam || ''} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[200px] bg-input border-border">
              <SelectValue placeholder="Seleccionar equipo" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsAdding(true)} size="sm" disabled={isAdding || !selectedTeam}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {/* Add New Form */}
        {isAdding && (
          <div className="p-4 rounded-lg bg-muted/30 space-y-3 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Nombre del jugador"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Dorsal"
                value={newPlayer.jersey_number}
                onChange={(e) => setNewPlayer({ ...newPlayer, jersey_number: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
              <Button onClick={() => setIsAdding(false)} variant="ghost" size="sm">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Players Table */}
        {!isLoading && players.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table-elite">
              <thead>
                <tr>
                  <th className="w-16">#</th>
                  <th>Nombre</th>
                  <th className="text-center w-28">Credencial</th>
                  <th className="text-center w-28">Fianza</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id}>
                    <td>
                      {editingId === player.id ? (
                        <Input
                          type="number"
                          className="w-16"
                          value={editForm.jersey_number}
                          onChange={(e) => setEditForm({ ...editForm, jersey_number: e.target.value })}
                        />
                      ) : (
                        <span className="font-medium">{player.jersey_number || '-'}</span>
                      )}
                    </td>
                    <td>
                      {editingId === player.id ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <span className="font-medium">{player.name}</span>
                      )}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleToggle(player.id, 'has_credential', player.has_credential)}
                        className={`p-2 rounded-lg transition-colors ${
                          player.has_credential ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {player.has_credential ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleToggle(player.id, 'has_bond', player.has_bond)}
                        className={`p-2 rounded-lg transition-colors ${
                          player.has_bond ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {player.has_bond ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                    </td>
                    <td>
                      {editingId === player.id ? (
                        <div className="flex gap-1">
                          <Button onClick={() => handleUpdate(player.id)} variant="ghost" size="sm">
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => setEditingId(null)} variant="ghost" size="sm">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button onClick={() => { setEditingId(player.id); setEditForm({ name: player.name, jersey_number: player.jersey_number?.toString() || '' }); }} variant="ghost" size="sm">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleDelete(player.id)} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && players.length === 0 && !isAdding && selectedTeam && (
          <p className="text-center text-muted-foreground py-8">No hay jugadores en este equipo</p>
        )}

        {!isLoading && teams.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Primero agrega equipos en la pestaña de Equipos</p>
        )}
      </div>
    </div>
  );
}

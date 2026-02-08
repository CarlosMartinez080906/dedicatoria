import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, Phone, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCategory } from '@/contexts/CategoryContext';

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
  representative_name: string | null;
  representative_phone: string | null;
  is_active: boolean;
}

export function AdminTeams() {
  const { toast } = useToast();
  const { selectedCategory } = useCategory();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', representative_name: '', representative_phone: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', representative_name: '', representative_phone: '' });

  useEffect(() => {
    if (selectedCategory) fetchTeams();
  }, [selectedCategory]);

  async function fetchTeams() {
    if (!selectedCategory) return;
    setIsLoading(true);

    const { data } = await supabase
      .from('teams')
      .select('*')
      .eq('category_id', selectedCategory.id)
      .order('name');
    
    if (data) setTeams(data);
    setIsLoading(false);
  }

  async function handleAdd() {
    if (!newTeam.name.trim() || !selectedCategory) return;

    const { error } = await supabase
      .from('teams')
      .insert({ 
        name: newTeam.name.trim(), 
        representative_name: newTeam.representative_name.trim() || null,
        representative_phone: newTeam.representative_phone.trim() || null,
        category_id: selectedCategory.id 
      });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Equipo creado' });
      setIsAdding(false);
      setNewTeam({ name: '', representative_name: '', representative_phone: '' });
      fetchTeams();
    }
  }

  async function handleUpdate(id: string) {
    const { error } = await supabase
      .from('teams')
      .update({ 
        name: editForm.name.trim(), 
        representative_name: editForm.representative_name.trim() || null,
        representative_phone: editForm.representative_phone.trim() || null
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Equipo actualizado' });
      setEditingId(null);
      fetchTeams();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este equipo? Esto eliminará todos los jugadores y partidos asociados.')) return;

    const { error } = await supabase.from('teams').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Equipo eliminado' });
      fetchTeams();
    }
  }

  function startEdit(team: Team) {
    setEditingId(team.id);
    setEditForm({ 
      name: team.name, 
      representative_name: team.representative_name || '',
      representative_phone: team.representative_phone || ''
    });
  }

  if (!selectedCategory) {
    return (
      <div className="card-gold p-8 text-center text-muted-foreground">
        Selecciona una categoría para ver los equipos
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
    <div className="card-gold">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold">Equipos - {selectedCategory.name}</h2>
        <Button onClick={() => setIsAdding(true)} size="sm" disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {/* Add New Form */}
        {isAdding && (
          <div className="p-4 rounded-lg bg-muted/30 space-y-3 animate-fade-in">
            <Input
              placeholder="Nombre del equipo"
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            />
            <Input
              placeholder="Nombre del representante"
              value={newTeam.representative_name}
              onChange={(e) => setNewTeam({ ...newTeam, representative_name: e.target.value })}
            />
            <Input
              placeholder="Teléfono"
              value={newTeam.representative_phone}
              onChange={(e) => setNewTeam({ ...newTeam, representative_phone: e.target.value })}
            />
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

        {/* Teams Grid */}
        <div className="grid gap-3 md:grid-cols-2">
          {teams.map((team) => (
            <div key={team.id} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              {editingId === team.id ? (
                <div className="space-y-3 animate-fade-in">
                  <Input
                    placeholder="Nombre"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                  <Input
                    placeholder="Representante"
                    value={editForm.representative_name}
                    onChange={(e) => setEditForm({ ...editForm, representative_name: e.target.value })}
                  />
                  <Input
                    placeholder="Teléfono"
                    value={editForm.representative_phone}
                    onChange={(e) => setEditForm({ ...editForm, representative_phone: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdate(team.id)} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                    <Button onClick={() => setEditingId(null)} variant="ghost" size="sm">
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">{team.name.substring(0, 2)}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{team.name}</h3>
                      {team.representative_name && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          {team.representative_name}
                        </div>
                      )}
                      {team.representative_phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {team.representative_phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button onClick={() => startEdit(team)} variant="ghost" size="sm">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => handleDelete(team.id)} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {teams.length === 0 && !isAdding && (
          <p className="text-center text-muted-foreground py-8">No hay equipos en esta categoría</p>
        )}
      </div>
    </div>
  );
}

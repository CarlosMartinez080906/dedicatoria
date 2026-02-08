import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Municipality {
  id: string;
  name: string;
  state: string | null;
  is_active: boolean;
}

export function AdminMunicipalities() {
  const { toast } = useToast();
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', state: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [newMunicipality, setNewMunicipality] = useState({ name: '', state: 'Zacatecas' });

  useEffect(() => {
    fetchMunicipalities();
  }, []);

  async function fetchMunicipalities() {
    const { data } = await supabase
      .from('municipalities')
      .select('*')
      .order('name');
    
    if (data) setMunicipalities(data);
    setIsLoading(false);
  }

  async function handleAdd() {
    if (!newMunicipality.name.trim()) return;

    const { error } = await supabase
      .from('municipalities')
      .insert({ 
        name: newMunicipality.name.trim(), 
        state: newMunicipality.state.trim() || 'Zacatecas' 
      });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Municipio creado' });
      setIsAdding(false);
      setNewMunicipality({ name: '', state: 'Zacatecas' });
      fetchMunicipalities();
    }
  }

  async function handleUpdate(id: string) {
    const { error } = await supabase
      .from('municipalities')
      .update({ 
        name: editForm.name.trim(), 
        state: editForm.state.trim() || 'Zacatecas' 
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Municipio actualizado' });
      setEditingId(null);
      fetchMunicipalities();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este municipio? Esto eliminará todas las canchas asociadas.')) return;

    const { error } = await supabase.from('municipalities').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Municipio eliminado' });
      fetchMunicipalities();
    }
  }

  function startEdit(muni: Municipality) {
    setEditingId(muni.id);
    setEditForm({ name: muni.name, state: muni.state || 'Zacatecas' });
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
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Municipios / Ciudades</h2>
        </div>
        <Button onClick={() => setIsAdding(true)} size="sm" disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {isAdding && (
          <div className="p-4 rounded-lg bg-muted/30 space-y-3 animate-fade-in">
            <Input
              placeholder="Nombre del municipio"
              value={newMunicipality.name}
              onChange={(e) => setNewMunicipality({ ...newMunicipality, name: e.target.value })}
            />
            <Input
              placeholder="Estado"
              value={newMunicipality.state}
              onChange={(e) => setNewMunicipality({ ...newMunicipality, state: e.target.value })}
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

        {municipalities.map((muni) => (
          <div key={muni.id} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            {editingId === muni.id ? (
              <div className="space-y-3 animate-fade-in">
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nombre"
                />
                <Input
                  placeholder="Estado"
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleUpdate(muni.id)} size="sm">
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{muni.name}</h3>
                  <p className="text-sm text-muted-foreground">{muni.state}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => startEdit(muni)} variant="ghost" size="sm">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => handleDelete(muni.id)} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {municipalities.length === 0 && !isAdding && (
          <p className="text-center text-muted-foreground py-8">No hay municipios registrados</p>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X, MapPinned } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Municipality {
  id: string;
  name: string;
}

interface Field {
  id: string;
  name: string;
  municipality_id: string;
  address: string | null;
  is_active: boolean;
  municipalities?: Municipality;
}

export function AdminFields() {
  const { toast } = useToast();
  const [fields, setFields] = useState<Field[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', municipality_id: '', address: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [newField, setNewField] = useState({ name: '', municipality_id: '', address: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [fieldsRes, munisRes] = await Promise.all([
      supabase.from('fields').select('*, municipalities(id, name)').order('name'),
      supabase.from('municipalities').select('id, name').order('name')
    ]);
    
    if (fieldsRes.data) setFields(fieldsRes.data);
    if (munisRes.data) setMunicipalities(munisRes.data);
    setIsLoading(false);
  }

  async function handleAdd() {
    if (!newField.name.trim() || !newField.municipality_id) {
      toast({ title: 'Error', description: 'Nombre y municipio son requeridos', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('fields')
      .insert({ 
        name: newField.name.trim(), 
        municipality_id: newField.municipality_id,
        address: newField.address.trim() || null
      });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Cancha creada' });
      setIsAdding(false);
      setNewField({ name: '', municipality_id: '', address: '' });
      fetchData();
    }
  }

  async function handleUpdate(id: string) {
    const { error } = await supabase
      .from('fields')
      .update({ 
        name: editForm.name.trim(), 
        municipality_id: editForm.municipality_id,
        address: editForm.address.trim() || null
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Cancha actualizada' });
      setEditingId(null);
      fetchData();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta cancha?')) return;

    const { error } = await supabase.from('fields').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Cancha eliminada' });
      fetchData();
    }
  }

  function startEdit(field: Field) {
    setEditingId(field.id);
    setEditForm({ 
      name: field.name, 
      municipality_id: field.municipality_id,
      address: field.address || '' 
    });
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
          <MapPinned className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Canchas</h2>
        </div>
        <Button onClick={() => setIsAdding(true)} size="sm" disabled={isAdding || municipalities.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {municipalities.length === 0 && (
          <p className="text-center text-primary py-4">Primero debes crear al menos un municipio</p>
        )}

        {isAdding && (
          <div className="p-4 rounded-lg bg-muted/30 space-y-3 animate-fade-in">
            <Input
              placeholder="Nombre de la cancha"
              value={newField.name}
              onChange={(e) => setNewField({ ...newField, name: e.target.value })}
            />
            <Select value={newField.municipality_id} onValueChange={(v) => setNewField({ ...newField, municipality_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar municipio" />
              </SelectTrigger>
              <SelectContent>
                {municipalities.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Dirección (opcional)"
              value={newField.address}
              onChange={(e) => setNewField({ ...newField, address: e.target.value })}
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

        {fields.map((field) => (
          <div key={field.id} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            {editingId === field.id ? (
              <div className="space-y-3 animate-fade-in">
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nombre"
                />
                <Select value={editForm.municipality_id} onValueChange={(v) => setEditForm({ ...editForm, municipality_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar municipio" />
                  </SelectTrigger>
                  <SelectContent>
                    {municipalities.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Dirección"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleUpdate(field.id)} size="sm">
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
                  <h3 className="font-medium">{field.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {field.municipalities?.name}
                    {field.address && ` • ${field.address}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => startEdit(field)} variant="ghost" size="sm">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => handleDelete(field.id)} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {fields.length === 0 && municipalities.length > 0 && !isAdding && (
          <p className="text-center text-muted-foreground py-8">No hay canchas registradas</p>
        )}
      </div>
    </div>
  );
}

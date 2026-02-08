import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export function AdminCategories() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) setCategories(data);
    setIsLoading(false);
  }

  async function handleAdd() {
    if (!newCategory.name.trim()) return;

    const { error } = await supabase
      .from('categories')
      .insert({ name: newCategory.name.trim(), description: newCategory.description.trim() || null });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Categoría creada' });
      setIsAdding(false);
      setNewCategory({ name: '', description: '' });
      fetchCategories();
    }
  }

  async function handleUpdate(id: string) {
    const { error } = await supabase
      .from('categories')
      .update({ name: editForm.name.trim(), description: editForm.description.trim() || null })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Categoría actualizada' });
      setEditingId(null);
      fetchCategories();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta categoría? Esto eliminará todos los equipos y partidos asociados.')) return;

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Categoría eliminada' });
      fetchCategories();
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, description: cat.description || '' });
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
        <h2 className="text-lg font-semibold">Categorías</h2>
        <Button onClick={() => setIsAdding(true)} size="sm" disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {/* Add New Form */}
        {isAdding && (
          <div className="p-4 rounded-lg bg-muted/30 space-y-3 animate-fade-in">
            <Input
              placeholder="Nombre de la categoría"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
            <Input
              placeholder="Descripción (opcional)"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
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

        {/* Categories List */}
        {categories.map((cat) => (
          <div key={cat.id} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            {editingId === cat.id ? (
              <div className="space-y-3 animate-fade-in">
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <Input
                  placeholder="Descripción"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleUpdate(cat.id)} size="sm">
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
                  <h3 className="font-medium">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-sm text-muted-foreground">{cat.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => startEdit(cat)} variant="ghost" size="sm">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => handleDelete(cat.id)} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && !isAdding && (
          <p className="text-center text-muted-foreground py-8">No hay categorías</p>
        )}
      </div>
    </div>
  );
}

import { ChevronDown, Layers } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useCategory } from '@/contexts/CategoryContext';

export function CategorySelector() {
  const { categories, selectedCategory, setSelectedCategory, isLoading } = useCategory();

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="border-primary/30">
        <Layers className="w-4 h-4 mr-2" />
        Cargando...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50"
        >
          <Layers className="w-4 h-4 mr-2" />
          <span className="max-w-[100px] truncate">{selectedCategory?.name || 'Categoría'}</span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.id}
            onClick={() => setSelectedCategory(category)}
            className={`cursor-pointer ${
              selectedCategory?.id === category.id 
                ? 'bg-primary/10 text-primary' 
                : 'text-foreground hover:bg-muted'
            }`}
          >
            {category.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

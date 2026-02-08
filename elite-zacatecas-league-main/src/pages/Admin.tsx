import { Navigate } from 'react-router-dom';
import { Shield, Users, Calendar, ClipboardList, Target, Settings, Share2, MapPin, MapPinned, UserCog } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useCategory } from '@/contexts/CategoryContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminTeams } from '@/components/admin/AdminTeams';
import { AdminPlayers } from '@/components/admin/AdminPlayers';
import { AdminMatches } from '@/components/admin/AdminMatches';
import { AdminResults } from '@/components/admin/AdminResults';
import { AdminCategories } from '@/components/admin/AdminCategories';
import { AdminExports } from '@/components/admin/AdminExports';
import { AdminMunicipalities } from '@/components/admin/AdminMunicipalities';
import { AdminFields } from '@/components/admin/AdminFields';
import { AdminUsers } from '@/components/admin/AdminUsers';

const Admin = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const { selectedCategory } = useCategory();

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center card-gold p-8">
            <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
            <p className="text-muted-foreground">
              No tienes permisos de administrador para acceder a esta sección.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Panel de Administración</h1>
              {selectedCategory && (
                <p className="text-muted-foreground">
                  Categoría: <span className="text-primary">{selectedCategory.name}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="bg-card border border-border p-1 h-auto flex-wrap gap-1">
            <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Categorías</span>
            </TabsTrigger>
            <TabsTrigger value="municipalities" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Municipios</span>
            </TabsTrigger>
            <TabsTrigger value="fields" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MapPinned className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Canchas</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Equipos</span>
            </TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ClipboardList className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Jugadores</span>
            </TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Jornadas</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Target className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Resultados</span>
            </TabsTrigger>
            <TabsTrigger value="exports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Share2 className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </TabsTrigger>
            <TabsTrigger value="admins" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UserCog className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Admins</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="animate-fade-in">
            <AdminCategories />
          </TabsContent>

          <TabsContent value="municipalities" className="animate-fade-in">
            <AdminMunicipalities />
          </TabsContent>

          <TabsContent value="fields" className="animate-fade-in">
            <AdminFields />
          </TabsContent>

          <TabsContent value="teams" className="animate-fade-in">
            <AdminTeams />
          </TabsContent>

          <TabsContent value="players" className="animate-fade-in">
            <AdminPlayers />
          </TabsContent>

          <TabsContent value="matches" className="animate-fade-in">
            <AdminMatches />
          </TabsContent>

          <TabsContent value="results" className="animate-fade-in">
            <AdminResults />
          </TabsContent>

          <TabsContent value="exports" className="animate-fade-in">
            <AdminExports />
          </TabsContent>

          <TabsContent value="admins" className="animate-fade-in">
            <AdminUsers />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;

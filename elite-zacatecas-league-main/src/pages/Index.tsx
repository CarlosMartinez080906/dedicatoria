import { Trophy, Calendar, BarChart3, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useCategory } from '@/contexts/CategoryContext';
import { StandingsPreview } from '@/components/home/StandingsPreview';
import { UpcomingMatches } from '@/components/home/UpcomingMatches';
import { TopScorers } from '@/components/home/TopScorers';

const quickLinks = [
  { path: '/calendario', label: 'Ver Calendario', icon: Calendar, description: 'Próximos partidos' },
  { path: '/tabla', label: 'Tabla Completa', icon: BarChart3, description: 'Posiciones actuales' },
  { path: '/goleadores', label: 'Goleadores', icon: Users, description: 'Tabla de goleo' },
];

const Index = () => {
  const { selectedCategory, isLoading } = useCategory();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl opacity-30" />
        
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Liga de Fútbol Amateur</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in">
              <span className="text-gradient-gold">Elite Zacatecas</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in">
              {selectedCategory ? (
                <>Categoría: <span className="text-primary font-semibold">{selectedCategory.name}</span></>
              ) : (
                'Selecciona una categoría para ver la información'
              )}
            </p>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto animate-fade-in">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="group card-gold p-4 text-left hover:scale-[1.02] transition-transform"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {link.label}
                        </h3>
                        <p className="text-xs text-muted-foreground">{link.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      {!isLoading && selectedCategory && (
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Standings Preview */}
            <div className="lg:col-span-2 animate-fade-in">
              <StandingsPreview categoryId={selectedCategory.id} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Matches */}
              <div className="animate-slide-in-right">
                <UpcomingMatches categoryId={selectedCategory.id} />
              </div>

              {/* Top Scorers */}
              <div className="animate-slide-in-right" style={{ animationDelay: '100ms' }}>
                <TopScorers categoryId={selectedCategory.id} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {isLoading && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </section>
      )}

      {/* Empty State */}
      {!isLoading && !selectedCategory && (
        <section className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">No hay categorías disponibles</p>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default Index;

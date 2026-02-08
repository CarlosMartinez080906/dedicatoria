import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, CheckCircle, Timer } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useCategory } from '@/contexts/CategoryContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Match {
  id: string;
  matchday: number;
  match_date: string | null;
  match_time: string | null;
  field_number: number | null;
  home_team: { id: string; name: string; logo_url: string | null };
  away_team: { id: string; name: string; logo_url: string | null };
  home_goals: number;
  away_goals: number;
  status: string;
}

const Calendario = () => {
  const { selectedCategory, isLoading: categoryLoading } = useCategory();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMatchday, setSelectedMatchday] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedCategory) return;

    async function fetchMatches() {
      setIsLoading(true);

      const { data } = await supabase
        .from('matches')
        .select(`
          id,
          matchday,
          match_date,
          match_time,
          field_number,
          home_goals,
          away_goals,
          status,
          home_team:teams!matches_home_team_id_fkey(id, name, logo_url),
          away_team:teams!matches_away_team_id_fkey(id, name, logo_url)
        `)
        .eq('category_id', selectedCategory.id)
        .order('matchday', { ascending: true })
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true });

      if (data) {
        const formatted = data.map(m => ({
          ...m,
          home_team: m.home_team as unknown as Match['home_team'],
          away_team: m.away_team as unknown as Match['away_team'],
        }));
        setMatches(formatted);
        
        // Auto-select the current or next matchday
        const matchdays = [...new Set(formatted.map(m => m.matchday))];
        const scheduledMatchday = formatted.find(m => m.status === 'scheduled')?.matchday;
        setSelectedMatchday(scheduledMatchday || matchdays[0] || null);
      }
      setIsLoading(false);
    }

    fetchMatches();
  }, [selectedCategory]);

  const matchdays = [...new Set(matches.map(m => m.matchday))].sort((a, b) => a - b);
  const filteredMatches = selectedMatchday 
    ? matches.filter(m => m.matchday === selectedMatchday)
    : matches;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Rol de Juegos</h1>
              {selectedCategory && (
                <p className="text-muted-foreground">Categoría: <span className="text-primary">{selectedCategory.name}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Matchday Selector */}
        {matchdays.length > 0 && (
          <div className="mb-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max pb-2">
              {matchdays.map((day) => {
                const dayMatches = matches.filter(m => m.matchday === day);
                const allFinished = dayMatches.every(m => m.status === 'finished');
                const isSelected = selectedMatchday === day;
                
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedMatchday(day)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-muted border border-border'
                    }`}
                  >
                    <span>J{day}</span>
                    {allFinished ? (
                      <CheckCircle className="w-3 h-3 text-success" />
                    ) : (
                      <Timer className="w-3 h-3 text-warning" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading State */}
        {(isLoading || categoryLoading) && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !categoryLoading && matches.length === 0 && (
          <div className="text-center py-16 card-gold">
            <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin partidos programados</h3>
            <p className="text-muted-foreground">No hay partidos registrados en esta categoría</p>
          </div>
        )}

        {/* Matches Grid */}
        {!isLoading && !categoryLoading && filteredMatches.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMatches.map((match) => (
              <div 
                key={match.id} 
                className={`card-gold p-4 ${match.status === 'finished' ? 'border-primary/30' : ''}`}
              >
                {/* Match Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                    Jornada {match.matchday}
                  </span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    match.status === 'finished' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {match.status === 'finished' ? 'Finalizado' : 'Programado'}
                  </span>
                </div>

                {/* Teams */}
                <div className="space-y-3">
                  {/* Home Team */}
                  <div className="flex items-center gap-3">
                    {match.home_team.logo_url ? (
                      <img src={match.home_team.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-xs font-bold">{match.home_team.name.substring(0, 2)}</span>
                      </div>
                    )}
                    <span className="flex-1 font-medium truncate">{match.home_team.name}</span>
                    {match.status === 'finished' && (
                      <span className={`text-2xl font-bold ${
                        match.home_goals > match.away_goals ? 'text-success' :
                        match.home_goals < match.away_goals ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {match.home_goals}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">VS</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center gap-3">
                    {match.away_team.logo_url ? (
                      <img src={match.away_team.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-xs font-bold">{match.away_team.name.substring(0, 2)}</span>
                      </div>
                    )}
                    <span className="flex-1 font-medium truncate">{match.away_team.name}</span>
                    {match.status === 'finished' && (
                      <span className={`text-2xl font-bold ${
                        match.away_goals > match.home_goals ? 'text-success' :
                        match.away_goals < match.home_goals ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {match.away_goals}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Details */}
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                  {match.match_date && (
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {format(new Date(match.match_date), "d 'de' MMM", { locale: es })}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Calendario;

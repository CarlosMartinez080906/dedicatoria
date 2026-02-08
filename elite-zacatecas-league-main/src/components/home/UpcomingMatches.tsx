import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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

interface UpcomingMatchesProps {
  categoryId: string;
}

export function UpcomingMatches({ categoryId }: UpcomingMatchesProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
        .eq('category_id', categoryId)
        .eq('status', 'scheduled')
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })
        .limit(3);

      if (data) {
        const formatted = data.map(m => ({
          ...m,
          home_team: m.home_team as unknown as Match['home_team'],
          away_team: m.away_team as unknown as Match['away_team'],
        }));
        setMatches(formatted);
      }
      setIsLoading(false);
    }

    fetchMatches();
  }, [categoryId]);

  return (
    <div className="card-gold">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Próximos Partidos</h2>
          </div>
          <Link to="/calendario">
            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 p-0 h-auto">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No hay partidos programados
          </div>
        ) : (
          matches.map((match) => (
            <div key={match.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary">Jornada {match.matchday}</span>
                {match.match_date && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(match.match_date), "d 'de' MMM", { locale: es })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Home Team */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {match.home_team.logo_url ? (
                    <img src={match.home_team.logo_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold">{match.home_team.name.substring(0, 2)}</span>
                    </div>
                  )}
                  <span className="text-sm font-medium truncate">{match.home_team.name}</span>
                </div>

                <span className="text-xs text-muted-foreground px-2">vs</span>

                {/* Away Team */}
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-sm font-medium truncate text-right">{match.away_team.name}</span>
                  {match.away_team.logo_url ? (
                    <img src={match.away_team.logo_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold">{match.away_team.name.substring(0, 2)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
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
          ))
        )}
      </div>
    </div>
  );
}

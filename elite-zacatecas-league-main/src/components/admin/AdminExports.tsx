import { useState, useEffect, useRef } from 'react';
import { Share2, Copy, Check, Download, MessageCircle, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCategory } from '@/contexts/CategoryContext';

interface TeamStanding {
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export function AdminExports() {
  const { toast } = useToast();
  const { selectedCategory } = useCategory();
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCategory) fetchStandings();
  }, [selectedCategory]);

  async function fetchStandings() {
    if (!selectedCategory) return;
    setIsLoading(true);

    const { data: teams } = await supabase
      .from('teams')
      .select('id, name')
      .eq('category_id', selectedCategory.id)
      .eq('is_active', true);

    if (!teams) {
      setIsLoading(false);
      return;
    }

    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .eq('category_id', selectedCategory.id)
      .eq('status', 'finished');

    const standingsMap = new Map<string, TeamStanding>();
    
    teams.forEach(team => {
      standingsMap.set(team.id, {
        team_name: team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
      });
    });

    matches?.forEach(match => {
      const home = standingsMap.get(match.home_team_id);
      const away = standingsMap.get(match.away_team_id);

      if (home) {
        home.played++;
        home.goals_for += match.home_goals || 0;
        home.goals_against += match.away_goals || 0;
        
        if ((match.home_goals || 0) > (match.away_goals || 0)) {
          home.won++;
          home.points += 3;
        } else if ((match.home_goals || 0) === (match.away_goals || 0)) {
          home.drawn++;
          home.points += 1;
        } else {
          home.lost++;
        }
      }

      if (away) {
        away.played++;
        away.goals_for += match.away_goals || 0;
        away.goals_against += match.home_goals || 0;
        
        if ((match.away_goals || 0) > (match.home_goals || 0)) {
          away.won++;
          away.points += 3;
        } else if ((match.away_goals || 0) === (match.home_goals || 0)) {
          away.drawn++;
          away.points += 1;
        } else {
          away.lost++;
        }
      }
    });

    const sortedStandings = Array.from(standingsMap.values())
      .map(s => ({ ...s, goal_difference: s.goals_for - s.goals_against }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });

    setStandings(sortedStandings);
    setIsLoading(false);
  }

  function generateWhatsAppText() {
    if (!selectedCategory) return '';

    let text = `⚽ *ELITE ZACATECAS* ⚽\n`;
    text += `📊 *Tabla de Posiciones*\n`;
    text += `🏆 Categoría: ${selectedCategory.name}\n\n`;
    text += `───────────────\n`;

    standings.forEach((team, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      text += `${medal} *${team.team_name}*\n`;
      text += `   📍 ${team.points} pts | ${team.played}PJ | ${team.won}G ${team.drawn}E ${team.lost}P\n`;
      text += `   ⚽ ${team.goals_for}-${team.goals_against} (${team.goal_difference > 0 ? '+' : ''}${team.goal_difference})\n\n`;
    });

    text += `───────────────\n`;
    text += `📅 Liga Elite Zacatecas`;

    return text;
  }

  async function copyToClipboard() {
    const text = generateWhatsAppText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: '¡Copiado!', description: 'Texto listo para pegar en WhatsApp' });
    setTimeout(() => setCopied(false), 2000);
  }

  async function downloadAsImage() {
    toast({ title: 'Generando imagen...', description: 'Esto puede tardar unos segundos' });
    
    // Create a canvas-based image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const rowHeight = 50;
    const headerHeight = 120;
    const footerHeight = 60;
    const height = headerHeight + (standings.length * rowHeight) + 60 + footerHeight;

    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ELITE ZACATECAS', width / 2, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('TABLA DE POSICIONES', width / 2, 80);

    ctx.fillStyle = '#D4AF37';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(`Categoría: ${selectedCategory?.name || ''}`, width / 2, 105);

    // Table header
    const tableTop = headerHeight;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(20, tableTop, width - 40, 40);

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('#', 40, tableTop + 25);
    ctx.fillText('EQUIPO', 80, tableTop + 25);
    ctx.textAlign = 'center';
    ctx.fillText('PJ', 350, tableTop + 25);
    ctx.fillText('G', 400, tableTop + 25);
    ctx.fillText('E', 450, tableTop + 25);
    ctx.fillText('P', 500, tableTop + 25);
    ctx.fillText('GF', 550, tableTop + 25);
    ctx.fillText('GC', 600, tableTop + 25);
    ctx.fillText('DG', 650, tableTop + 25);
    ctx.fillText('PTS', 720, tableTop + 25);

    // Table rows
    standings.forEach((team, index) => {
      const y = tableTop + 40 + (index * rowHeight);
      
      // Row background
      ctx.fillStyle = index % 2 === 0 ? '#0f0f0f' : '#141414';
      ctx.fillRect(20, y, width - 40, rowHeight);

      // Position circle
      ctx.beginPath();
      ctx.arc(50, y + rowHeight / 2, 15, 0, Math.PI * 2);
      ctx.fillStyle = index === 0 ? '#D4AF37' : index < 3 ? '#D4AF3750' : '#2a2a2a';
      ctx.fill();

      ctx.fillStyle = index < 3 ? '#0a0a0a' : '#888888';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${index + 1}`, 50, y + rowHeight / 2 + 4);

      // Team name
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(team.team_name, 80, y + rowHeight / 2 + 5);

      // Stats
      ctx.textAlign = 'center';
      ctx.fillStyle = '#888888';
      ctx.fillText(`${team.played}`, 350, y + rowHeight / 2 + 5);
      ctx.fillStyle = '#22c55e';
      ctx.fillText(`${team.won}`, 400, y + rowHeight / 2 + 5);
      ctx.fillStyle = '#eab308';
      ctx.fillText(`${team.drawn}`, 450, y + rowHeight / 2 + 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`${team.lost}`, 500, y + rowHeight / 2 + 5);
      ctx.fillStyle = '#888888';
      ctx.fillText(`${team.goals_for}`, 550, y + rowHeight / 2 + 5);
      ctx.fillText(`${team.goals_against}`, 600, y + rowHeight / 2 + 5);
      
      const dgColor = team.goal_difference > 0 ? '#22c55e' : team.goal_difference < 0 ? '#ef4444' : '#888888';
      ctx.fillStyle = dgColor;
      ctx.fillText(`${team.goal_difference > 0 ? '+' : ''}${team.goal_difference}`, 650, y + rowHeight / 2 + 5);

      // Points
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(`${team.points}`, 720, y + rowHeight / 2 + 5);
    });

    // Footer
    const footerY = tableTop + 40 + (standings.length * rowHeight) + 20;
    ctx.fillStyle = '#D4AF37';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚽ Liga Elite Zacatecas', width / 2, footerY + 20);

    // Download
    const link = document.createElement('a');
    link.download = `tabla-posiciones-${selectedCategory?.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    toast({ title: '¡Imagen descargada!', description: 'Lista para compartir en redes sociales' });
  }

  if (!selectedCategory) {
    return (
      <div className="card-gold p-8 text-center text-muted-foreground">
        Selecciona una categoría
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
    <div className="space-y-6">
      {/* Export Options */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* WhatsApp Export */}
        <div className="card-gold p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-success/10">
              <MessageCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">WhatsApp</h3>
              <p className="text-sm text-muted-foreground">Copia texto formateado</p>
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
            <pre className="text-xs whitespace-pre-wrap text-muted-foreground font-mono">
              {generateWhatsAppText()}
            </pre>
          </div>

          <Button onClick={copyToClipboard} className="w-full">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar para WhatsApp
              </>
            )}
          </Button>
        </div>

        {/* Image Export */}
        <div className="card-gold p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Image className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Redes Sociales</h3>
              <p className="text-sm text-muted-foreground">Descarga imagen PNG</p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 mb-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-gradient-gold mb-3">
                <Share2 className="w-10 h-10 text-primary-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Genera una imagen elegante de la tabla de posiciones para Facebook e Instagram
              </p>
            </div>
          </div>

          <Button onClick={downloadAsImage} className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Descargar Imagen PNG
          </Button>
        </div>
      </div>

      {/* Preview Table */}
      <div className="card-gold" ref={tableRef}>
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Vista previa de la tabla</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-elite">
            <thead>
              <tr>
                <th className="w-14">#</th>
                <th>Equipo</th>
                <th className="text-center">PJ</th>
                <th className="text-center">G</th>
                <th className="text-center">E</th>
                <th className="text-center">P</th>
                <th className="text-center">GF</th>
                <th className="text-center">GC</th>
                <th className="text-center">DG</th>
                <th className="text-center">PTS</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((team, index) => (
                <tr key={team.team_name}>
                  <td className="text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-primary text-primary-foreground' :
                      index < 3 ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="font-medium">{team.team_name}</td>
                  <td className="text-center text-muted-foreground">{team.played}</td>
                  <td className="text-center text-success">{team.won}</td>
                  <td className="text-center text-warning">{team.drawn}</td>
                  <td className="text-center text-destructive">{team.lost}</td>
                  <td className="text-center">{team.goals_for}</td>
                  <td className="text-center">{team.goals_against}</td>
                  <td className="text-center">
                    <span className={team.goal_difference > 0 ? 'text-success' : team.goal_difference < 0 ? 'text-destructive' : ''}>
                      {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className="font-bold text-primary">{team.points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { SHOOTING_CLASSES } from '../constants/shootingClasses';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const getInitials = (name) => name.split(' ').map((n) => n[0]).join('');

const CompetitionLeaderboard = () => {
  const { id } = useParams();
  const { competitions } = useData();
  const competition = competitions.find((c) => c.id === parseInt(id));
  if (!competition) return <div>Wettbewerb nicht gefunden</div>;

  // Gruppiere nach Disziplin und Klasse
  const groups = {};
  (competition.participations || []).forEach((p) => {
    if (!p.results || p.results.length === 0) return;
    const dis = p.discipline || 'Unbekannt';
    const cls = p.shooterClass || 'Unbekannt';
    if (!groups[dis]) groups[dis] = {};
    if (!groups[dis][cls]) groups[dis][cls] = [];
    groups[dis][cls].push(p);
  });

  // Sortiere pro Gruppe nach Ergebnis (z.B. Summe der Ergebnisse)
  Object.keys(groups).forEach((dis) => {
    Object.keys(groups[dis]).forEach((cls) => {
      groups[dis][cls].sort((a, b) => {
        const sumA = (a.results || []).reduce((s, r) => s + r, 0);
        const sumB = (b.results || []).reduce((s, r) => s + r, 0);
        return sumB - sumA;
      });
    });
  });

  return (
    <main className="min-h-screen w-full px-4 py-10 bg-background">
      <h2 className="text-3xl font-bold mb-8">Rangliste - {competition.name}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {Object.entries(groups).map(([dis, classes]) => (
          Object.entries(classes).map(([cls, participations], idx) => (
            <div key={dis + cls} className="mb-8">
              <div className="font-semibold text-lg mb-2 border-b pb-1">{dis} - {cls}</div>
              <div className="flex flex-col gap-2">
                {participations.slice(0, 3).map((p, i) => (
                  <Card key={p.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="text-xl w-6 text-center">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    <Avatar>
                      <AvatarFallback>{getInitials(p.shooter?.name || '?')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{p.shooter?.name || '-'}</div>
                      <div className="text-xs text-muted-foreground">{p.shooter?.email || ''}</div>
                    </div>
                    <div className="text-sm font-medium min-w-[100px]">{dis}</div>
                    <div className="text-sm min-w-[80px]">{p.team || ''}</div>
                  </Card>
                ))}
                {participations.length === 0 && <div className="text-muted-foreground text-sm">Keine Ergebnisse</div>}
              </div>
            </div>
          ))
        ))}
      </div>
      <div className="flex justify-center mt-8">
        <Button asChild variant="outline" className="w-auto px-8">
          <Link to={`/manager/competitions/${id}`}>Zurück</Link>
        </Button>
      </div>
    </main>
  );
};

export default CompetitionLeaderboard; 
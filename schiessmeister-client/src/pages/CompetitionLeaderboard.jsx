import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCompetitionLeaderboards } from '../api/apiClient';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('') || '?';

const CompetitionLeaderboard = () => {
  const { id } = useParams();
  const auth = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getCompetitionLeaderboards(id, auth)
      .then((data) => {
        setGroups(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Fehler beim Laden der Rangliste');
        setLoading(false);
      });
  }, [id, auth]);

  if (loading) return <div>Lade Rangliste...</div>;
  if (error) return <div>{error}</div>;

  return (
    <main className="min-h-screen w-full px-4 py-10 bg-background">
      <h2 className="text-3xl font-bold mb-8">Rangliste</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {groups.map((group) => (
          <div key={group.name} className="mb-8">
            <div className="font-semibold text-lg mb-2 border-b pb-1">{group.name}</div>
            <div className="flex flex-col gap-2">
              {group.entries && group.entries.length > 0 ? (
                group.entries.slice(0, 3).map((entry, i) => (
                  <Card key={entry.name} className="flex items-center gap-4 px-4 py-3">
                    <div className="text-xl w-6 text-center">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    <Avatar>
                      <AvatarFallback>{getInitials(entry.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{entry.name}</div>
                    </div>
                    <div className="text-lg font-bold min-w-[60px] text-right">{entry.totalScore}</div>
                  </Card>
                ))
              ) : (
                <div className="text-muted-foreground text-sm">Keine Ergebnisse</div>
              )}
            </div>
          </div>
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
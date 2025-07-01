import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarDays, Plus, Pencil, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const Competitions = () => {
  const { competitions, countParticipantsRecursive } = useData();
  const { role } = useAuth();
  const basePath = role === 'manager' ? '/manager' : '/writer';

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      return format(date, 'dd.MM.yyyy', { locale: de });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  return (
    <main className="min-h-screen w-full px-4 py-10 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold">Meine Wettbewerbe</h2>
            {role === 'manager' && (
              <Link to={`${basePath}/competitions/new`}>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {competitions.map((c) => (
            <Card key={c.id} className="rounded-xl flex flex-col gap-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{c.name}</CardTitle>
                  {role === 'manager' && (
                    <Link to={`${basePath}/competitions/${c.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-2 border-dotted border-purple-400 rounded-md px-2 py-1 text-sm text-black/80 w-fit">
                  <CalendarDays className="w-4 h-4 mr-1 text-purple-400" />
                  <span>{formatDate(c.date)}</span>
                </div>
                <span className="bg-black text-white text-xs rounded px-2 py-0.5 w-fit">{countParticipantsRecursive(c)} Teilnehmer</span>
                <div className="flex justify-end w-full mt-2">
                  <Link to={`${basePath}/competitions/${c.id}`}>
                    <Button className="bg-black text-white hover:bg-black/80">Öffnen</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {competitions.length === 0 && <p className="col-span-full text-center text-muted-foreground">Keine Wettbewerbe vorhanden.</p>}
        </div>
      </div>
    </main>
  );
};

export default Competitions;

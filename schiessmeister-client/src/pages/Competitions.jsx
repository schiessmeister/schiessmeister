import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarDays, Plus, Pencil, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const Competitions = () => {
  const { competitions, countParticipantsRecursive } = useData();
  const { role } = useAuth();
  const basePath = role === 'manager' ? '/manager' : '/writer';
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const handleWriterOpen = (competition) => {
    if (Array.isArray(competition.groups) && competition.groups.length > 0) {
      setSelectedGroups(competition.groups);
      setSelectedCompetitionId(competition.id);
      setSelectedGroupId(competition.groups[0]?.id || null);
      setDialogOpen(true);
    } else {
      navigate(`/writer/competitions/${competition.id}`);
    }
  };

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

  // Teilnehmer zählen: nutze groups, fallback auf participations
  const countParticipants = (competition) => {
    if (Array.isArray(competition.groups) && competition.groups.length > 0) {
      return competition.groups.reduce((sum, g) => sum + (Array.isArray(g.participations) ? g.participations.length : 0), 0);
    }
    if (Array.isArray(competition.participations)) {
      return competition.participations.length;
    }
    return 0;
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
                  <CardTitle className="text-lg font-semibold">{c.title}</CardTitle>
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
                  <span>{formatDate(c.startDateTime)}</span>
                </div>
                {c.location && <span className="text-xs text-muted-foreground">{c.location}</span>}
                <span className="bg-black text-white text-xs rounded px-2 py-0.5 w-fit">{countParticipants(c)} Teilnehmer</span>
                {c.announcementUrl && (
                  <a href={c.announcementUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline w-fit">Ausschreibung</a>
                )}
                <div className="flex justify-end w-full mt-2">
                  {role === 'manager' ? (
                    <Link to={`${basePath}/competitions/${c.id}`}>
                      <Button className="bg-black text-white hover:bg-black/80">Öffnen</Button>
                    </Link>
                  ) : (
                    <Button
                      className="bg-black text-white hover:bg-black/80"
                      onClick={() => handleWriterOpen(c)}
                    >
                      Öffnen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {competitions.length === 0 && <p className="col-span-full text-center text-muted-foreground">Keine Wettbewerbe vorhanden.</p>}
        </div>
      </div>
      {/* Writer Gruppen-Auswahl Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gruppe auswählen</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <select
              className="border rounded px-2 py-1 text-black font-semibold bg-white"
              value={selectedGroupId || ''}
              onChange={e => setSelectedGroupId(e.target.value)}
            >
              {selectedGroups.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>
          <DialogFooter className="mt-4">
            <Button
              className="bg-black text-white hover:bg-black/80"
              onClick={() => {
                setDialogOpen(false);
                if (selectedCompetitionId && selectedGroupId) {
                  navigate(`/writer/competitions/${selectedCompetitionId}/participationGroups/${selectedGroupId}`);
                }
              }}
              disabled={!selectedGroupId}
            >
              Weiter
            </Button>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Competitions;

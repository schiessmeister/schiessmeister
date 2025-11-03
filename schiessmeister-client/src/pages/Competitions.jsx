import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarDays, Plus, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

const Competitions = () => {
  const { competitionsByOrganization, countParticipantsRecursive } = useData();
  const { ownedOrganizations } = useAuth();

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

  // Check if user is owner of the organization
  const isOrganizationOwner = (orgId) => {
    return ownedOrganizations.some((org) => org.id === orgId);
  };

  // Convert competitionsByOrganization object to array for rendering
  const organizationGroups = Object.values(competitionsByOrganization);

  return (
    <main className="min-h-screen w-full px-4 py-10 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Meine Wettbewerbe</h2>
        </div>

        {organizationGroups.length === 0 && (
          <p className="text-center text-muted-foreground">Keine Wettbewerbe vorhanden.</p>
        )}

        {organizationGroups.map(({ organization, competitions }) => {
          const isOwner = isOrganizationOwner(organization.id);
          
          return (
            <div key={organization.id} className="mb-12">
              {/* Organization Headline */}
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-semibold">{organization.name}</h3>
                {isOwner && (
                  <Link to="/competitions/new">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>

              {/* Competitions Grid */}
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-8">
                {competitions.map((c) => (
                  <Card key={c.id} className="rounded-xl flex flex-col gap-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-semibold">{c.title}</CardTitle>
                          {c.isOwner && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Besitzer</span>
                          )}
                          {!c.isOwner && c.isRecorder && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Schreiber</span>
                          )}
                        </div>
                        {c.isOwner && (
                          <Link to={`/competitions/${c.id}/edit`}>
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
                      <span className="bg-black text-white text-xs rounded px-2 py-0.5 w-fit">
                        {countParticipants(c)} Teilnehmer
                      </span>
                      {c.announcementUrl && (
                        <a
                          href={c.announcementUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 underline w-fit"
                        >
                          Ausschreibung
                        </a>
                      )}
                      <div className="flex justify-end w-full mt-2">
                        <Link to={`/competitions/${c.id}`}>
                          <Button className="bg-black text-white hover:bg-black/80">Öffnen</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};

export default Competitions;

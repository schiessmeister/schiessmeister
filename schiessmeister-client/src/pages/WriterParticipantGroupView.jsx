import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '@/components/ui/button';
import { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { updateParticipation, getCompetition } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const WriterParticipantGroupView = () => {
  const { competitionId, groupId } = useParams();
  const navigate = useNavigate();
  const { competitions, updateCompetition } = useData();
  const competition = competitions.find(c => String(c.id) === String(competitionId));
  const groups = competition?.groups || [];
  const group = groups.find(g => String(g.id) === String(groupId));

  // Dialog-State für Ergebnisse eintragen
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [activeParticipation, setActiveParticipation] = useState(null);
  const [resultsInput, setResultsInput] = useState([]);
  
  // Alle Gruppen für das Dropdown
  const handleGroupChange = (e) => {
    const newGroupId = e.target.value;
    navigate(`/writer/competitions/${competitionId}/participationGroups/${newGroupId}`);
  };

  // Teilnehmer sortieren nach Rang (z.B. Punkte, wie im Manager-Leaderboard)
  const sortedParticipations = useMemo(() => {
    if (!group) return [];
    return [...(group.participations || [])].sort((a, b) => {
      const sumA = a.result?.totalPoints || 0;
      const sumB = b.result?.totalPoints || 0;
      return sumB - sumA;
    });
  }, [group, group.participations]);

  // Disziplin-Infos für das Modal
  const getDisciplineInfo = (participation) => {
    if (!participation) return { seriesCount: 1, shotsPerSeries: 1 };
    // Disziplin ist jetzt direkt im participation-Objekt
    const disc = participation.discipline;
    return disc || { seriesCount: 1, shotsPerSeries: 1 };
  };

  // Hilfsfunktionen für Serien-Status
  const getSeriesStatus = (results, seriesIdx, seriesShots) => results[seriesIdx * seriesShots] === 'DNF' || results[seriesIdx * seriesShots] === 'DNQ' ? results[seriesIdx * seriesShots] : null;
  const setSeriesStatus = (results, seriesIdx, seriesShots, status) => {
    const newResults = [...results];
    for (let i = 0; i < seriesShots; i++) {
      newResults[seriesIdx * seriesShots + i] = status;
    }
    return newResults;
  };
  const clearSeriesStatus = (results, seriesIdx, seriesShots) => {
    const newResults = [...results];
    for (let i = 0; i < seriesShots; i++) {
      newResults[seriesIdx * seriesShots + i] = '';
    }
    return newResults;
  };

  // Öffne Dialog und initialisiere Felder
  const handleOpenResultDialog = (participation) => {
    setActiveParticipation(participation);
    // Vorbelegen mit existierenden Werten oder leeren Feldern (neues Modell: result.series)
    let initialResults = [];
    if (participation.result && Array.isArray(participation.result.series)) {
      initialResults = participation.result.series.map(s => ({ ...s }));
    }
    setResultsInput(initialResults);
    setResultDialogOpen(true);
  };

  // Ergebnisse speichern
  const { token, handleUnauthorized } = useAuth();
  const handleSaveResults = async () => {
    if (!activeParticipation) return;
    try {
      // Participation im Backend aktualisieren
      await updateParticipation(activeParticipation.id, { ...activeParticipation, result: { ...activeParticipation.result, series: resultsInput } }, { token, handleUnauthorized });
      // Competition neu laden
      const updated = await getCompetition(competition.id, { token, handleUnauthorized });
      updateCompetition(competition.id, updated);
      setResultDialogOpen(false);
    } catch (err) {
      alert('Fehler beim Speichern!');
    }
  };

  useEffect(() => {
    if (!group || !Array.isArray(group.participations)) {
      navigate('/login');
    }
  }, [group, navigate]);

  if (!competition || !group) return <div>Keine Gruppe gefunden.</div>;

  return (
    <main className="max-w-2xl mx-auto mt-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-4 text-muted-foreground">
        <Link to={`/writer/competitions/${competition.id}/participationGroups/${group.id}`} className="hover:underline text-primary font-medium">{competition.title}</Link>
        <span>/</span>
        <span className="font-semibold text-black">{group.title}</span>
      </nav>
      <h2 className="text-2xl font-bold mb-6">{group.title}</h2>
      <ul className="space-y-2">
        {sortedParticipations.map((p, idx) => {
          // Fortschritt berechnen (neues Modell)
          const disc = p.discipline;
          const seriesCount = disc?.seriesCount || 1;
          const shotsPerSeries = disc?.shotsPerSeries || 1;
          let filled = 0;
          if (p.result && Array.isArray(p.result.series)) {
            filled = p.result.series.reduce((sum, serie) => sum + (Array.isArray(serie.points) ? serie.points.filter(v => typeof v === 'number' && !isNaN(v)).length : 0), 0);
          }
          const total = seriesCount * shotsPerSeries;
          const percent = total > 0 ? Math.round((filled / total) * 100) : 0;
          return (
            <li key={p.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
              <span className="font-mono w-8">{idx + 1}</span>
              <span className="font-medium">{p.shooter?.fullname || p.shooter?.name}</span>
              <span className="ml-auto text-sm">{disc?.name || ''}</span>
              <span className="ml-4 text-sm">{p.team}</span>
              <Button variant="outline" onClick={() => handleOpenResultDialog(p)}>
                Ergebnisse eintragen
              </Button>
            </li>
          );
        })}
        {group.participations.length === 0 && <li className="text-muted-foreground">Keine Teilnehmer</li>}
      </ul>
      <div className="mt-8">
        <Button variant="secondary" onClick={() => navigate(`/writer/competitions`)}>
          Zurück
        </Button>
      </div>
      {/* Ergebnis-Dialog */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Ergebnisse eintragen</DialogTitle>
          </DialogHeader>
          {activeParticipation && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="font-medium mb-2">{activeParticipation.shooter?.fullname || activeParticipation.shooter?.name} ({activeParticipation.discipline?.name || ''})</div>
                {/* Dynamische Felder je Serie/Schuss */}
                {(() => {
                  const { seriesCount, shotsPerSeries } = getDisciplineInfo(activeParticipation);
                  const fields = [];
                  for (let s = 0; s < seriesCount; s++) {
                    const serie = resultsInput[s] || { points: Array(shotsPerSeries).fill(0), malfunctions: 0, misses: 0, totalPoints: 0 };
                    fields.push(
                      <div key={s} className="mb-6">
                        <div className="text-lg font-semibold mb-2">Serie {s + 1}</div>
                        <div className="flex justify-center">
                          <div className="grid grid-cols-5 gap-2">
                            {serie.points.map((pt, i) => (
                              <input
                                key={i}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]"
                                maxLength={1}
                                className="text-4xl font-mono w-12 h-14 text-center border-2 border-green-700 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-400"
                                value={pt === 0 ? '' : pt}
                                onChange={e => {
                                  let val = e.target.value.replace(/[^0-9]/g, '');
                                  if (val.length > 1) val = val[0];
                                  const num = val === '' ? 0 : parseInt(val, 10);
                                  const newResults = [...resultsInput];
                                  if (!newResults[s]) newResults[s] = { points: Array(shotsPerSeries).fill(0), malfunctions: 0, misses: 0, totalPoints: 0 };
                                  newResults[s].points[i] = num;
                                  newResults[s].totalPoints = newResults[s].points.reduce((a, b) => a + b, 0);
                                  setResultsInput(newResults);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return fields;
                })()}
                {/* Gesamtsumme aller Serien */}
                <div className="flex flex-col items-center mt-8">
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17623b' }}>
                    Gesamtsumme: {resultsInput.reduce((sum, serie) => sum + (serie?.totalPoints || 0), 0)}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button onClick={handleSaveResults} className="bg-black text-white hover:bg-black/80">Speichern</Button>
            <DialogClose asChild>
              <Button variant="secondary">Abbrechen</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default WriterParticipantGroupView; 
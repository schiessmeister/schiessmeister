import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const WriterParticipantGroupView = () => {
  const { competitionId, groupId } = useParams();
  const navigate = useNavigate();
  const { competitions, updateCompetition } = useData();
  const competition = competitions.find(c => String(c.id) === String(competitionId));
  const groups = competition?.participantGroups || [];
  const group = groups.find(g => String(g.id) === String(groupId));

  // Dialog-State für Ergebnisse eintragen
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [activeParticipation, setActiveParticipation] = useState(null);
  const [resultsInput, setResultsInput] = useState([]);
  const [autoMode, setAutoMode] = useState(true); // true = automatisch, false = manuell

  // Alle Gruppen für das Dropdown
  const handleGroupChange = (e) => {
    const newGroupId = e.target.value;
    navigate(`/writer/competitions/${competitionId}/participationGroups/${newGroupId}`);
  };

  // Teilnehmer sortieren nach Rang (z.B. Punkte, wie im Manager-Leaderboard)
  const sortedParticipations = useMemo(() => {
    if (!group) return [];
    // Nur die Teilnahmen, die zur Gruppe gehören:
    const groupParticipationIds = Array.isArray(group.participations)
      ? group.participations.map(p => (typeof p === 'object' ? p.id : p))
      : [];
    const groupParticipations = competition.participations.filter(p => groupParticipationIds.includes(p.id));
    // Punkte aus results extrahieren (z.B. Summe oder Wert)
    return [...groupParticipations].sort((a, b) => {
      const sumA = Array.isArray(a.results) ? a.results.reduce((s, r) => s + (typeof r === 'number' ? r : 0), 0) : 0;
      const sumB = Array.isArray(b.results) ? b.results.reduce((s, r) => s + (typeof r === 'number' ? r : 0), 0) : 0;
      return sumB - sumA;
    });
  }, [group, competition.participations]);

  // Disziplin-Infos für das Modal
  const getDisciplineInfo = (participation) => {
    if (!competition || !participation) return { seriesCount: 1, seriesShots: 1 };
    const disc = competition.disciplines?.find(d => d.name === participation.discipline);
    return disc || { seriesCount: 1, seriesShots: 1 };
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
    // Vorbelegen mit existierenden Werten oder leeren Feldern
    let initialResults = [];
    if (Array.isArray(participation.results)) {
      initialResults = participation.results;
    } else if (typeof participation.results === 'string') {
      try {
        const parsed = JSON.parse(participation.results);
        if (Array.isArray(parsed)) initialResults = parsed;
      } catch {}
    }
    setResultsInput(initialResults);
    setResultDialogOpen(true);
  };

  // Ergebnisse speichern
  const handleSaveResults = () => {
    if (!activeParticipation) return;
    // Participation in Competition finden und aktualisieren
    const updatedParticipations = competition.participations.map(p =>
      p.id === activeParticipation.id ? { ...p, results: resultsInput } : p
    );
    // Competition im Context aktualisieren
    await updateCompetition(competition.id, { ...competition, participations: updatedParticipations });
    setResultDialogOpen(false);
  };

  if (!competition || !group) return <div>Keine Gruppe gefunden.</div>;

  return (
    <main className="max-w-2xl mx-auto mt-8">
      <div className="flex items-center gap-4 mb-4">
        <span className="font-medium">Modus:</span>
        <Switch checked={autoMode} onCheckedChange={setAutoMode} />
        <span>{autoMode ? 'Automatisch' : 'Manuell'}</span>
      </div>
      <nav className="text-sm mb-4 flex items-center gap-2 text-muted-foreground">
        <Link to={`/writer/competitions/${competition.id}`} className="hover:underline text-primary font-medium">{competition.name}</Link>
        <span>/</span>
        <select
          className="border rounded px-2 py-1 text-black font-semibold bg-white"
          value={group.id}
          onChange={handleGroupChange}
        >
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </select>
      </nav>
      <h2 className="text-2xl font-bold mb-6">{competition.name} – {group.title}</h2>
      <ul className="space-y-2">
        {sortedParticipations.map((p, idx) => {
          // Fortschritt berechnen
          const disc = competition.disciplines?.find(d => d.name === p.discipline);
          const seriesCount = disc?.seriesCount || 1;
          const validCount = Array.isArray(p.results)
            ? p.results.filter(v => typeof v === 'number' && !isNaN(v)).length
            : (typeof p.results === 'string' ? (() => { try { const arr = JSON.parse(p.results); return Array.isArray(arr) ? arr.filter(v => typeof v === 'number' && !isNaN(v)).length : 0; } catch { return 0; } })() : 0);
          const percent = Math.round((validCount / seriesCount) * 100);
          return (
            <li key={p.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
              <span className="font-mono w-8">{idx + 1}</span>
              <span className="font-medium">{p.shooter?.name}</span>
              <span className="text-xs text-muted-foreground">{p.shooter?.email}</span>
              <span className="ml-auto text-sm">{p.discipline}</span>
              <span className="ml-4 text-sm">{p.team}</span>
              <span className="ml-4 text-sm font-bold text-green-700">{percent}% eingetragen</span>
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
                <div className="font-medium mb-2">{activeParticipation.shooter?.name} ({activeParticipation.discipline})</div>
                {/* Dynamische Felder je Serie/Schuss */}
                {(() => {
                  const { seriesCount, seriesShots } = getDisciplineInfo(activeParticipation);
                  const fields = [];
                  for (let s = 0; s < seriesCount; s++) {
                    const status = getSeriesStatus(resultsInput, s, 1); // 1, weil wir jetzt pro Serie einen Wert speichern
                    const maxValue = seriesShots * 10;
                    const value = typeof resultsInput[s] === 'number' ? resultsInput[s] : '';
                    fields.push(
                      <div key={s} className="mb-2">
                        <div className="font-semibold mb-1">Serie {s + 1}</div>
                        <div className="flex gap-2 items-center">
                          <Button size="sm" variant="outline" onClick={() => {
                            if (!status) {
                              const newResults = [...resultsInput];
                              newResults[s] = Math.max(0, (typeof newResults[s] === 'number' ? newResults[s] : 0) - 1);
                              setResultsInput(newResults);
                            }
                          }} disabled={status || value <= 0}>-</Button>
                          <input
                            type="number"
                            min={0}
                            max={maxValue}
                            className="w-24 text-center border rounded"
                            value={status ? '' : value}
                            onChange={e => {
                              if (!status) {
                                let val = parseInt(e.target.value, 10);
                                if (isNaN(val)) val = 0;
                                val = Math.max(0, Math.min(maxValue, val));
                                const newResults = [...resultsInput];
                                newResults[s] = val;
                                setResultsInput(newResults);
                              }
                            }}
                            disabled={!!status}
                          />
                          <Button size="sm" variant="outline" onClick={() => {
                            if (!status) {
                              const newResults = [...resultsInput];
                              newResults[s] = Math.min(maxValue, (typeof newResults[s] === 'number' ? newResults[s] : 0) + 1);
                              setResultsInput(newResults);
                            }
                          }} disabled={status || value >= maxValue}>+</Button>
                          <Button size="sm" variant={status === 'DNF' ? 'destructive' : 'outline'} onClick={() => {
                            const newResults = [...resultsInput];
                            newResults[s] = 'DNF';
                            setResultsInput(newResults);
                          }}>
                            DNF
                          </Button>
                          <Button size="sm" variant={status === 'DNQ' ? 'destructive' : 'outline'} onClick={() => {
                            const newResults = [...resultsInput];
                            newResults[s] = 'DNQ';
                            setResultsInput(newResults);
                          }}>
                            DNQ
                          </Button>
                          {status && (
                            <span className="ml-2 font-bold">{status}</span>
                          )}
                          {status && (
                            <Button size="sm" variant="secondary" onClick={() => {
                              const newResults = [...resultsInput];
                              newResults[s] = 0;
                              setResultsInput(newResults);
                            }}>
                              Zurücksetzen
                            </Button>
                          )}
                          {/* Neuer Button zum Löschen/Zurücksetzen */}
                          <Button size="sm" variant="ghost" onClick={() => {
                            const newResults = [...resultsInput];
                            newResults[s] = '';
                            setResultsInput(newResults);
                          }} title="Serie löschen">
                            🗑️
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  return fields;
                })()}
              </div>
              {/* Schnitt-Anzeige */}
              <div className="flex flex-col items-center mt-6">
                {(() => {
                  // Nur gültige Zahlen zählen
                  const valid = resultsInput.filter(v => typeof v === 'number' && !isNaN(v));
                  if (valid.length > 0) {
                    const schnitt = valid.reduce((a, b) => a + b, 0) / valid.length;
                    return <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#17623b' }}>Schnitt: {schnitt.toFixed(2)}</div>;
                  }
                  return null;
                })()}
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
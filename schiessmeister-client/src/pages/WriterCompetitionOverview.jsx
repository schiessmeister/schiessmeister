import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompetition } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const WriterCompetitionOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [error, setError] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(true);
  const auth = useAuth();
  const { competitions } = useData();
  const basePath = '/writer';

  const parseResults = (participation) => {
    try {
      if (!participation.results) return [];
      if (Array.isArray(participation.results)) return participation.results;
      if (typeof participation.results === 'object') return participation.results;
      if (typeof participation.results === 'string') {
        const trimmed = participation.results.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          return JSON.parse(trimmed);
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  const filterParticipations = (participation, isCompleted) => {
    const results = parseResults(participation);
    return isCompleted ? results.length === 5 : results.length < 5;
  };

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        // Versuche echtes Backend, fallback auf context data
        let data;
        try {
          data = await getCompetition(id, auth);
        } catch (err) {
          // Fallback auf context data
          data = competitions.find(c => String(c.id) === String(id));
        }
        // Wenn context data, dann participations IDs auf Objekte mappen
        if (data && data.participantGroups && data.participations) {
          data = {
            ...data,
            participantGroups: data.participantGroups.map(g => ({
              ...g,
              participations: Array.isArray(g.participations)
                ? g.participations.map(pid => data.participations.find(p => p.id === pid)).filter(Boolean)
                : [],
            })),
          };
        }
        setCompetition(data);
      } catch (err) {
        setError('Failed to load competition details');
        console.error(err);
      }
    };
    fetchCompetition();
  }, [id, auth, competitions]);

  if (error) return <div className="error">{error}</div>;
  if (!competition) return <div>Mockdaten werden geladen...</div>;

  // Teilnehmergruppen-Auswahl als Dialog
  if (competition.participantGroups && !selectedGroupId) {
    return (
      <Dialog open={dialogOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md w-full flex flex-col justify-between px-8 py-8 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle>Teilnehmergruppe wählen</DialogTitle>
          </DialogHeader>
          <select
            className="border rounded px-3 py-2 mt-4"
            value={selectedGroupId || ''}
            onChange={e => {
              const groupId = e.target.value;
              setSelectedGroupId(groupId);
              setDialogOpen(false);
              // Direkt auf die participationGroup-Ansicht navigieren
              navigate(`/writer/competitions/${id}/participationGroups/${groupId}`);
            }}
          >
            <option value="">Bitte wählen…</option>
            {competition.participantGroups.map(g => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        </DialogContent>
      </Dialog>
    );
  }

  // Filter Teilnehmer nach gewählter Gruppe
  let filteredParticipations = competition.participations;
  if (selectedGroupId) {
    const group = competition.participantGroups.find(g => g.id === selectedGroupId);
    filteredParticipations = group ? group.participations : [];
  }

  const nextParticipants = filteredParticipations.filter((p) => filterParticipations(p, false));
  const completedParticipants = filteredParticipations.filter((p) => filterParticipations(p, true));

  const ParticipantList = ({ participants, title }) => (
    <div className="participants-list">
      <h3>{title}</h3>
      <div className="participants-grid">
        {participants.map((participation) => (
          <div key={participation.id} className="participant-item">
            <span className="participant-name">{participation.shooter.name}</span>
            <Button variant="outline" onClick={() => navigate(`${basePath}/results/${id}/${participation.id}`)}>
              Ergebnisse
            </Button>
          </div>
        ))}
        {participants.length === 0 && <p>Keine {title}.</p>}
      </div>
    </div>
  );

  return (
    <main>
      <h2>{competition.name}</h2>
      <div className="competition-details">
        <p>
          <strong>Datum:</strong> {new Date(competition.date).toLocaleString()}
        </p>
        <p>
          <strong>Ort:</strong> {competition.location}
        </p>
        <p>
          <strong>Teilnehmer:</strong> {filteredParticipations.length}
        </p>
      </div>
      <ParticipantList participants={nextParticipants} title="Nächste Teilnehmer" />
      <ParticipantList participants={completedParticipants} title="Abgeschlossene Teilnehmer" />
      <div className="competition-actions">
        <Button variant="secondary" onClick={() => navigate(`${basePath}/competitions`)}>
          Zurück
        </Button>
      </div>
    </main>
  );
};

export default WriterCompetitionOverview; 
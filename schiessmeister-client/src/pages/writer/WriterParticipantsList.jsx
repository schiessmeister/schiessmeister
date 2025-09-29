import { useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const WriterParticipantsList = () => {
  const { id } = useParams();
  const { competitions } = useData();
  const competition = competitions.find(c => String(c.id) === String(id));

  if (!competition) return <div>Kein Wettbewerb gefunden.</div>;

  // Alle Gruppen und deren Teilnehmer anzeigen
  return (
    <main className="max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Teilnehmerlisten (Writer-Ansicht)</h2>
      {competition.participantGroups?.map(group => (
        <div key={group.id} className="mb-8 p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-2">{group.title}</h3>
          <ul className="space-y-2">
            {group.participations.map(p => (
              <li key={p.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                <span className="font-mono w-8">{p.id}</span>
                <span className="font-medium">{p.shooter?.name}</span>
                <span className="text-xs text-muted-foreground">{p.shooter?.email}</span>
                <span className="ml-auto text-sm">{p.discipline}</span>
                <span className="ml-4 text-sm">{p.team}</span>
              </li>
            ))}
            {group.participations.length === 0 && <li className="text-muted-foreground">Keine Teilnehmer</li>}
          </ul>
        </div>
      ))}
    </main>
  );
};

export default WriterParticipantsList; 
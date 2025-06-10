import { Link, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '@/components/ui/button';
import { TreeView } from '@/components/tree-view';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Pencil, Folder, File } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const KlassenList = ({ klassen, onRemove }) => (
  <div>
    <label className="block font-medium mb-1">Klassen</label>
    <ul>
      {klassen.map((k, i) => (
        <li key={i} className="flex items-center gap-2 mb-1">
          <span>{k}</span>
          {onRemove && <Button type="button" size="icon" variant="ghost" onClick={() => onRemove(i)}>🗑️</Button>}
        </li>
      ))}
    </ul>
  </div>
);

const SchreiberList = ({ schreiber, onRemove }) => (
  <div>
    <label className="block font-medium mb-1">Schreiber</label>
    <ul>
      {schreiber.map((s, i) => (
        <li key={i} className="flex items-center gap-2 mb-1">
          <span>{s}</span>
          {onRemove && <Button type="button" size="icon" variant="ghost" onClick={() => onRemove(i)}>🗑️</Button>}
        </li>
      ))}
    </ul>
  </div>
);

const DisziplinenList = ({ disziplinen, onEdit, onRemove }) => (
  <div>
    <label className="block font-medium mb-1">Disziplin</label>
    <ul>
      {disziplinen.map((d, i) => (
        <li key={i} className="flex items-center gap-2 mb-1">
          <span>{d.name}</span>
          {onEdit && <Button type="button" size="icon" variant="ghost" onClick={() => onEdit(i)}>✏️</Button>}
          {onRemove && <Button type="button" size="icon" variant="ghost" onClick={() => onRemove(i)}>🗑️</Button>}
        </li>
      ))}
    </ul>
  </div>
);

// Hilfsfunktion zum Mapping der Gruppenstruktur auf TreeView
function mapGroupsToTree(groups) {
  return groups.map(g => ({
    id: g.id,
    name: g.title,
    icon: g.subParticipationGroups && g.subParticipationGroups.length > 0 ? Folder : File,
    children: g.subParticipationGroups && g.subParticipationGroups.length > 0 ? mapGroupsToTree(g.subParticipationGroups) : undefined,
    actions: (
      <Link to={`/participant-groups/${g.id}/edit`} className="ml-2 align-middle text-muted-foreground hover:text-black transition-colors">
        <Pencil className="w-4 h-4" />
      </Link>
    ),
  }));
}

// Hilfsfunktion für alle Gruppen als Flat-Array (für Select)
function flattenGroups(groups, prefix = '') {
  return groups.reduce((acc, g) => {
    const label = prefix ? `${prefix} / ${g.title}` : g.title;
    acc.push({ id: g.id, label });
    if (g.subParticipationGroups && g.subParticipationGroups.length > 0) {
      acc = acc.concat(flattenGroups(g.subParticipationGroups, label));
    }
    return acc;
  }, []);
}

const CompetitionDetail = ({ editable = true }) => {
  const { id } = useParams();
  const { competitions } = useData();
  const competition = competitions.find((c) => c.id === parseInt(id));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [parentGroupId, setParentGroupId] = useState('');
  // TODO: persistieren, aktuell nur Demo
  const [groups, setGroups] = useState(competition?.participantGroups || []);

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      const newGroup = {
        id: Date.now().toString(),
        title: newGroupName,
        startDateTime: '',
        endDateTime: '',
        participations: [],
        subParticipationGroups: [],
      };
      if (parentGroupId) {
        // Füge als Subgruppe hinzu
        const addSubGroup = (groups) =>
          groups.map(g =>
            g.id === parentGroupId
              ? { ...g, subParticipationGroups: [...(g.subParticipationGroups || []), newGroup] }
              : { ...g, subParticipationGroups: g.subParticipationGroups ? addSubGroup(g.subParticipationGroups) : [] }
          );
        setGroups(addSubGroup(groups));
      } else {
        // Top-Level-Gruppe
        setGroups([...groups, newGroup]);
      }
      setNewGroupName('');
      setParentGroupId('');
      setDialogOpen(false);
    }
  };

  if (!competition) return <div>Wettbewerb nicht gefunden</div>;

  const basePath = '/manager';

  return (
    <main className="min-h-screen w-full px-4 py-10 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b pb-2">
          <h2 className="text-3xl font-bold">{competition.name}</h2>
          <Button asChild variant="outline" className="ml-4">
            <Link to={`${basePath}/competitions/${id}/leaderboard`}>Leaderboard öffnen</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          <div className="flex flex-col gap-8 col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block font-medium mb-1">Bezeichnung</label>
                <input className="w-full border border-gray-300 rounded-md bg-white px-3 py-2 text-black" value={competition.name} readOnly />
              </div>
              <div>
                <label className="block font-medium mb-1">Datum</label>
                <input className="w-full border border-gray-300 rounded-md bg-white px-3 py-2 text-black" value={competition.date ? format(new Date(competition.date), 'dd. MMMM yyyy, HH:mm', { locale: de }) : ''} readOnly />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <KlassenList klassen={competition.klassen || []} />
              <SchreiberList schreiber={competition.schreiber || []} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <DisziplinenList disziplinen={competition.disziplinen || []} />
            </div>
          </div>
          <div className="col-span-1 flex flex-col items-center">
            <label className="block font-medium mb-2">Teilnehmergruppen</label>
            {editable && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mb-4 w-full" variant="outline">Gruppe hinzufügen</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neue Teilnehmergruppe</DialogTitle>
                  </DialogHeader>
                <Input
                  placeholder="Gruppenname"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="mb-4"
                />
                <label className="block font-medium mb-1">Übergeordnete Gruppe</label>
                <select
                  className="w-full border rounded px-3 py-2 mb-4"
                  value={parentGroupId}
                  onChange={e => setParentGroupId(e.target.value)}
                >
                  <option value="">(Top-Level)</option>
                  {flattenGroups(groups).map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
                <DialogFooter>
                  <Button onClick={handleAddGroup} disabled={!newGroupName.trim()} className="bg-black text-white hover:bg-black/80">Speichern</Button>
                  <DialogClose asChild>
                    <Button variant="secondary">Abbrechen</Button>
                  </DialogClose>
                </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <div className="w-full mt-4 bg-white border rounded-lg p-2 shadow-sm min-h-[80px]">
              <TreeView data={mapGroupsToTree(groups)} />
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-16">
          <Button asChild variant="outline">
            <Link to={`${basePath}/competitions`}>Zurück</Link>
          </Button>
          {editable && (
            <Button asChild variant="outline">
              <Link to={`${basePath}/competitions/${id}/edit`}>Bearbeiten</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
};

export default CompetitionDetail;

import { Link, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '@/components/ui/button';
import { TreeView } from '@/components/tree-view';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Pencil, Folder, File, Plus, Users } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';

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

const SchreiberList = ({ writers, onRemove }) => (
  <div>
    <label className="block font-medium mb-1">Schreiber</label>
    <ul>
      {writers.map((s, i) => (
        <li key={i} className="flex items-center gap-2 mb-1">
          <span>{s}</span>
          {onRemove && <Button type="button" size="icon" variant="ghost" onClick={() => onRemove(i)}>🗑️</Button>}
        </li>
      ))}
    </ul>
  </div>
);

const DisziplinenList = ({ disciplines, onEdit, onRemove }) => (
  <div>
    <label className="block font-medium mb-1">Disziplin</label>
    <ul>
      {disciplines.map((d, i) => (
        <li key={i} className="flex items-center gap-2 mb-1">
          <span>{d.name || d}</span>
          {onEdit && <Button type="button" size="icon" variant="ghost" onClick={() => onEdit(i)}>✏️</Button>}
          {onRemove && <Button type="button" size="icon" variant="ghost" onClick={() => onRemove(i)}>🗑️</Button>}
        </li>
      ))}
    </ul>
  </div>
);

const CompetitionDetail = ({ editable = true }) => {
  const { id } = useParams();
  const { competitions, updateCompetition } = useData();
  const competition = competitions.find((c) => String(c.id) === String(id));
  const [groupsDialogOpen, setGroupsDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [parentGroupId, setParentGroupId] = useState('');
  // Sheet-State jetzt korrekt innerhalb der Komponente:
  const [editGroupSheetOpen, setEditGroupSheetOpen] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');

  // Hilfsfunktion: Gruppen aktualisieren und Competition speichern
  const saveGroups = (newGroups) => {
    updateCompetition(competition.id, { ...competition, groups: newGroups });
  };

  // Neue Gruppe hinzufügen
  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      const allGroups = competition.groups || [];
      // Finde höchste ID (rekursiv)
      function findMaxId(groups) {
        return groups.reduce((max, g) => {
          const subMax = g.subParticipationGroups ? findMaxId(g.subParticipationGroups) : 0;
          return Math.max(max, g.id, subMax);
        }, 0);
      }
      const newId = findMaxId(allGroups) + 1;
      const newGroup = {
        id: newId,
        title: newGroupName,
        startDateTime: '',
        endDateTime: '',
        participations: [],
        subParticipationGroups: [],
      };
      let newGroups;
      if (parentGroupId) {
        // Füge als Subgruppe hinzu
        function addSubGroup(groups) {
          return groups.map(g =>
            g.id === parseInt(parentGroupId)
              ? { ...g, subParticipationGroups: [...(g.subParticipationGroups || []), newGroup] }
              : { ...g, subParticipationGroups: g.subParticipationGroups ? addSubGroup(g.subParticipationGroups) : [] }
          );
        }
        newGroups = addSubGroup(allGroups);
      } else {
        // Top-Level-Gruppe
        newGroups = [...allGroups, newGroup];
      }
      saveGroups(newGroups);
      setNewGroupName('');
      setParentGroupId('');
      setDialogOpen(false);
    }
  };

  // Gruppe bearbeiten
  const handleSaveGroupEdit = () => {
    function updateGroup(groups, id, newName) {
      return groups.map(g =>
        g.id === id
          ? { ...g, title: newName }
          : { ...g, subParticipationGroups: g.subParticipationGroups ? updateGroup(g.subParticipationGroups, id, newName) : [] }
      );
    }
    const newGroups = updateGroup(competition.groups || [], editGroup.id, editGroupName);
    saveGroups(newGroups);
    setEditGroupSheetOpen(false);
  };

  // Gruppe zum Bearbeiten finden
  const handleEditGroupClick = (groupId) => {
    function findGroup(groups, id) {
      for (const g of groups) {
        if (g.id === id) return g;
        if (g.subParticipationGroups) {
          const found = findGroup(g.subParticipationGroups, id);
          if (found) return found;
        }
      }
      return null;
    }
    const group = findGroup(competition.groups || [], groupId);
    if (group) {
      setEditGroup(group);
      setEditGroupName(group.title);
      setEditGroupSheetOpen(true);
    }
  };

  // TreeView-Mapping
  function mapGroupsToTree(groups) {
    return (groups || []).map(g => ({
      id: g.id,
      name: g.title,
      icon: g.subParticipationGroups && g.subParticipationGroups.length > 0 ? Folder : File,
      children: g.subParticipationGroups && g.subParticipationGroups.length > 0 ? mapGroupsToTree(g.subParticipationGroups) : undefined,
      actions: (
        <Link to={`/manager/participant-groups/${g.id}/edit`} className="ml-2 align-middle text-muted-foreground hover:text-black transition-colors">
          <Pencil className="w-4 h-4" />
        </Link>
      ),
    }));
  }

  // Flat-Array für Select
  function flattenGroups(groups, prefix = '') {
    return (groups || []).reduce((acc, g) => {
      const label = prefix ? `${prefix} / ${g.title}` : g.title;
      acc.push({ id: g.id, label });
      if (g.subParticipationGroups && g.subParticipationGroups.length > 0) {
        acc = acc.concat(flattenGroups(g.subParticipationGroups, label));
      }
      return acc;
    }, []);
  }

  if (!competition) return <div>Wettbewerb nicht gefunden</div>;

  const basePath = '/manager';

  return (
    <main className="min-h-screen w-full px-4 py-10 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b pb-2">
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold">{competition.title}</h2>
            <Button asChild variant="outline" className="mt-2 w-fit">
              <Link to={`${basePath}/competitions/${id}/edit`}>Bearbeiten</Link>
            </Button>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button asChild variant="outline" className="ml-4">
              <Link to={`${basePath}/competitions/${id}/leaderboard`}>Leaderboard öffnen</Link>
            </Button>
            <Button variant="outline" className="w-fit flex items-center gap-2 mt-2" onClick={() => { setGroupsDialogOpen(true); }}>
              <Users className="h-4 w-4" /> Teilnehmergruppen verwalten
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          <div className="flex flex-col gap-8 col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block font-medium mb-1">Bezeichnung</label>
                <input className="w-full border border-gray-300 rounded-md bg-white px-3 py-2 text-black" value={competition.title} readOnly />
              </div>
              <div>
                <label className="block font-medium mb-1">Datum</label>
                <input className="w-full border border-gray-300 rounded-md bg-white px-3 py-2 text-black" value={competition.startDateTime ? format(new Date(competition.startDateTime), 'dd. MMMM yyyy', { locale: de }) : ''} readOnly />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <KlassenList klassen={competition.availableClasses || []} />
              <SchreiberList writers={competition.recorders || []} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <DisziplinenList disciplines={competition.disciplines || []} />
            </div>
            {competition.location && (
              <div className="mt-2 text-sm text-muted-foreground">Ort: {competition.location}</div>
            )}
            {competition.announcementUrl && (
              <div className="mt-2"><a href={competition.announcementUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">Ausschreibung</a></div>
            )}
          </div>
        </div>
        <Dialog open={groupsDialogOpen} onOpenChange={setGroupsDialogOpen}>
          <DialogContent className="max-w-lg w-full">
            <DialogHeader>
              <DialogTitle>Teilnehmergruppen verwalten</DialogTitle>
            </DialogHeader>
            <div className="flex items-center w-full mb-2">
              <label className="block font-medium">Teilnehmergruppen</label>
              <Button variant="outline" size="icon" className="ml-2 h-8 w-8" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-full bg-white border rounded-lg p-2 shadow-sm min-h-[80px]">
              <TreeView data={mapGroupsToTree(competition.groups || [])} />
            </div>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="secondary">Schließen</Button>
              </DialogClose>
            </DialogFooter>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                  {flattenGroups(competition.groups || []).map(g => (
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
            <Sheet open={editGroupSheetOpen} onOpenChange={setEditGroupSheetOpen}>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Teilnehmergruppe bearbeiten</SheetTitle>
                </SheetHeader>
                <div className="p-4 flex flex-col gap-4">
                  <label className="block font-medium mb-1">Gruppenname</label>
                  <Input value={editGroupName} onChange={e => setEditGroupName(e.target.value)} />
                </div>
                <SheetFooter>
                  <Button onClick={handleSaveGroupEdit} className="bg-black text-white hover:bg-black/80">Speichern</Button>
                  <SheetClose asChild>
                    <Button variant="secondary">Abbrechen</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </DialogContent>
        </Dialog>
        <div className="flex justify-between mt-16">
          <Button asChild variant="outline">
            <Link to={`${basePath}/competitions`}>Zurück</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default CompetitionDetail;

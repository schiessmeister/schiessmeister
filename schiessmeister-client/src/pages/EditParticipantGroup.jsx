import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ChevronDownIcon, Calendar as CalendarIcon, Plus, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Select } from '@/components/ui/select';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { ReactSortable } from 'react-sortablejs';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const getInitials = (name) => name.split(' ').map((n) => n[0]).join('');

const EditParticipantGroup = () => {
  const { id } = useParams(); // id der Gruppe
  const { competitions } = useData();

  // Rekursive Hilfsfunktion, um eine Gruppe (und ihre Competition) zu finden
  function findGroupAndCompetition(competitions, groupId) {
    for (const c of competitions) {
      function findGroup(groups) {
        for (const g of groups || []) {
          if (String(g.id) === String(groupId)) return g;
          if (g.subParticipationGroups && g.subParticipationGroups.length > 0) {
            const found = findGroup(g.subParticipationGroups);
            if (found) return found;
          }
        }
        return null;
      }
      const group = findGroup(c.participantGroups);
      if (group) return { competition: c, group };
    }
    return null;
  }

  // Suche die Competition und Gruppe in allen Wettbewerben (inkl. Subgruppen)
  const found = findGroupAndCompetition(competitions, id);
  if (!found) return <div>Gruppe nicht gefunden</div>;
  const { competition, group } = found;

  // Map group participations (IDs) to full participation objects
  const groupParticipations = Array.isArray(group.participations)
    ? group.participations.map(pid =>
        typeof pid === 'object' ? pid : competition.participations.find(p => p.id === pid)
      ).filter(Boolean)
    : [];

  const [title, setTitle] = useState(group.title);
  const [dateRange, setDateRange] = useState({
    from: group.startDateTime,
    to: group.endDateTime,
  });
  const [subGroup, setSubGroup] = useState('');
  const [participations, setParticipations] = useState(groupParticipations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newParticipation, setNewParticipation] = useState({ shooter: '', team: '', newTeam: '', discipline: '' });
  // Unique shooters by email (alle Teilnehmer aus allen Wettbewerben)
  const shooters = Array.from(
    new Map(
      (competitions.flatMap(c => c.participations || []) || [])
        .filter(p => p && p.shooter && p.shooter.name)
        .map(p => [p.shooter.name, p.shooter])
    ).values()
  );

  // Unique teams aus allen Wettbewerben, ohne leere Strings
  const initialTeams = Array.from(
    new Set(
      (competitions.flatMap(c => c.participations || []) || [])
        .map(p => p.team)
        .filter(t => t && t.trim() !== "")
    )
  );
  const [teams, setTeams] = useState(initialTeams);

  const disciplines = competition.disciplines.map(d => d.name);
  const [editIndex, setEditIndex] = useState(null);

  // Hilfsfunktion: Hierarchie der Gruppen für Breadcrumb
  function getGroupHierarchy(groups, groupId, path = []) {
    for (const g of groups || []) {
      if (String(g.id) === String(groupId)) {
        return [...path, g];
      }
      if (g.subParticipationGroups && g.subParticipationGroups.length > 0) {
        const found = getGroupHierarchy(g.subParticipationGroups, groupId, [...path, g]);
        if (found) return found;
      }
    }
    return null;
  }

  const groupHierarchy = getGroupHierarchy(competition.participantGroups, group.id) || [];

  const handleAddParticipation = () => {
    if (!newParticipation.shooter || !newParticipation.discipline) return;
    setParticipations([
      ...participations,
      {
        id: Date.now(),
        shooter: shooters.find(s => s.name === newParticipation.shooter),
        team: newParticipation.team || newParticipation.newTeam || 'Kein Team',
        discipline: newParticipation.discipline,
      },
    ]);
    setDialogOpen(false);
    setNewParticipation({ shooter: '', team: '', newTeam: '', discipline: '' });
  };

  const openAddPanel = () => {
    setEditIndex(null);
    setNewParticipation({ shooter: '', team: '', newTeam: '', discipline: '' });
    setDialogOpen(true);
  };

  const openEditPanel = (idx) => {
    const p = participations[idx];
    setEditIndex(idx);
    setNewParticipation({
      shooter: p.shooter?.name || '',
      team: p.team || '',
      newTeam: '',
      discipline: p.discipline || '',
    });
    setDialogOpen(true);
  };

  const handleSaveParticipation = () => {
    if (!newParticipation.shooter || !newParticipation.discipline) return;
    const newEntry = {
      id: editIndex !== null ? participations[editIndex].id : Date.now(),
      shooter: shooters.find(s => s.name === newParticipation.shooter),
      team: newParticipation.team || newParticipation.newTeam || 'Kein Team',
      discipline: newParticipation.discipline,
    };
    if (editIndex !== null) {
      setParticipations(participations.map((p, i) => (i === editIndex ? newEntry : p)));
    } else {
      setParticipations([...participations, newEntry]);
    }
    setDialogOpen(false);
    setEditIndex(null);
    setNewParticipation({ shooter: '', team: '', newTeam: '', discipline: '' });
  };

  // Handler für neues Team übernehmen
  const handleAddNewTeam = () => {
    const newTeam = newParticipation.newTeam && newParticipation.newTeam.trim();
    if (newTeam) {
      // Team zur Liste hinzufügen, falls noch nicht vorhanden
      if (!teams.includes(newTeam)) {
        setTeams([...teams, newTeam]);
      }
      setNewParticipation({
        ...newParticipation,
        team: newTeam,
        newTeam: ''
      });
    }
  };

  return (
    <main className="max-w-3xl mx-auto mt-8 bg-white rounded-xl border p-8 shadow">
      <div className="mb-6 text-sm text-muted-foreground flex gap-2 items-center flex-wrap">
        <Link to={`/manager/competitions/${competition.id}`} className="hover:underline text-black">{competition.name}</Link>
        <span>/</span>
        {groupHierarchy.map((g, idx) => (
          <span key={g.id} className="flex items-center gap-2">
            {idx > 0 && <span>/</span>}
            <span className={idx === groupHierarchy.length - 1 ? 'text-black font-medium' : ''}>{g.title}</span>
          </span>
        ))}
      </div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <div className="mb-4">
            <label className="block font-medium mb-1">Bezeichnung</label>
            <Input placeholder="Gruppenname" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Zeitraum</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, 'dd MMMM yyyy')} - ${format(dateRange.to, 'dd MMMM yyyy')}`
                    : 'Zeitraum wählen'}
                  <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      <hr className="my-6" />
      <div className="mb-2 font-semibold text-lg">Teilnahmen</div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={openAddPanel}><Plus className="mr-2" />Neue Teilnahme hinzufügen</Button>
      </div>
      <ReactSortable
        tag="div"
        className="flex flex-col gap-2"
        list={participations}
        setList={setParticipations}
        animation={200}
        handle=".drag-handle"
      >
        {participations.map((p, i) => (
          <Card key={p.id} className="flex items-center gap-4 px-4 py-3">
            <div className="w-6 text-center font-bold">{i + 1}</div>
            <div className="drag-handle cursor-move text-base w-6 text-center">≡</div>
            <Avatar>
              <AvatarFallback>{getInitials(p.shooter?.name || '?')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex flex-col">
              <div className="font-medium">{p.shooter?.name || '-'}</div>
              <div className="text-xs text-muted-foreground">{p.shooter?.email || ''}</div>
              <div className="text-sm font-medium mt-1">{p.discipline}</div>
            </div>
            <div className="text-sm min-w-[80px]">{p.team || 'Kein Team'}</div>
            <Button size="icon" variant="ghost" onClick={() => openEditPanel(i)}><Pencil /></Button>
            <Button size="sm" variant="destructive" onClick={() => setParticipations(participations.filter((_, idx) => idx !== i))}><Trash2 /></Button>
          </Card>
        ))}
      </ReactSortable>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl w-full flex flex-col justify-between px-8 py-8 rounded-xl shadow-xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white z-50">
          <div className="flex-1 flex flex-col">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl text-center md:text-left mb-4 text-green-900">{editIndex !== null ? 'Teilnahme bearbeiten' : 'Neue Teilnahme hinzufügen'}</DialogTitle>
            </DialogHeader>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
              <div className="flex flex-col gap-2">
                <label className="block font-medium mb-1">Teilnehmer</label>
                <Select value={newParticipation.shooter} onChange={e => setNewParticipation({ ...newParticipation, shooter: e.target.value })}>
                  <option value="">Select</option>
                  {shooters.map((s, i) => (
                    <option key={i} value={s.name}>{s.name}</option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="block font-medium mb-1">Team <span className="text-xs text-muted-foreground">(optional)</span></label>
                <Select value={newParticipation.team} onChange={e => setNewParticipation({ ...newParticipation, team: e.target.value, newTeam: '' })}>
                  <option value="">Select</option>
                  {teams.map((t, i) => (
                    <option key={i} value={t}>{t}</option>
                  ))}
                </Select>
                <div className="flex items-center gap-2 mt-2">
                  <Input placeholder="Neues Team (optional)" value={newParticipation.newTeam} onChange={e => setNewParticipation({ ...newParticipation, newTeam: e.target.value, team: '' })} />
                  <Button size="icon" variant="outline" type="button" onClick={handleAddNewTeam}><Plus /></Button>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="block font-medium mb-1">Disziplin</label>
                <Select value={newParticipation.discipline} onChange={e => setNewParticipation({ ...newParticipation, discipline: e.target.value })}>
                  <option value="">Select</option>
                  {disciplines.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </Select>
              </div>
            </form>
            <div className="flex gap-4 mt-8">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
              <Button type="button" onClick={editIndex !== null ? handleSaveParticipation : handleAddParticipation}>
                {editIndex !== null ? 'Speichern' : 'Hinzufügen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default EditParticipantGroup;

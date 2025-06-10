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
  // Demo: hole erste Competition und erste Gruppe
  const competition = competitions[0];
  const group = competition.participantGroups?.find((g) => g.id === id) || {
    title: 'Teilnehmergruppe X',
    startDateTime: new Date('2023-06-13'),
    endDateTime: new Date('2023-07-14'),
    participations: competition.participations?.slice(0, 3) || [],
    subParticipationGroups: [],
  };

  const [title, setTitle] = useState(group.title);
  const [dateRange, setDateRange] = useState({
    from: group.startDateTime,
    to: group.endDateTime,
  });
  const [subGroup, setSubGroup] = useState('');
  const [participations, setParticipations] = useState(group.participations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newParticipation, setNewParticipation] = useState({ shooter: '', team: '', newTeam: '', discipline: '' });
  const shooters = competition.participations.map(p => p.shooter); // Demo: alle Shooter
  const teams = Array.from(new Set(competition.participations.map(p => p.team)));
  const disciplines = competition.disciplines.map(d => d.name);
  const [editIndex, setEditIndex] = useState(null);

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

  return (
    <main className="max-w-3xl mx-auto mt-8 bg-white rounded-xl border p-8 shadow">
      <div className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <Link to={`/manager/competitions/${competition.id}`} className="hover:underline text-black">{competition.name}</Link>
        <span>/</span>
        <span className="text-black font-medium">{group.title || title}</span>
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
                  <Button size="icon" variant="outline" type="button"><Plus /></Button>
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

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { WriterMultiCombobox } from '@/components/ui/WriterMultiCombobox';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { de } from 'date-fns/locale';

const FIXED_WRITERS = ['Timon Stadelmann', 'Thomas Bischof', 'Luca Nigsch'];

const CompetitionForm = ({ initialValues, onSubmit, submitLabel, onCancel }) => {
  const [name, setName] = useState(initialValues.name || '');
  const [date, setDate] = useState(
    initialValues.date ? new Date(initialValues.date) : undefined
  );
  const [klassen, setKlassen] = useState(initialValues.klassen || []);
  const [writers, setSchreiber] = useState(initialValues.writers || []);
  const [disciplines, setDisziplinen] = useState(initialValues.disciplines || []);

  const [sheetKlasseOpen, setSheetKlasseOpen] = useState(false);
  const [sheetSchreiberOpen, setSheetSchreiberOpen] = useState(false);
  const [sheetDisziplinOpen, setSheetDisziplinOpen] = useState(false);

  const [newKlasse, setNewKlasse] = useState('');
  const [newDisziplin, setNewDisziplin] = useState('');
  const [newDisziplinSerien, setNewDisziplinSerien] = useState(1);
  const [newDisziplinSchuesse, setNewDisziplinSchuesse] = useState(1);

  const [errorKlassen, setErrorKlassen] = useState('');
  const [errorDisziplinen, setErrorDisziplinen] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    let valid = true;
    if (klassen.length === 0) {
      setErrorKlassen('Mindestens eine Klasse ist erforderlich.');
      valid = false;
    } else {
      setErrorKlassen('');
    }
    if (disciplines.length === 0) {
      setErrorDisziplinen('Mindestens eine Disziplin ist erforderlich.');
      valid = false;
    } else {
      setErrorDisziplinen('');
    }
    if (!valid) return;
    onSubmit({
      name,
      date: date ? date.toISOString() : '',
      klassen,
      writers,
      disciplines,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto mt-8 flex flex-col gap-8">
      <h2 className="text-3xl font-bold mb-6"></h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div>
            <label className="block font-medium mb-1">Bezeichnung</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bezeichnung" required />
          </div>
          <div>
            <label className="block font-medium mb-1">Datum</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={"w-full justify-start text-left font-normal " + (!date ? 'text-muted-foreground' : '')}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'dd. MMMM yyyy',{ locale: de }) : 'Datum wählen'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} captionLayout="dropdown" />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="block font-medium mb-1">Klassen</label>
            <ul className="mb-2">
              {klassen.map((k, i) => (
                <li key={i} className="flex items-center gap-2 mb-1">
                  <span>{k}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => { setKlassen(klassen.filter((_, idx) => idx !== i)); setErrorKlassen(klassen.length - 1 > 1 ? '' : errorKlassen); }}>
                    🗑️
                  </Button>
                </li>
              ))}
            </ul>
            {errorKlassen && <div className="text-red-600 text-sm mb-2">{errorKlassen}</div>}
            <Sheet open={sheetKlasseOpen} onOpenChange={setSheetKlasseOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" className="w-full" onClick={() => setSheetKlasseOpen(true)}>
                  Neue Klasse hinzufügen
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Klasse hinzufügen</SheetTitle>
                </SheetHeader>
                <div className="p-4 flex flex-col gap-4">
                  <Input placeholder="Klassenname" value={newKlasse} onChange={(e) => setNewKlasse(e.target.value)} />
                  <Button type="button" onClick={() => { if (newKlasse) { setKlassen([...klassen, newKlasse]); setNewKlasse(''); setSheetKlasseOpen(false); setErrorKlassen(klassen.length + 1 > 0 ? '' : errorKlassen); } }}>
                    Hinzufügen
                  </Button>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="secondary">Abbrechen</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          <div>
            <WriterMultiCombobox options={FIXED_WRITERS} value={writers} onChange={setSchreiber} label="Schreiber" />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div>
            <label className="block font-medium mb-1">Disziplin</label>
            <ul className="mb-2">
              {disciplines.map((d, i) => (
                <li key={i} className="flex items-center gap-2 mb-1">
                  <span>
                    {d.name} (Serien: {d.seriesCount}, Schüsse: {d.seriesShots})
                  </span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => setDisziplinen(disciplines.filter((_, idx) => idx !== i))}>
                    🗑️
                  </Button>
                </li>
              ))}
            </ul>
            {errorDisziplinen && <div className="text-red-600 text-sm mb-2">{errorDisziplinen}</div>}
            <Sheet open={sheetDisziplinOpen} onOpenChange={setSheetDisziplinOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" className="w-full" onClick={() => setSheetDisziplinOpen(true)}>
                  Neue Disziplin hinzufügen
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Neue Disziplin hinzufügen</SheetTitle>
                </SheetHeader>
                <div className="p-4 flex flex-col gap-4">
                  <Input placeholder="Bezeichnung" value={newDisziplin} onChange={(e) => setNewDisziplin(e.target.value)} />
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center w-full">
                      <label className="block text-xs mb-2">Anzahl Serien</label>
                      <div className="flex items-center justify-center gap-2 w-full">
                        <Button type="button" size="icon" className="text-2xl h-14 w-14" onClick={() => setNewDisziplinSerien(v => Math.max(1, v - 1))}>-</Button>
                        <div className="text-4xl font-mono w-24 text-center border rounded-lg h-14 flex items-center justify-center select-none bg-white">{String(newDisziplinSerien).padStart(3, '0')}</div>
                        <Button type="button" size="icon" className="text-2xl h-14 w-14" onClick={() => setNewDisziplinSerien(v => Math.min(999, v + 1))}>+</Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center w-full">
                      <label className="block text-xs mb-2">Anzahl Schüsse</label>
                      <div className="flex items-center justify-center gap-2 w-full">
                        <Button type="button" size="icon" className="text-2xl h-14 w-14" onClick={() => setNewDisziplinSchuesse(v => Math.max(1, v - 1))}>-</Button>
                        <div className="text-4xl font-mono w-24 text-center border rounded-lg h-14 flex items-center justify-center select-none bg-white">{String(newDisziplinSchuesse).padStart(3, '0')}</div>
                        <Button type="button" size="icon" className="text-2xl h-14 w-14" onClick={() => setNewDisziplinSchuesse(v => Math.min(999, v + 1))}>+</Button>
                      </div>
                    </div>
                  </div>
                  <Button type="button" onClick={() => { if (newDisziplin) { setDisziplinen([...disciplines, { name: newDisziplin, seriesCount: newDisziplinSerien, seriesShots: newDisziplinSchuesse }]); setNewDisziplin(''); setNewDisziplinSerien(1); setNewDisziplinSchuesse(1); setSheetDisziplinOpen(false); setErrorKlassen(klassen.length + 1 > 0 ? '' : errorKlassen); } }}>
                    Erstellen
                  </Button>
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="secondary">Abbrechen</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-4 mt-8">
        <Button type="submit" className="bg-black text-white hover:bg-black/80">{submitLabel}</Button>
        {onCancel && (
          <Button type="button" variant="destructive" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
};

export default CompetitionForm;

import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ChevronDownIcon, Calendar as CalendarIcon, Plus, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Select } from '@/components/ui/select';
import { ReactSortable } from 'react-sortablejs';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { canEditParticipations } from '../../utils/permissions';
import { updateParticipationGroup, createParticipationInGroup, deleteParticipation, updateParticipation, getCompetitionTeams } from '../../api/apiClient';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ShooterCombobox } from '@/components/ui/ShooterCombobox';

const getInitials = (name) =>
	name
		.split(' ')
		.map((n) => n[0])
		.join('');

const EditParticipantGroup = () => {
	const { id } = useParams(); // id der Gruppe
	const [searchParams] = useSearchParams();
	const { competitions, refreshCompetition, isLoading } = useData();
	const { ownedOrganizations, userId, token, handleUnauthorized } = useAuth();
	const navigate = useNavigate();

	// Rekursive Hilfsfunktion, um eine Gruppe (und ihre Competition) zu finden
	function findGroupAndCompetition(competitions, groupId) {
		for (const c of competitions) {
			function findGroup(groups) {
				for (const g of groups || []) {
					if (String(g.id) === String(groupId)) return g;
					if (g.subGroups && g.subGroups.length > 0) {
						const found = findGroup(g.subGroups);
						if (found) return found;
					}
				}
				return null;
			}
			const group = findGroup(c.groups);
			if (group) return { competition: c, group };
		}
		return null;
	}

	// Suche die Competition und Gruppe in allen Wettbewerben (inkl. Subgruppen)
	const found = findGroupAndCompetition(competitions, id);
	const competition = found?.competition;
	const group = found?.group;

	// Permission check
	const canEdit = competition && group && canEditParticipations(competition, ownedOrganizations, userId);

	const [title, setTitle] = useState('');
	const [dateRange, setDateRange] = useState({
		from: undefined,
		to: undefined
	});
	const [participations, setParticipations] = useState([]);
	const [originalParticipations, setOriginalParticipations] = useState([]);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [newParticipation, setNewParticipation] = useState({ shooter: null, team: '', newTeam: '', discipline: '', shooterClass: '' });

	const [teams, setTeams] = useState([]);

	const disciplines = competition?.disciplines?.map((d) => d.name) || [];
	const [editIndex, setEditIndex] = useState(null);

	// Load teams from backend
	useEffect(() => {
		const loadTeams = async () => {
			if (competition?.id && token) {
				try {
					const teamsData = await getCompetitionTeams(competition.id, { token, handleUnauthorized });
					setTeams(teamsData || []);
				} catch (error) {
					console.error('Error loading teams:', error);
					setTeams([]);
				}
			}
		};
		loadTeams();
	}, [competition?.id, token, handleUnauthorized]);

	// Update states when group data is loaded
	useEffect(() => {
		if (group && competition) {
			setTitle(group.title || '');
			setDateRange({
				from: group.startDateTime,
				to: group.endDateTime
			});

			// Map group participations to full participation objects with all data
			const groupParticipations = Array.isArray(group.participations)
				? group.participations
						.map((p) => {
							// Get participation ID (could be object or just ID)
							const participationId = 'object' === typeof p ? p.id : p;
							// Find full participation from competition.participations (has shooter data)
							const fullParticipation = competition.participations.find((cp) => cp.id === participationId);
							if (!fullParticipation) return null;

							// Add discipline name from competition.disciplines
							const discipline = competition.disciplines.find((d) => d.id === fullParticipation.disciplineId);

							return {
								...fullParticipation,
								discipline: discipline?.name || '-'
							};
						})
						.filter(Boolean)
						.sort((a, b) => (a.positionNb || 0) - (b.positionNb || 0)) // Sort by position
				: [];

			setParticipations(groupParticipations);
			setOriginalParticipations(groupParticipations);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [group?.id, competition?.id]);

	// Redirect if no permission
	useEffect(() => {
		if (competition && !canEdit) {
			navigate(`/competitions/${competition.id}`);
		}
	}, [competition, canEdit, navigate]);

	// Check if coming from groups dialog
	const fromGroups = searchParams.get('from') === 'groups';

	// Loading state
	if (isLoading) {
		return (
			<main className="max-w-3xl mx-auto mt-8 bg-white rounded-xl border p-8 shadow">
				<div className="mb-6">
					<Skeleton className="h-4 w-64 mb-2" />
				</div>
				<Skeleton className="h-8 w-48 mb-4" />
				<div className="flex flex-col md:flex-row gap-8">
					<div className="flex-1">
						<div className="mb-4">
							<Skeleton className="h-4 w-24 mb-2" />
							<Skeleton className="h-10 w-full" />
						</div>
						<div className="mb-4">
							<Skeleton className="h-4 w-24 mb-2" />
							<Skeleton className="h-10 w-full" />
						</div>
					</div>
				</div>
				<hr className="my-6" />
				<Skeleton className="h-6 w-32 mb-4" />
				<Skeleton className="h-10 w-full mb-2" />
				<Skeleton className="h-10 w-full mb-2" />
				<Skeleton className="h-10 w-full mb-2" />
			</main>
		);
	}

	// Early returns after all hooks
	if (!found || !competition || !group) return <div>Gruppe nicht gefunden</div>;
	if (!canEdit) return <div>Keine Berechtigung zum Bearbeiten.</div>;

	// Hilfsfunktion: Hierarchie der Gruppen für Breadcrumb
	function getGroupHierarchy(groups, groupId, path = []) {
		for (const g of groups || []) {
			if (String(g.id) === String(groupId)) {
				return [...path, g];
			}
			if (g.subGroups && g.subGroups.length > 0) {
				const found = getGroupHierarchy(g.subGroups, groupId, [...path, g]);
				if (found) return found;
			}
		}
		return null;
	}

	const groupHierarchy = getGroupHierarchy(competition?.groups || [], group.id) || [];

	const handleAddParticipation = () => {
		if (!newParticipation.shooter || !newParticipation.discipline || !newParticipation.shooterClass) return;
		setParticipations([
			...participations,
			{
				id: `temp-${Date.now()}`,
				shooter: newParticipation.shooter,
				team: newParticipation.team || newParticipation.newTeam || null,
				discipline: newParticipation.discipline,
				shooterClass: newParticipation.shooterClass
			}
		]);
		setDialogOpen(false);
		setNewParticipation({ shooter: null, team: '', newTeam: '', discipline: '', shooterClass: '' });
	};

	const openAddPanel = () => {
		setEditIndex(null);
		setNewParticipation({ shooter: null, team: '', newTeam: '', discipline: '', shooterClass: '' });
		setDialogOpen(true);
	};

	const openEditPanel = (idx) => {
		const p = participations[idx];
		setEditIndex(idx);
		setNewParticipation({
			shooter: p.shooter || null,
			team: p.team || '',
			newTeam: '',
			discipline: p.discipline || '',
			shooterClass: p.shooterClass || ''
		});
		setDialogOpen(true);
	};

	const handleSaveParticipation = () => {
		if (!newParticipation.shooter || !newParticipation.discipline || !newParticipation.shooterClass) return;

		if (editIndex !== null) {
			// Editing existing participation - preserve all fields, only update changed ones
			const existingParticipation = participations[editIndex];
			const updatedEntry = {
				...existingParticipation,
				shooter: newParticipation.shooter,
				team: newParticipation.team || newParticipation.newTeam || null,
				discipline: newParticipation.discipline,
				shooterClass: newParticipation.shooterClass
			};
			setParticipations(participations.map((p, i) => (i === editIndex ? updatedEntry : p)));
		} else {
			// Adding new participation
			const newEntry = {
				id: `temp-${Date.now()}`,
				shooter: newParticipation.shooter,
				team: newParticipation.team || newParticipation.newTeam || null,
				discipline: newParticipation.discipline,
				shooterClass: newParticipation.shooterClass
			};
			setParticipations([...participations, newEntry]);
		}

		setDialogOpen(false);
		setEditIndex(null);
		setNewParticipation({ shooter: null, team: '', newTeam: '', discipline: '', shooterClass: '' });
	};

	// Handler für neues Team übernehmen
	const handleAddNewTeam = () => {
		const newTeam = newParticipation.newTeam && newParticipation.newTeam.trim();
		if (newTeam) {
			// Team zur Liste hinzufügen, falls noch nicht vorhanden
			if (!teams.includes(newTeam)) {
				setTeams((prevTeams) => [...prevTeams, newTeam]);
			}
			setNewParticipation({
				...newParticipation,
				team: newTeam,
				newTeam: ''
			});
		}
	};

	// Speicher-Handler für die Gruppe
	async function handleSaveGroup() {
		try {
			const auth = { token, handleUnauthorized };

			// 1. Update the group basic info (title, dates only)
			const updatedGroup = {
				title,
				startDateTime: dateRange.from,
				endDateTime: dateRange.to,
				competitionId: competition.id,
				parentGroupId: group.parentGroupId || null,
				subGroups: [],
				participations: []
			};

			await updateParticipationGroup(group.id, updatedGroup, auth);

			// 2. Determine which participations are new, modified, or removed
			const originalIds = originalParticipations.map((p) => p.id);
			const currentIds = participations.map((p) => p.id).filter((id) => 'number' === typeof id && 0 < id);

			// New participations: those without a valid ID (temporary IDs)
			const newParticipations = participations.filter((p) => !p.id || 'string' === typeof p.id || 0 >= p.id);

			// Removed participations: those in original but not in current
			const removedIds = originalIds.filter((id) => !currentIds.includes(id));

			// Modified participations: those that exist in both but may have changed
			const modifiedParticipations = participations.filter((p) => originalIds.includes(p.id));

			// 3. Create new participations with correct position
			for (let i = 0; i < newParticipations.length; i++) {
				const p = newParticipations[i];
				const position = participations.indexOf(p) + 1; // Position based on current order (1-based)

				const disciplineObj = competition.disciplines.find((d) => d.name === p.discipline);
				if (!disciplineObj) {
					throw new Error(`Disziplin "${p.discipline}" nicht gefunden`);
				}

				const participationData = {
					shooterId: Number(p.shooter.id),
					recorderId: Number(userId), // Recorder is the current user (organizer)
					disciplineId: disciplineObj.id,
					competitionId: competition.id,
					participationGroupId: group.id,
					team: p.team || null,
					shooterClass: p.shooterClass || '',
					positionNb: position,
					result: {},
					dqStatus: null
				};

				await createParticipationInGroup(group.id, participationData, auth);
			}

			// 4. Update modified participations (check for changes in team, discipline, or position)
			for (let i = 0; i < modifiedParticipations.length; i++) {
				const p = modifiedParticipations[i];
				const original = originalParticipations.find((op) => op.id === p.id);
				const currentPosition = participations.indexOf(p) + 1; // Position based on current order (1-based)
				const originalPosition = originalParticipations.indexOf(original) + 1;

				const disciplineObj = competition.disciplines.find((d) => d.name === p.discipline);
				if (!disciplineObj) {
					throw new Error(`Disziplin "${p.discipline}" nicht gefunden`);
				}

				// Update if team, discipline, position, or shooterClass changed
				if (original && (original.team !== p.team || original.discipline !== p.discipline || originalPosition !== currentPosition || original.shooterClass !== p.shooterClass)) {
					// Only send fields that the backend accepts (no nested objects like shooter, discipline, etc.)
					const participationData = {
						shooterId: Number(p.shooter?.id || p.shooterId),
						recorderId: Number(p.recorderId || userId),
						disciplineId: disciplineObj.id,
						competitionId: competition.id,
						participationGroupId: group.id,
						team: p.team || null,
						shooterClass: p.shooterClass || '',
						positionNb: currentPosition,
						result: p.result || {},
						dqStatus: p.dqStatus || null
					};

					await updateParticipation(p.id, participationData, auth);
				}
			}

			// 5. Delete removed participations
			for (const id of removedIds) {
				await deleteParticipation(id, auth);
			}

			// 6. Refresh competition data from backend to get updated participations
			await refreshCompetition(competition.id);

			// 7. Reload teams to include newly added ones
			try {
				const teamsData = await getCompetitionTeams(competition.id, auth);
				setTeams(teamsData || []);
			} catch (error) {
				console.error('Error reloading teams:', error);
			}

			// Show success toast
			toast.success('Gruppe erfolgreich aktualisiert', {
				duration: 3000
			});
		} catch (error) {
			console.error('Error saving group:', error);
			toast.error(`Fehler beim Speichern der Gruppe: ${error.message}`, {
				duration: 3000
			});
		}
	}

	return (
		<main className="max-w-3xl mx-auto mt-8 bg-white rounded-xl border p-8 shadow">
			<div className="mb-6 text-sm text-muted-foreground flex gap-2 items-center flex-wrap">
				<Link to={`/competitions/${competition.id}`} className="hover:underline text-black">
					{competition.name}
				</Link>
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
						<Input placeholder="Gruppenname" value={title} onChange={(e) => setTitle(e.target.value)} />
					</div>
					<div className="mb-4">
						<label className="block font-medium mb-1">Zeitraum</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" className="w-full justify-start text-left font-normal">
									<CalendarIcon className="mr-2 h-4 w-4" />
									{dateRange.from && dateRange.to ? `${format(dateRange.from, 'dd MMMM yyyy')} - ${format(dateRange.to, 'dd MMMM yyyy')}` : 'Zeitraum wählen'}
									<ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0">
								<Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
							</PopoverContent>
						</Popover>
					</div>
				</div>
			</div>
			<hr className="my-6" />
			<div className="mb-2 font-semibold text-lg">Teilnahmen</div>
			<div className="flex justify-end mb-4">
				<Button variant="outline" onClick={openAddPanel}>
					<Plus className="mr-2" />
					Neue Teilnahme hinzufügen
				</Button>
			</div>
			<ReactSortable tag="div" className="flex flex-col gap-2" list={participations} setList={setParticipations} animation={200} handle=".drag-handle">
				{participations.map((p, i) => {
					// Handle both formats: from backend (fullname, firstname, lastname) and from combobox (name)
					const shooterName = p.shooter?.name || p.shooter?.fullname || `${p.shooter?.firstname || ''} ${p.shooter?.lastname || ''}`.trim() || '-';
					const shooterEmail = p.shooter?.email || p.shooter?.userName || '';
					const disciplineName = p.discipline || '-';
					const shooterClass = p.shooterClass || '-';

					return (
						<Card key={p.id} className="flex items-center gap-4 px-4 py-3">
							<div className="w-6 text-center font-bold">{i + 1}</div>
							<div className="drag-handle cursor-move text-base w-6 text-center">≡</div>
							<Avatar>
								<AvatarFallback>{getInitials(shooterName)}</AvatarFallback>
							</Avatar>
							<div className="flex-1 flex flex-col">
								<div className="font-medium">{shooterName}</div>
								<div className="text-xs text-muted-foreground">{shooterEmail}</div>
								<div className="text-sm font-medium mt-1">
									{disciplineName} • {shooterClass}
								</div>
							</div>
							<div className="text-sm min-w-[80px] text-muted-foreground">{p.team || 'Kein Team'}</div>
							<Button size="icon" variant="ghost" onClick={() => openEditPanel(i)}>
								<Pencil />
							</Button>
							<Button size="sm" variant="destructive" onClick={() => setParticipations(participations.filter((_, idx) => idx !== i))}>
								<Trash2 />
							</Button>
						</Card>
					);
				})}
			</ReactSortable>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-xl w-full flex flex-col justify-between px-8 py-8 rounded-xl shadow-xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white z-50">
					<div className="flex-1 flex flex-col">
						<DialogHeader className="mb-4">
							<DialogTitle className="text-xl text-center md:text-left mb-4 text-green-900">{editIndex !== null ? 'Teilnahme bearbeiten' : 'Neue Teilnahme hinzufügen'}</DialogTitle>
						</DialogHeader>
						<form className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
							<div className="flex flex-col gap-2">
								<ShooterCombobox
									value={newParticipation.shooter}
									onChange={(shooter) => setNewParticipation({ ...newParticipation, shooter })}
									label="Teilnehmer"
									placeholder="Teilnehmer auswählen..."
									disabled={editIndex !== null}
								/>
								{editIndex !== null && <span className="text-xs text-muted-foreground">Der Teilnehmer kann nicht geändert werden</span>}
							</div>
							<div className="flex flex-col gap-2">
								<label className="block font-medium mb-1">
									Team <span className="text-xs text-muted-foreground">(optional)</span>
								</label>
								<Select value={newParticipation.team} onChange={(e) => setNewParticipation({ ...newParticipation, team: e.target.value, newTeam: '' })}>
									<option value="">Select</option>
									{teams.map((t, i) => (
										<option key={i} value={t}>
											{t}
										</option>
									))}
								</Select>
								<div className="flex items-center gap-2 mt-2">
									<Input
										placeholder="Neues Team (optional)"
										value={newParticipation.newTeam}
										onChange={(e) => setNewParticipation({ ...newParticipation, newTeam: e.target.value, team: '' })}
									/>
									<Button size="icon" variant="outline" type="button" onClick={handleAddNewTeam}>
										<Plus />
									</Button>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<label className="block font-medium mb-1">Disziplin</label>
								<Select value={newParticipation.discipline} onChange={(e) => setNewParticipation({ ...newParticipation, discipline: e.target.value })}>
									<option value="">Select</option>
									{disciplines.map((d, i) => (
										<option key={i} value={d}>
											{d}
										</option>
									))}
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<label className="block font-medium mb-1">Klasse</label>
								<Select value={newParticipation.shooterClass} onChange={(e) => setNewParticipation({ ...newParticipation, shooterClass: e.target.value })}>
									<option value="">Select</option>
									{competition?.availableClasses?.map((c, i) => (
										<option key={i} value={c}>
											{c}
										</option>
									))}
								</Select>
							</div>
						</form>
						<div className="flex gap-4 mt-8">
							<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
								Abbrechen
							</Button>
							<Button type="button" onClick={editIndex !== null ? handleSaveParticipation : handleAddParticipation}>
								{editIndex !== null ? 'Speichern' : 'Hinzufügen'}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
			<div className="flex justify-between mt-8">
				<Button variant="outline" asChild>
					<Link to={fromGroups ? `/competitions/${competition.id}?openGroups=true` : `/competitions/${competition.id}`}>Zurück</Link>
				</Button>
				<Button variant="default" onClick={handleSaveGroup}>
					Speichern
				</Button>
			</div>
		</main>
	);
};

export default EditParticipantGroup;

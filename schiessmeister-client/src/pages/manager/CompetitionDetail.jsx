import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { TreeView } from '@/components/tree-view';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Pencil, Folder, File, Plus, Users } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { canEditCompetitionMeta, canEditParticipations, canManageParticipantGroups } from '../../utils/permissions';
import { createParticipationGroup, createSubGroup } from '../../api/apiClient';

const KlassenList = ({ klassen, onRemove }) => (
	<div>
		<label className="block font-medium mb-1">Klassen</label>
		<ul>
			{klassen.map((k, i) => (
				<li key={i} className="flex items-center gap-2 mb-1">
					<span>{k}</span>
					{onRemove && (
						<Button type="button" size="icon" variant="ghost" onClick={() => onRemove(i)}>
							🗑️
						</Button>
					)}
				</li>
			))}
		</ul>
	</div>
);

const SchreiberList = ({ writers, onRemove }) => {
	const getWriterDisplayName = (writer) => {
		// Handle both string format (legacy) and object format (new).
		if ('string' === typeof writer) {
			return writer;
		}
		const fullname = writer.fullname || `${writer.firstname} ${writer.lastname}`;
		const username = writer.userName || writer.username;
		return username ? `${fullname} (${username})` : fullname;
	};

	return (
		<div>
			<label className="block font-medium mb-1">Schreiber</label>
			<ul>
				{writers.map((s, i) => (
					<li key={i} className="flex items-center gap-2 mb-1">
						<span>{getWriterDisplayName(s)}</span>
						{onRemove && (
							<Button type="button" size="icon" variant="ghost" onClick={() => onRemove(i)}>
								🗑️
							</Button>
						)}
					</li>
				))}
			</ul>
		</div>
	);
};

const DisziplinenList = ({ disciplines }) => {
	const formatDiscipline = (d) => {
		if ('string' === typeof d) {
			return d;
		}
		const name = d.name || 'Unbekannt';
		const seriesCount = d.seriesCount || 0;
		const shotsPerSeries = d.shotsPerSeries || 0;
		return `${name} (${seriesCount}x${shotsPerSeries})`;
	};

	return (
		<div>
			<label className="block font-medium mb-1">Disziplin</label>
			<ul>
				{disciplines.map((d, i) => (
					<li key={i} className="mb-1">
						<span>{formatDiscipline(d)}</span>
					</li>
				))}
			</ul>
		</div>
	);
};

const CompetitionDetail = () => {
	const { id } = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const { competitions, updateCompetition, isLoading } = useData();
	const { ownedOrganizations, userId, token, handleUnauthorized } = useAuth();
	const competition = competitions.find((c) => String(c.id) === String(id));
	const [groupsDialogOpen, setGroupsDialogOpen] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [newGroupName, setNewGroupName] = useState('');
	const [parentGroupId, setParentGroupId] = useState('');
	const [pointsInputDialogOpen, setPointsInputDialogOpen] = useState(false);
	const [selectedGroupForPoints, setSelectedGroupForPoints] = useState('');

	// Permission checks
	const canEditMeta = competition && canEditCompetitionMeta(competition, ownedOrganizations);
	const canEditPoints = competition && canEditParticipations(competition, ownedOrganizations, userId);
	const canManageGroups = competition && canManageParticipantGroups(competition, ownedOrganizations);

	// Auto-open groups dialog if URL parameter is set
	useEffect(() => {
		if (searchParams.get('openGroups') === 'true') {
			setGroupsDialogOpen(true);
			// Remove the parameter from URL
			searchParams.delete('openGroups');
			setSearchParams(searchParams, { replace: true });
		}
	}, [searchParams, setSearchParams]);

	// Neue Gruppe hinzufügen
	const handleAddGroup = async () => {
		if (!newGroupName.trim()) return;

		try {
			const newGroupData = {
				title: newGroupName,
				startDateTime: null,
				endDateTime: null,
				participations: [],
				subGroups: []
			};

			const auth = { token, handleUnauthorized };

			if (parentGroupId) {
				// Füge als Subgruppe hinzu
				await createSubGroup(parseInt(parentGroupId), newGroupData, auth);
			} else {
				// Top-Level-Gruppe
				await createParticipationGroup(competition.id, newGroupData, auth);
			}

			// Refresh competition data
			await updateCompetition(competition.id, competition);

			setNewGroupName('');
			setParentGroupId('');
			setDialogOpen(false);
		} catch (error) {
			console.error('Error adding group:', error);
			alert('Fehler beim Hinzufügen der Gruppe');
		}
	};

	// TreeView-Mapping
	function mapGroupsToTree(groups) {
		return (groups || []).map((g) => ({
			id: g.id,
			name: g.title,
			icon: g.subGroups && g.subGroups.length > 0 ? Folder : File,
			children: g.subGroups && g.subGroups.length > 0 ? mapGroupsToTree(g.subGroups) : undefined,
			actions: canManageGroups ? (
				<Link to={`/participant-groups/${g.id}/edit?from=groups`} className="ml-2 align-middle text-muted-foreground hover:text-black transition-colors">
					<Pencil className="w-4 h-4" />
				</Link>
			) : null
		}));
	}

	// Flat-Array für Select
	function flattenGroups(groups, prefix = '') {
		return (groups || []).reduce((acc, g) => {
			const label = prefix ? `${prefix} / ${g.title}` : g.title;
			acc.push({ id: g.id, label });
			if (g.subGroups && g.subGroups.length > 0) {
				acc = acc.concat(flattenGroups(g.subGroups, label));
			}
			return acc;
		}, []);
	}

	if (isLoading) {
		return (
			<main className="min-h-screen w-full px-4 py-10 bg-background">
				<div className="max-w-7xl mx-auto">
					<div className="flex items-center justify-between mb-8 border-b pb-2">
						<div className="flex flex-col w-full">
							<Skeleton className="h-10 w-96 mb-2" />
							<Skeleton className="h-10 w-32" />
						</div>
						<div className="flex flex-col items-end gap-2">
							<Skeleton className="h-10 w-48" />
							<Skeleton className="h-10 w-64" />
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
						<div className="flex flex-col gap-8 col-span-2">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<div>
									<Skeleton className="h-6 w-32 mb-2" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div>
									<Skeleton className="h-6 w-32 mb-2" />
									<Skeleton className="h-10 w-full" />
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<div>
									<Skeleton className="h-6 w-32 mb-2" />
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full mt-2" />
								</div>
								<div>
									<Skeleton className="h-6 w-32 mb-2" />
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full mt-2" />
								</div>
							</div>
						</div>
					</div>
					<div className="flex justify-between mt-16">
						<Skeleton className="h-10 w-24" />
					</div>
				</div>
			</main>
		);
	}

	if (!competition) return <div>Wettbewerb nicht gefunden</div>;

	return (
		<main className="min-h-screen w-full px-4 py-10 bg-background">
			<div className="max-w-7xl mx-auto">
				<div className="flex items-center justify-between mb-8 border-b pb-2">
					<div className="flex flex-col">
						<h2 className="text-3xl font-bold">{competition.title}</h2>
						{canEditMeta && (
							<Button asChild variant="outline" className="mt-2 w-fit">
								<Link to={`/competitions/${id}/edit`}>Bearbeiten</Link>
							</Button>
						)}
					</div>
					<div className="flex flex-col items-end gap-2">
						<Button asChild variant="outline" className="ml-4">
							<Link to={`/competitions/${id}/leaderboard`}>Leaderboard öffnen</Link>
						</Button>
						{canManageGroups && (
							<Button
								variant="outline"
								className="w-fit flex items-center gap-2 mt-2"
								onClick={() => {
									setGroupsDialogOpen(true);
								}}
							>
								<Users className="h-4 w-4" /> Teilnehmergruppen verwalten
							</Button>
						)}
						{canEditPoints && (
							<Button
								variant="default"
								className="w-fit flex items-center gap-2 mt-2"
								onClick={() => {
									setPointsInputDialogOpen(true);
								}}
							>
								<Pencil className="h-4 w-4" /> Punkte eingeben
							</Button>
						)}
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
								<input
									className="w-full border border-gray-300 rounded-md bg-white px-3 py-2 text-black"
									value={
										competition.startDateTime
											? (() => {
													// Extract date string directly to avoid timezone issues.
													const dateStr = competition.startDateTime.split('T')[0]; // "2024-12-10"
													const [year, month, day] = dateStr.split('-');
													const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
													return format(dateObj, 'dd. MMMM yyyy', { locale: de });
											  })()
											: ''
									}
									readOnly
								/>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div>
								<label className="block font-medium mb-1">Ort</label>
								<input className="w-full border border-gray-300 rounded-md bg-white px-3 py-2 text-black" value={competition.location || ''} readOnly />
							</div>
							<div>
								<label className="block font-medium mb-1">Ausschreibung</label>
								{competition.announcementUrl ? (
									<a
										href={competition.announcementUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="w-full border border-gray-300 rounded-md bg-white px-3 py-2 text-blue-600 underline block truncate hover:text-blue-800"
									>
										{competition.announcementUrl}
									</a>
								) : (
									<input className="w-full border border-gray-300 rounded-md bg-white px-3 py-2 text-gray-400" value="Keine Ausschreibung" readOnly />
								)}
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<KlassenList klassen={competition.availableClasses || []} />
							<SchreiberList writers={competition.recorders || []} />
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<DisziplinenList disciplines={competition.disciplines || []} />
						</div>
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
						<div className="w-full bg-white border rounded-lg p-2 shadow-sm min-h-[80px] [&_[role='tree']_*]:cursor-default [&_[role='tree']_a]:cursor-pointer">
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
								<Input placeholder="Gruppenname" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="mb-4" />
								<label className="block font-medium mb-1">Übergeordnete Gruppe</label>
								<select className="w-full border rounded px-3 py-2 mb-4" value={parentGroupId} onChange={(e) => setParentGroupId(e.target.value)}>
									<option value="">(Top-Level)</option>
									{flattenGroups(competition.groups || []).map((g) => (
										<option key={g.id} value={g.id}>
											{g.label}
										</option>
									))}
								</select>
								<DialogFooter>
									<Button onClick={handleAddGroup} disabled={!newGroupName.trim()} className="bg-black text-white hover:bg-black/80">
										Speichern
									</Button>
									<DialogClose asChild>
										<Button variant="secondary">Abbrechen</Button>
									</DialogClose>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</DialogContent>
				</Dialog>
				{/* Dialog for points input - select group */}
				<Dialog open={pointsInputDialogOpen} onOpenChange={setPointsInputDialogOpen}>
					<DialogContent className="max-w-lg w-full">
						<DialogHeader>
							<DialogTitle>Gruppe für Punkteeingabe auswählen</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-4">
							<label className="block font-medium">Teilnehmergruppe</label>
							<select
								className="w-full border rounded px-3 py-2"
								value={selectedGroupForPoints}
								onChange={(e) => setSelectedGroupForPoints(e.target.value)}
							>
								<option value="">-- Gruppe auswählen --</option>
								{flattenGroups(competition.groups || []).map((g) => (
									<option key={g.id} value={g.id}>
										{g.label}
									</option>
								))}
							</select>
						</div>
						<DialogFooter className="mt-4">
							<Button
								onClick={() => {
									if (selectedGroupForPoints) {
										navigate(`/competitions/${id}/participationGroups/${selectedGroupForPoints}`);
										setPointsInputDialogOpen(false);
										setSelectedGroupForPoints('');
									}
								}}
								disabled={!selectedGroupForPoints}
								className="bg-black text-white hover:bg-black/80"
							>
								Weiter
							</Button>
							<DialogClose asChild>
								<Button variant="secondary">Abbrechen</Button>
							</DialogClose>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				<div className="flex justify-between mt-16">
					<Button asChild variant="outline">
						<Link to="/competitions">Zurück</Link>
					</Button>
				</div>
			</div>
		</main>
	);
};

export default CompetitionDetail;

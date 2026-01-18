import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Button } from '@/components/ui/button';
import { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { updateParticipation } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { canEditParticipations } from '../../utils/permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const WriterParticipantGroupView = () => {
	const { competitionId, groupId } = useParams();
	const navigate = useNavigate();
	const { competitions, refreshCompetition, isLoading } = useData();
	const { ownedOrganizations, userId } = useAuth();
	const competition = competitions.find((c) => String(c.id) === String(competitionId));
	const groups = competition?.groups || [];
	const group = groups.find((g) => String(g.id) === String(groupId));

	// Permission check
	const canEdit = competition && canEditParticipations(competition, ownedOrganizations, userId);

	// Dialog-State für Ergebnisse eintragen
	const [resultDialogOpen, setResultDialogOpen] = useState(false);
	const [activeParticipation, setActiveParticipation] = useState(null);
	const [resultsInput, setResultsInput] = useState([]);
	const [dqStatusInput, setDqStatusInput] = useState(null);

	// Check if a participation is complete
	const isParticipationComplete = (participation) => {
		// If has DQ status, it's complete
		if (participation.dqStatus) return true;

		// Check if all points are filled according to discipline
		const disc = participation.discipline;
		if (!disc) return false;

		const expectedTotalShots = disc.seriesCount * disc.shotsPerSeries;
		let filledShots = 0;

		if (participation.result && Array.isArray(participation.result.series)) {
			filledShots = participation.result.series.reduce(
				(sum, serie) => sum + (Array.isArray(serie.points) ? serie.points.filter((v) => 'number' === typeof v && !isNaN(v) && 0 !== v).length : 0),
				0
			);
		}

		return filledShots === expectedTotalShots;
	};

	// Teilnehmer sortieren nach Rang (z.B. Punkte, wie im Manager-Leaderboard)
	const sortedParticipations = useMemo(() => {
		if (!group || !competition) return [];

		// Map group participations to full participation objects with all data
		const groupParticipations = Array.isArray(group.participations)
			? group.participations
					.map((p) => {
						// Get participation ID (could be object or just ID)
						const participationId = 'object' === typeof p ? p.id : p;
						// Find full participation from competition.participations (has shooter data)
						const fullParticipation = competition.participations.find((cp) => cp.id === participationId);
						if (!fullParticipation) return null;

						// Add discipline object from competition.disciplines
						const discipline = competition.disciplines.find((d) => d.id === fullParticipation.disciplineId);

						return {
							...fullParticipation,
							discipline: discipline || null
						};
					})
					.filter(Boolean)
			: [];

		// Sort by position number first, then by total points
		return groupParticipations.sort((a, b) => {
			// First sort by position
			const posA = a.positionNb || 0;
			const posB = b.positionNb || 0;
			if (posA !== posB) return posA - posB;

			// If same position, sort by points
			const sumA = a.result?.totalPoints || 0;
			const sumB = b.result?.totalPoints || 0;
			return sumB - sumA;
		});
	}, [group, competition]);

	// Split participations into unfinished and completed
	const { unfinishedParticipations, completedParticipations } = useMemo(() => {
		const unfinished = [];
		const completed = [];

		sortedParticipations.forEach((p) => {
			if (isParticipationComplete(p)) {
				completed.push(p);
			} else {
				unfinished.push(p);
			}
		});

		return { unfinishedParticipations: unfinished, completedParticipations: completed };
	}, [sortedParticipations]);

	// Disziplin-Infos für das Modal
	const getDisciplineInfo = (participation) => {
		if (!participation) return { seriesCount: 1, shotsPerSeries: 1 };
		// Disziplin ist jetzt direkt im participation-Objekt
		const disc = participation.discipline;
		return disc || { seriesCount: 1, shotsPerSeries: 1 };
	};

	// Öffne Dialog und initialisiere Felder
	const handleOpenResultDialog = (participation) => {
		setActiveParticipation(participation);
		// Vorbelegen mit existierenden Werten oder leeren Feldern (neues Modell: result.series)
		let initialResults = [];
		if (participation.result && Array.isArray(participation.result.series)) {
			initialResults = participation.result.series.map((s) => ({ ...s }));
		}
		setResultsInput(initialResults);
		setDqStatusInput(participation.dqStatus || null);
		setResultDialogOpen(true);
	};

	// Ergebnisse speichern
	const { token, handleUnauthorized } = useAuth();
	const handleSaveResults = async () => {
		if (!activeParticipation) return;
		try {
			// Participation im Backend aktualisieren
			await updateParticipation(
				activeParticipation.id,
				{ ...activeParticipation, result: { ...activeParticipation.result, series: resultsInput }, dqStatus: dqStatusInput },
				{ token, handleUnauthorized }
			);
			// Competition neu laden
			await refreshCompetition(competition.id);
			setResultDialogOpen(false);
			toast.success('Ergebnisse erfolgreich gespeichert');
		} catch (error) {
			toast.error('Fehler beim Speichern der Ergebnisse');
			console.error('Save error:', error);
		}
	};

	useEffect(() => {
		// Only redirect if competition is loaded but group is not found
		if (!isLoading && competition && (!group || !Array.isArray(group.participations))) {
			navigate(`/competitions/${competition.id}`);
		}
		// Redirect if user doesn't have permission to edit
		if (!isLoading && competition && !canEdit) {
			navigate(`/competitions/${competition.id}`);
		}
	}, [group, navigate, competition, canEdit, competitionId, isLoading]);

	// Loading state
	if (isLoading) {
		return (
			<main className="max-w-2xl mx-auto mt-8">
				<div className="mb-4">
					<Skeleton className="h-4 w-64 mb-2" />
				</div>
				<Skeleton className="h-8 w-48 mb-6" />
				<div className="space-y-2">
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
				</div>
				<div className="mt-8">
					<Skeleton className="h-10 w-24" />
				</div>
			</main>
		);
	}

	// Early returns after loading check
	if (!competition || !group) return <div>Keine Gruppe gefunden.</div>;
	if (!canEdit) return <div>Keine Berechtigung zum Bearbeiten.</div>;

	return (
		<main className="max-w-2xl mx-auto mt-8">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-2 text-sm mb-4 text-muted-foreground">
				<Link to={`/competitions/${competition.id}`} className="hover:underline text-primary font-medium">
					{competition.title}
				</Link>
				<span>/</span>
				<span className="font-semibold text-black">{group.title}</span>
			</nav>
			<h2 className="text-2xl font-bold mb-6">{group.title}</h2>

			{/* Unfinished Participations (no headline) */}
			{unfinishedParticipations.length > 0 && (
				<ul className="space-y-2 mb-8">
					{unfinishedParticipations.map((p, idx) => {
						const disc = p.discipline;
						// Handle both formats: from backend (fullname, firstname, lastname)
						const shooterName = p.shooter?.fullname || p.shooter?.name || `${p.shooter?.firstname || ''} ${p.shooter?.lastname || ''}`.trim() || '-';
						const shooterUsername = p.shooter?.userName || p.shooter?.username || p.shooter?.email || '';

						return (
							<li key={p.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
								<span className="font-mono w-8">{idx + 1}</span>
								<span className="font-medium">
									{shooterName} {shooterUsername && <span className="text-muted-foreground font-normal">({shooterUsername})</span>}
								</span>
								<span className="ml-auto text-sm">{disc?.name || ''}</span>
								<span className="ml-4 text-sm">{p.team || '-'}</span>
								{p.dqStatus && (
									<span
										className={`px-2 py-1 text-xs font-semibold rounded ${
											p.dqStatus === 'DQ' ? 'bg-red-100 text-red-800' : p.dqStatus === 'DNS' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
										}`}
									>
										{p.dqStatus}
									</span>
								)}
								<Button variant="outline" onClick={() => handleOpenResultDialog(p)}>
									Ergebnisse eintragen
								</Button>
							</li>
						);
					})}
				</ul>
			)}

			{/* Completed Participations with headline */}
			{completedParticipations.length > 0 && (
				<div className="mt-8">
					<h3 className="text-xl font-semibold mb-4">Abgeschlossene Teilnahmen</h3>
					<ul className="space-y-2">
						{completedParticipations.map((p, idx) => {
							const disc = p.discipline;
							// Handle both formats: from backend (fullname, firstname, lastname)
							const shooterName = p.shooter?.fullname || p.shooter?.name || `${p.shooter?.firstname || ''} ${p.shooter?.lastname || ''}`.trim() || '-';
							const shooterUsername = p.shooter?.userName || p.shooter?.username || p.shooter?.email || '';

							return (
								<li key={p.id} className="flex items-center gap-4 p-2 bg-green-50 rounded">
									<span className="font-mono w-8">{unfinishedParticipations.length + idx + 1}</span>
									<span className="font-medium">
										{shooterName} {shooterUsername && <span className="text-muted-foreground font-normal">({shooterUsername})</span>}
									</span>
									<span className="ml-auto text-sm">{disc?.name || ''}</span>
									<span className="ml-4 text-sm">{p.team || '-'}</span>
									{p.dqStatus && (
										<span
											className={`px-2 py-1 text-xs font-semibold rounded ${
												p.dqStatus === 'DQ' ? 'bg-red-100 text-red-800' : p.dqStatus === 'DNS' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
											}`}
										>
											{p.dqStatus}
										</span>
									)}
									<Button variant="outline" onClick={() => handleOpenResultDialog(p)}>
										Ergebnisse eintragen
									</Button>
								</li>
							);
						})}
					</ul>
				</div>
			)}

			{/* Empty state */}
			{0 === unfinishedParticipations.length && 0 === completedParticipations.length && <div className="text-muted-foreground">Keine Teilnehmer</div>}
			<div className="mt-8">
				<Button variant="secondary" onClick={() => navigate(`/competitions/${competition.id}`)}>
					Zurück
				</Button>
			</div>
			{/* Ergebnis-Dialog */}
			<Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
				<DialogContent className="max-w-lg w-full max-h-[90vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>Ergebnisse eintragen</DialogTitle>
					</DialogHeader>
					{activeParticipation && (
						<div className="flex flex-col gap-4 overflow-y-auto pr-2">
							<div>
								<div className="font-medium mb-2">
									{activeParticipation.shooter?.fullname ||
										activeParticipation.shooter?.name ||
										`${activeParticipation.shooter?.firstname || ''} ${activeParticipation.shooter?.lastname || ''}`.trim() ||
										'-'}{' '}
									({activeParticipation.discipline?.name || ''})
								</div>
								{/* Dynamische Felder je Serie/Schuss */}
								{(() => {
									const { seriesCount, shotsPerSeries } = getDisciplineInfo(activeParticipation);
									const fields = [];
									for (let s = 0; s < seriesCount; s++) {
										const serie = resultsInput[s] || { points: Array(shotsPerSeries).fill(0), malfunctions: 0, misses: 0, totalPoints: 0 };
										fields.push(
											<div key={s} className="mb-6">
												<div className="text-lg font-semibold mb-2">Serie {s + 1}</div>
												<div className="flex justify-center">
													<div className="grid grid-cols-5 gap-2">
														{serie.points.map((pt, i) => (
															<input
																key={i}
																type="text"
																inputMode="decimal"
																pattern="[0-9.]*"
																maxLength={4}
																className="text-4xl font-mono w-16 h-14 text-center border-2 border-green-700 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-400"
																value={pt === 0 ? '' : pt}
																onChange={(e) => {
																	let val = e.target.value.replace(/[^0-9.]/g, '');
																	// Only allow one decimal point
																	const parts = val.split('.');
																	if (parts.length > 2) {
																		val = parts[0] + '.' + parts.slice(1).join('');
																	}
																	// Limit to reasonable values (0-10.9)
																	const num = val === '' ? 0 : parseFloat(val);
																	if (num > 10.9) return;
																	const newResults = [...resultsInput];
																	if (!newResults[s]) newResults[s] = { points: Array(shotsPerSeries).fill(0), malfunctions: 0, misses: 0, totalPoints: 0 };
																	newResults[s].points[i] = val === '' ? 0 : num;
																	newResults[s].totalPoints = newResults[s].points.reduce((a, b) => a + b, 0);
																	setResultsInput(newResults);
																}}
															/>
														))}
													</div>
												</div>
											</div>
										);
									}
									return fields;
								})()}
								{/* DQ Status Section */}
								<div className="border-t pt-4 mt-6">
									<div className="text-lg font-semibold mb-3">Disqualifikation / Status</div>
									<div className="flex gap-2 flex-wrap justify-center">
										<Button
											type="button"
											variant={dqStatusInput === 'DQ' ? 'default' : 'outline'}
											className={dqStatusInput === 'DQ' ? 'bg-red-600 hover:bg-red-700' : ''}
											onClick={() => setDqStatusInput('DQ')}
										>
											DQ (Disqualified)
										</Button>
										<Button
											type="button"
											variant={dqStatusInput === 'DNS' ? 'default' : 'outline'}
											className={dqStatusInput === 'DNS' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
											onClick={() => setDqStatusInput('DNS')}
										>
											DNS (Did Not Start)
										</Button>
										<Button
											type="button"
											variant={dqStatusInput === 'DNF' ? 'default' : 'outline'}
											className={dqStatusInput === 'DNF' ? 'bg-orange-600 hover:bg-orange-700' : ''}
											onClick={() => setDqStatusInput('DNF')}
										>
											DNF (Did Not Finish)
										</Button>
										{dqStatusInput && (
											<Button type="button" variant="outline" onClick={() => setDqStatusInput(null)}>
												Status löschen
											</Button>
										)}
									</div>
									{dqStatusInput && <div className="text-center mt-2 text-sm text-muted-foreground">Aktuell: {dqStatusInput}</div>}
								</div>
								{/* Gesamtsumme aller Serien */}
								<div className="flex flex-col items-center mt-8">
									<div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17623b' }}>Gesamtsumme: {resultsInput.reduce((sum, serie) => sum + (serie?.totalPoints || 0), 0)}</div>
								</div>
							</div>
						</div>
					)}
					<DialogFooter className="mt-4 flex-shrink-0">
						<Button onClick={handleSaveResults} className="bg-black text-white hover:bg-black/80">
							Speichern
						</Button>
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

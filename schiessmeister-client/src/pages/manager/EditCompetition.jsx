import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useMemo } from 'react';
import CompetitionForm from '../../components/CompetitionForm';
import { Skeleton } from '@/components/ui/skeleton';
import { canEditCompetitionMeta } from '../../utils/permissions';
import { createDiscipline, updateDiscipline, deleteDiscipline } from '../../api/apiClient';

const EditCompetition = () => {
	const { id } = useParams();
	const { competitions, updateCompetition, isLoading } = useData();
	const { ownedOrganizations, token, handleUnauthorized } = useAuth();
	const navigate = useNavigate();

	const competition = competitions.find((c) => c.id === parseInt(id));

	// Permission check - only owners can edit competition metadata
	const canEdit = competition && canEditCompetitionMeta(competition, ownedOrganizations);

	// Transform backend data to form format (memoized to prevent unnecessary re-renders).
	const formData = useMemo(() => {
		if (!competition) return null;
		return {
			name: competition.title || '',
			location: competition.location || '',
			announcementUrl: competition.announcementUrl || '',
			date: competition.startDateTime || '',
			klassen: competition.availableClasses || [],
			recorders: competition.recorders || [],
			disciplines:
				competition.disciplines?.map((d) => ({
					id: d.id,
					name: d.name,
					seriesCount: d.seriesCount,
					seriesShots: d.shotsPerSeries
				})) || []
		};
	}, [competition]);

	// Redirect if no permission
	useEffect(() => {
		if (competition && !canEdit) {
			navigate(`/competitions/${competition.id}`);
		}
	}, [competition, canEdit, navigate]);

	if (isLoading) {
		return (
			<main className="min-h-screen w-full px-4 py-10 bg-background">
				<div className="max-w-4xl mx-auto">
					<Skeleton className="h-10 w-full mb-8" />
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div className="flex flex-col gap-6">
							<div>
								<Skeleton className="h-6 w-32 mb-2" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div>
								<Skeleton className="h-6 w-32 mb-2" />
								<Skeleton className="h-10 w-full" />
							</div>
							<div>
								<Skeleton className="h-6 w-32 mb-2" />
								<Skeleton className="h-20 w-full" />
							</div>
							<div>
								<Skeleton className="h-6 w-32 mb-2" />
								<Skeleton className="h-20 w-full" />
							</div>
						</div>
						<div className="flex flex-col gap-6">
							<div>
								<Skeleton className="h-6 w-32 mb-2" />
								<Skeleton className="h-20 w-full" />
							</div>
						</div>
					</div>
					<div className="flex justify-end gap-4 mt-8">
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-10 w-24" />
					</div>
				</div>
			</main>
		);
	}

	if (!competition) return <div>Wettbewerb nicht gefunden</div>;
	if (!canEdit) return <div>Keine Berechtigung zum Bearbeiten.</div>;

	const handleSubmit = async (data) => {
		try {
			// Handle discipline changes first.
			const oldDisciplines = competition.disciplines || [];
			const newDisciplines = data.disciplines || [];

			// Separate disciplines into: to delete, to create, to update.
			const newDisciplinesWithId = newDisciplines.filter((d) => d.id);
			const newDisciplinesWithoutId = newDisciplines.filter((d) => !d.id);

			// Find disciplines to delete (exist in old but not in new).
			const disciplinesToDelete = oldDisciplines.filter((oldD) => !newDisciplines.some((newD) => newD.id === oldD.id));

			// Find disciplines to update (exist in both, but changed).
			const disciplinesToUpdate = newDisciplinesWithId.filter((newD) => {
				const oldD = oldDisciplines.find((od) => od.id === newD.id);
				if (!oldD) return false;
				return oldD.name !== newD.name || oldD.seriesCount !== newD.seriesCount || oldD.shotsPerSeries !== newD.seriesShots;
			});

			// Delete removed disciplines.
			for (const discipline of disciplinesToDelete) {
				await deleteDiscipline(discipline.id, { token, handleUnauthorized });
			}

			// Update modified disciplines.
			for (const discipline of disciplinesToUpdate) {
				const disciplineData = {
					competitionId: competition.id,
					name: discipline.name,
					seriesCount: discipline.seriesCount,
					shotsPerSeries: discipline.seriesShots
				};
				await updateDiscipline(discipline.id, disciplineData, { token, handleUnauthorized });
			}

			// Create new disciplines.
			for (const discipline of newDisciplinesWithoutId) {
				const disciplineData = {
					name: discipline.name,
					seriesCount: discipline.seriesCount,
					shotsPerSeries: discipline.seriesShots
				};
				await createDiscipline(competition.id, disciplineData, { token, handleUnauthorized });
			}

			// Now update the competition metadata.
			const competitionData = {
				organizerId: competition.organizerId,
				title: data.name,
				location: data.location || '',
				startDateTime: data.date,
				endDateTime: data.date,
				availableClasses: data.klassen,
				announcementUrl: data.announcementUrl || null,
				recorderIds: data.recorderIds || []
			};
			await updateCompetition(competition.id, competitionData);
			navigate(`/competitions/${competition.id}`);
		} catch (err) {
			console.error('Failed to update competition:', err);
			// You could add error handling UI here if needed.
		}
	};

	return (
		<main>
			<CompetitionForm initialValues={formData} onSubmit={handleSubmit} submitLabel="Speichern" onCancel={() => navigate(`/competitions/${competition.id}`)} />
		</main>
	);
};

export default EditCompetition;

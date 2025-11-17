import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import CompetitionForm from '../../components/CompetitionForm';

const CreateCompetition = () => {
	const { addCompetition } = useData();
	const { ownedOrganizations } = useAuth();
	const navigate = useNavigate();
	const [selectedOrganization, setSelectedOrganization] = useState(null);

	// Only users who own at least one organization can create competitions
	const canCreate = ownedOrganizations && ownedOrganizations.length > 0;

	// Auto-select first organization if only one exists.
	useEffect(() => {
		if (1 === ownedOrganizations?.length) {
			setSelectedOrganization(ownedOrganizations[0]);
		}
	}, [ownedOrganizations]);

	// Redirect if no permission
	useEffect(() => {
		if (!canCreate) {
			navigate('/competitions');
		}
	}, [canCreate, navigate]);

	if (!canCreate) return <div>Sie müssen Besitzer einer Organisation sein, um Wettbewerbe zu erstellen.</div>;

	const handleSubmit = async (data) => {
		if (!selectedOrganization) {
			alert('Bitte wählen Sie eine Organisation aus.');
			return;
		}
		try {
			// Transform frontend data to backend format.
			const competitionData = {
				title: data.name,
				location: data.location || '',
				startDateTime: data.date,
				endDateTime: data.date,
				availableClasses: data.klassen,
				disciplines: data.disciplines.map((d) => ({
					name: d.name,
					seriesCount: d.seriesCount,
					shotsPerSeries: d.seriesShots
				})),
				announcementUrl: data.announcementUrl || null,
				recorderIds: data.recorderIds || []
			};
			await addCompetition(selectedOrganization.id, competitionData);
			navigate('/competitions');
		} catch (err) {
			console.error('Failed to create competition:', err);
			// You could add error handling UI here if needed.
		}
	};

	return (
		<main className="max-w-4xl mx-auto mt-8">
			{ownedOrganizations.length > 1 && (
				<div className="mb-6">
					<label className="block font-medium mb-2">Organisation auswählen</label>
					<select
						className="w-full border rounded p-2"
						value={selectedOrganization?.id || ''}
						onChange={(e) => {
							const org = ownedOrganizations.find((o) => o.id === parseInt(e.target.value));
							setSelectedOrganization(org);
						}}
					>
						<option value="">-- Bitte wählen --</option>
						{ownedOrganizations.map((org) => (
							<option key={org.id} value={org.id}>
								{org.name}
							</option>
						))}
					</select>
				</div>
			)}
			{selectedOrganization && <CompetitionForm initialValues={{}} onSubmit={handleSubmit} submitLabel="Erstellen" onCancel={() => navigate('/competitions')} />}
		</main>
	);
};

export default CreateCompetition;

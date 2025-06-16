import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompetition, deleteCompetition } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import '../styles/CompetitionOverview.css';
import { Button } from '@/components/ui/button';

const CompetitionOverview = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [competition, setCompetition] = useState(null);
	const [error, setError] = useState(null);
        const auth = useAuth();
        const basePath = auth.role === 'manager' ? '/manager' : '/writer';

	const parseResults = (participation) => {
		let results = JSON.parse(participation.results || '[]');
		if (!Array.isArray(results)) results = [];
		return results;
	};

	const filterParticipations = (participation, isCompleted) => {
		const results = parseResults(participation);
		return isCompleted ? results.length === 5 : results.length < 5;
	};

	useEffect(() => {
		const fetchCompetition = async () => {
			try {
				const data = await getCompetition(id, auth);
				setCompetition(data);
			} catch (err) {
				setError('Failed to load competition details');
				console.error(err);
			}
		};

		fetchCompetition();
	}, [id, auth]);

	const handleDeleteCompetition = async () => {
		if (window.confirm('Möchten Sie diesen Wettbewerb wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
			try {
				await deleteCompetition(id, auth);
				navigate('/');
			} catch (err) {
				setError('Fehler beim Löschen des Wettbewerbs');
				console.error(err);
			}
		}
	};

	if (error) return <div className="error">{error}</div>;
	if (!competition) return <div>Loading...</div>;

	const nextParticipants = competition.participations.filter((p) => filterParticipations(p, false));
	const completedParticipants = competition.participations.filter((p) => filterParticipations(p, true));

	const ParticipantList = ({ participants, title }) => (
		<div className="participants-list">
			<h3>{title}</h3>
			<div className="participants-grid">
				{participants.map((participation) => (
					<div key={participation.id} className="participant-item">
						<span className="participant-name">{participation.shooter.name}</span>
                                                <Button variant="outline" onClick={() => navigate(`${basePath}/results/${id}/${participation.id}`)}>
                                                        Ergebnisse
                                                </Button>
					</div>
				))}
				{participants.length === 0 && <p>Keine {title}.</p>}
			</div>
		</div>
	);

	return (
		<main>
			<h2>{competition.name}</h2>
			<div className="competition-details">
				<p>
					<strong>Datum:</strong> {new Date(competition.date).toLocaleString()}
				</p>
				<p>
					<strong>Ort:</strong> {competition.location}
				</p>
				<p>
					<strong>Teilnehmer:</strong> {competition.participations.length}
				</p>
			</div>
                        <Button variant="secondary" onClick={() => window.open(`/public-leaderboard/${id}`, '_blank')}>
                                Live Rangliste
                        </Button>
                        <ParticipantList participants={nextParticipants} title="Nächste Teilnehmer" />
                        <ParticipantList participants={completedParticipants} title="Abgeschlossene Teilnehmer" />
                        {auth.role === 'manager' && (
                                <Button onClick={() => navigate(`${basePath}/participantsList/${id}`)}>
                                        Teilnehmer verwalten
                                </Button>
                        )}
                        <div className="competition-actions">
                                <Button variant="secondary" onClick={() => navigate(`${basePath}/competitions`)}>
                                        Zurück
                                </Button>
                                {auth.role === 'manager' && (
                                        <Button variant="secondary" onClick={handleDeleteCompetition}>
                                                Wettbewerb löschen
                                        </Button>
                                )}
                        </div>
		</main>
	);
};

export default CompetitionOverview;

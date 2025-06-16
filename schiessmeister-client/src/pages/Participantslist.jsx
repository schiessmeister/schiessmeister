import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCompetition, getShooters, createShooter, updateCompetition } from '../api/apiClient';
import '../styles/Participantslist.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ParticipantsList = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const auth = useAuth();

	const [competition, setCompetition] = useState(null);
	const [availableShooters, setAvailableShooters] = useState([]);
	const [newShooterName, setNewShooterName] = useState('');
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [competitionData, shootersData] = await Promise.all([getCompetition(id, auth), getShooters(auth)]);
				setCompetition(competitionData);
				// Filter out shooters that are already in the competition
				const participatingShooterIds = competitionData.participations.map((p) => p.shooter.id);
				setAvailableShooters(shootersData.filter((shooter) => !participatingShooterIds.includes(shooter.id)));
			} catch (err) {
				setError('Failed to load data');
				console.error(err);
			}
		};

		fetchData();
	}, [id, auth]);

	const getMaxOrderNb = () => Math.max(...competition.participations.map((p) => parseInt(p.orderNb)), 0);

	const handleCreateShooter = async () => {
		if (!newShooterName.trim()) return;

		try {
			const newShooter = await createShooter(newShooterName, auth);
			setAvailableShooters([...availableShooters, newShooter]);
			setNewShooterName('');
		} catch (err) {
			setError('Failed to create shooter');
			console.error(err);
		}
	};

	const handleAddParticipant = async (shooterId) => {
		try {
			// Create new participation
			const newParticipation = {
				class: '',
				results: '[]',
				orderNb: getMaxOrderNb() + 1,
				shooterId: shooterId
			};

			// Update competition with new participation
			const updatedCompetition = {
				...competition,
				participations: [...competition.participations, newParticipation]
			};

			const response = await updateCompetition(id, updatedCompetition, auth);
			setCompetition(response);

			// Remove shooter from available list
			setAvailableShooters(availableShooters.filter((shooter) => shooter.id !== shooterId));
		} catch (err) {
			setError('Failed to add participant');
			console.error(err);
		}
	};

	const handleRemoveParticipant = async (participationId) => {
		try {
			// Update competition without the removed participation
			const updatedCompetition = {
				...competition,
				participations: competition.participations.filter((p) => p.id !== participationId)
			};

			const response = await updateCompetition(id, updatedCompetition, auth);
			setCompetition(response);

			// Add shooter back to available list
			const removedParticipation = competition.participations.find((p) => p.id === participationId);
			if (removedParticipation) {
				setAvailableShooters([...availableShooters, removedParticipation.shooter]);
			}
		} catch (err) {
			setError('Failed to remove participant');
			console.error(err);
		}
	};

	const handleMoveParticipant = async (participationId, direction) => {
		try {
			// Create a copy of participations to work with
			const updatedParticipations = [...competition.participations];

			// Find the current participation and its index
			const currentIndex = updatedParticipations.findIndex((p) => p.id === participationId);
			if (currentIndex === -1) return;

			// Calculate the new index based on direction
			const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

			// Check if the move is valid
			if (newIndex < 0 || newIndex >= updatedParticipations.length) return;

			// Swap the order numbers
			const tempOrderNb = updatedParticipations[currentIndex].orderNb;
			updatedParticipations[currentIndex].orderNb = updatedParticipations[newIndex].orderNb;
			updatedParticipations[newIndex].orderNb = tempOrderNb;

			// Update competition with new participations
			const updatedCompetition = {
				...competition,
				participations: updatedParticipations
			};

			await updateCompetition(id, updatedCompetition, auth);

			const newComp = await getCompetition(id, auth);
			setCompetition(newComp);
		} catch (err) {
			setError('Failed to move participant');
			console.error(err);
		}
	};

	if (error) return <div className="error">{error}</div>;
	if (!competition) return <div>Loading...</div>;

	return (
		<main className="container">
			<h2>Teilnehmerliste - {competition.name}</h2>

			<div className="participants">
				{competition.participations.map((participation) => (
					<div key={participation.id} className="participant">
						<span>{participation.shooter.name}</span>
						<div className="controls">
							<ul>
								<li>
                                                                        <Button variant="outline" onClick={() => handleMoveParticipant(participation.id, 'up')} disabled={participation.orderNb === 1}>
                                                                               Nach oben
                                                                        </Button>
								</li>
								<li>
                                                                        <Button variant="outline" onClick={() => handleMoveParticipant(participation.id, 'down')} disabled={participation.orderNb === getMaxOrderNb()}>
                                                                               Nach unten
                                                                        </Button>
								</li>
								<li>
                                                                        <Button variant="outline" onClick={() => handleRemoveParticipant(participation.id)}>
                                                                               Löschen
                                                                        </Button>
								</li>
							</ul>
						</div>
					</div>
				))}

				{competition.participations.length == 0 && <p>Keine Teilnehmer</p>}
			</div>

			<hr />

			<div className="participant-list">
				<h3>Schützen</h3>

                                {availableShooters.map((shooter) => (
                                        <Button key={shooter.id} className="participant-button" onClick={() => handleAddParticipant(shooter.id)}>
                                                {shooter.name}
                                        </Button>
                                ))}
			</div>

			<hr />

			<div className="actions">
				<h3>Neuer Schütze</h3>

                                <Input type="text" placeholder="Neuer Teilnehmer" value={newShooterName} onChange={(e) => setNewShooterName(e.target.value)} />

				<div className="buttons">
                                        <Button variant="outline" className="add-shooter-btn" onClick={handleCreateShooter}>
                                                + Teilnehmer erstellen
                                        </Button>
                                        <Button className="back-btn" onClick={() => navigate(`/manager/competitions/${id}`)}>
                                                Zurück
                                        </Button>
				</div>
			</div>
		</main>
	);
};

export default ParticipantsList;

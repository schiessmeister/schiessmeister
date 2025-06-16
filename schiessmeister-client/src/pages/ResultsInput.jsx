import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompetition, updateCompetition } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { SHOOTING_CLASSES } from '../constants/shootingClasses';
import '../styles/ResultsInput.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const ResultsInput = () => {
	const { competitionId, participationId } = useParams();
	const navigate = useNavigate();
	const [competition, setCompetition] = useState(null);
	const [participation, setParticipation] = useState(null);
	const [results, setResults] = useState([]);
	const [error, setError] = useState(null);
	const [shootingClass, setShootingClass] = useState('MEN');
	const auth = useAuth();
	const MAX_SERIES = 5;

	useEffect(() => {
		const fetchCompetition = async () => {
			try {
				const data = await getCompetition(competitionId, auth);
				setCompetition(data);
				const participation = data.participations.find((p) => p.id === parseInt(participationId));
				setParticipation(participation);
				if (participation.class) {
					setShootingClass(participation.class);
				}

				let tempResults = JSON.parse(participation.results || '[]');
				if (!Array.isArray(tempResults)) tempResults = [];
				setResults(tempResults);
			} catch (err) {
				setError('Failed to load competition details');
				console.error(err);
			}
		};

		fetchCompetition();
	}, [competitionId, participationId, auth]);

	const handleSetStatus = (index, status) => {
		const newResults = [...results];
		newResults[index] = status;
		setResults(newResults);
	};

	const handleNumberClick = (number) => {
		if (results.length < MAX_SERIES) {
			setResults([...results, number]);
		}
	};

	const handleRemoveLast = () => {
		setResults(results.slice(0, -1));
	};

	const handleSave = async () => {
		try {
			const updatedParticipation = {
				...participation,
				results: JSON.stringify(results),
				class: shootingClass
			};

			const updatedParticipations = competition.participations.map((p) => (p.id === parseInt(participationId) ? updatedParticipation : p));

			const updatedCompetition = {
				...competition,
				participations: updatedParticipations
			};
                        await updateCompetition(competitionId, updatedCompetition, auth);
                        navigate(`/writer/competitions/${competitionId}`);
		} catch (err) {
			setError('Failed to save results');
			console.error(err);
		}
	};

	if (error) return <div className="error">{error}</div>;
	if (!participation) return <div>Loading...</div>;

	return (
		<main className="results-input">
			<h2>Ergebnisse für {participation.shooter.name}</h2>

			<div className="results-display" style={{ flexDirection: 'column', gap: '12px' }}>
				{[...Array(MAX_SERIES)].map((_, index) => (
					<div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<span className="result-number">
							{results[index] === undefined ? '_' : results[index]}
						</span>
						<Button
							size="sm"
							variant={results[index] === 'DNF' ? 'destructive' : 'outline'}
							onClick={() => handleSetStatus(index, 'DNF')}
						>
							DNF
						</Button>
						<Button
							size="sm"
							variant={results[index] === 'DNQ' ? 'destructive' : 'outline'}
							onClick={() => handleSetStatus(index, 'DNQ')}
						>
							DNQ
						</Button>
						{typeof results[index] === 'string' && (results[index] === 'DNF' || results[index] === 'DNQ') && (
							<Button size="sm" variant="secondary" onClick={() => handleSetStatus(index, undefined)}>
								Zurücksetzen
							</Button>
						)}
					</div>
				))}
			</div>

			<div className="number-pad">
				<div className="number-grid">
					{[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
						<Button key={num} className="number-button" onClick={() => handleNumberClick(num)} disabled={results.filter(r => r !== undefined).length >= MAX_SERIES} variant="outline">
							{num}
						</Button>
					))}
					<Button className="number-button number-button--large" onClick={() => handleNumberClick(10)} disabled={results.filter(r => r !== undefined).length >= MAX_SERIES} variant="outline">
						10
					</Button>
				</div>
				<Button variant="destructive" onClick={handleRemoveLast} disabled={results.filter(r => r !== undefined).length === 0}>
					Letzte Zahl löschen
				</Button>
				<div className="shooting-class-select">
					<Label htmlFor="shootingClass">Schützenklasse:</Label>
					<Select id="shootingClass" value={shootingClass} onChange={(e) => setShootingClass(e.target.value)}>
						{SHOOTING_CLASSES.map(({ key, value }) => (
							<option key={key} value={key}>
								{value}
							</option>
						))}
					</Select>
				</div>
			</div>

			<div className="action-buttons">
				<Button variant="secondary" className="reset-btn" onClick={() => navigate(`/writer/competitions/${competitionId}`)}>
					Abbrechen
				</Button>
				<Button onClick={handleSave}>
					Speichern
				</Button>
			</div>
		</main>
	);
};

export default ResultsInput;

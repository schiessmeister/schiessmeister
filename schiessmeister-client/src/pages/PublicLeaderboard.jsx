import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getCompetition } from '../api/apiClient';
import * as signalR from '@microsoft/signalr';
import JSConfetti from 'js-confetti';
import '../styles/PublicLeaderboard.css';
import { API_BASE_URL, BASE_URL } from '../utils/api';

const PublicLeaderboard = () => {
	const { id } = useParams();
	const [competition, setCompetition] = useState(null);
	const [error, setError] = useState(null);
	const connectionRef = useRef(null);
	const jsConfetti = useRef(null);

	useEffect(() => {
		jsConfetti.current = new JSConfetti();
	}, []);

	const triggerConfetti = () => {
		if (jsConfetti.current) {
			jsConfetti.current.addConfetti({
				confettiNumber: 200,
				confettiRadius: 6,
				confettiColors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1']
			});
		}
	};

	useEffect(() => {
		const setupSignalR = async () => {
			try {
				// First, get the subscription details
				const response = await fetch(API_BASE_URL + `/competition/${id}/subscribe`);
				const subscriptionDetails = await response.json();

				// Create SignalR connection
				connectionRef.current = new signalR.HubConnectionBuilder()
					.withUrl(BASE_URL + subscriptionDetails.hubUrl)
					.withAutomaticReconnect()
					.build();

				// Set up event handler for competition updates
				connectionRef.current.on(subscriptionDetails.eventName, (updatedCompetition) => {
					setCompetition(updatedCompetition);
					triggerConfetti();
				});

				// Start the connection
				await connectionRef.current.start();
				console.log('SignalR Connected!');

				// Only subscribe if we're in the Connected state
				if (connectionRef.current.state === signalR.HubConnectionState.Connected) {
					await connectionRef.current.invoke(subscriptionDetails.methodName, parseInt(id));
					console.log('Successfully subscribed to competition updates');
				} else {
					console.warn('Connection not in Connected state, skipping subscription');
				}
			} catch (err) {
				console.error('SignalR setup error:', err);
				setError('Failed to establish live connection');
			}
		};

		setupSignalR();

		// Cleanup function
		return () => {
			if (connectionRef.current) {
				connectionRef.current.stop();
			}
		};
	}, [id]);

	useEffect(() => {
		const fetchCompetition = async () => {
			try {
				const data = await getCompetition(id);
				setCompetition(data);
				triggerConfetti();
			} catch (err) {
				setError('Failed to load competition details');
				console.error(err);
			}
		};

		fetchCompetition();
	}, [id]);

	if (error) return <div className="error">{error}</div>;
	if (!competition) return <div>Loading...</div>;

	// Calculate total points for each participation
	const participationsWithTotals = competition.participations.map((participation) => {
		let results = JSON.parse(participation.results || '[]');
		if (!Array.isArray(results)) results = [];

		return {
			...participation,
			totalPoints: results.reduce((sum, result) => sum + (result || 0), 0)
		};
	});

	// Sort participations by total points
	const sortedParticipations = [...participationsWithTotals].sort((a, b) => b.totalPoints - a.totalPoints);

	return (
		<main className="public-leaderboard">
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

			<h3>Live Rangliste</h3>
			<div className="leaderboard">
				<div className="leaderboard-grid">
					{sortedParticipations.map((participation, index) => (
						<div key={participation.id} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
							<div className="rank">
								{index === 0 && '🥇'}
								{index === 1 && '🥈'}
								{index === 2 && '🥉'}
								{index >= 3 && `#${index + 1}`}
							</div>
							<div className="shooter-name">{participation.shooter.name}</div>
							<div className="total-points">{participation.totalPoints}</div>
						</div>
					))}
				</div>
			</div>
		</main>
	);
};

export default PublicLeaderboard;

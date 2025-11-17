import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCompetitionLeaderboards, getLeaderboardSubscriptionInfo } from '../../api/apiClient';
import { BASE_URL } from '../../api/api';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';

const getInitials = (name) =>
	name
		?.split(' ')
		.map((n) => n[0])
		.join('') || '?';

const CompetitionLeaderboard = () => {
	const { id } = useParams();
	const auth = useAuth();
	const [groups, setGroups] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		setLoading(true);
		// Pass auth only if token exists (for public access support)
		const authParam = auth?.token ? auth : null;
		getCompetitionLeaderboards(id, authParam)
			.then((data) => {
				setGroups(data);
				setLoading(false);
			})
			.catch(() => {
				setError('Fehler beim Laden der Rangliste');
				setLoading(false);
			});
	}, [id, auth]);

	// SignalR connection for real-time updates
	useEffect(() => {
		let connection = null;

		const setupSignalR = async () => {
			try {
				// Get subscription info from backend
				const subscriptionInfo = await getLeaderboardSubscriptionInfo(id);

				// Construct full URL using BASE_URL from api.js
				const hubUrl = `${BASE_URL}${subscriptionInfo.hubUrl}`;

				connection = new signalR.HubConnectionBuilder().withUrl(hubUrl).withAutomaticReconnect().build();

				// Listen for leaderboard updates
				connection.on(subscriptionInfo.eventName, (updatedLeaderboards) => {
					console.log('Leaderboard updated:', updatedLeaderboards);
					setGroups(updatedLeaderboards);
				});

				await connection.start();
				console.log('SignalR Connected');

				// Subscribe to competition updates
				await connection.invoke(subscriptionInfo.methodName, subscriptionInfo.competitionId);
			} catch (err) {
				console.error('SignalR Connection Error:', err);
			}
		};

		setupSignalR();

		// Cleanup on unmount
		return () => {
			if (connection) {
				connection.invoke('UnsubscribeFromCompetition', parseInt(id)).catch(console.error);
				connection.stop();
			}
		};
	}, [id]);

	if (loading) {
		return (
			<main className="min-h-screen w-full px-4 py-10 bg-background">
				<Skeleton className="h-10 w-48 mb-8" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12">
					{[1, 2].map((groupIndex) => (
						<div key={groupIndex} className="mb-8">
							<Skeleton className="h-6 w-32 mb-2" />
							<div className="flex flex-col gap-2">
								{[1, 2, 3].map((entryIndex) => (
									<Card key={entryIndex} className="flex items-center gap-4 px-4 py-3">
										<Skeleton className="h-6 w-6 rounded-full" />
										<Skeleton className="h-10 w-10 rounded-full" />
										<div className="flex-1">
											<Skeleton className="h-4 w-32" />
										</div>
										<Skeleton className="h-6 w-16" />
									</Card>
								))}
							</div>
						</div>
					))}
				</div>
			</main>
		);
	}

	if (error) return <div>{error}</div>;

	return (
		<main className="min-h-screen w-full px-4 py-10 bg-background">
			<h2 className="text-3xl font-bold mb-8">Rangliste</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-12">
				{groups.map((group) => (
					<div key={group.name} className="mb-8">
						<div className="font-semibold text-lg mb-2 border-b pb-1">{group.name}</div>
						<div className="flex flex-col gap-2">
							{group.entries && group.entries.length > 0 ? (
								group.entries.slice(0, 3).map((entry, i) => (
									<Card key={entry.name} className="flex items-center gap-4 px-4 py-3">
										<div className="text-xl w-6 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
										<Avatar>
											<AvatarFallback>{getInitials(entry.name)}</AvatarFallback>
										</Avatar>
										<div className="flex-1">
											<div className="font-medium">{entry.name}</div>
										</div>
										{entry.dqStatus && (
											<span
												className={`px-2 py-1 text-xs font-semibold rounded ${
													'DQ' === entry.dqStatus ? 'bg-red-100 text-red-800' : 'DNS' === entry.dqStatus ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
												}`}
											>
												{entry.dqStatus}
											</span>
										)}
										<div className="text-lg font-bold min-w-[60px] text-right">{entry.totalScore}</div>
									</Card>
								))
							) : (
								<div className="text-muted-foreground text-sm">Keine Ergebnisse</div>
							)}
						</div>
					</div>
				))}
			</div>
			<div className="flex justify-center mt-8">
				{auth?.token ? (
					<Button asChild variant="outline" className="w-auto px-8">
						<Link to={`/competitions/${id}`}>Zurück</Link>
					</Button>
				) : (
					<Button asChild className="w-auto px-8 bg-primary hover:bg-primary/90">
						<Link to="/login" className="!text-white">
							Login
						</Link>
					</Button>
				)}
			</div>
		</main>
	);
};

export default CompetitionLeaderboard;

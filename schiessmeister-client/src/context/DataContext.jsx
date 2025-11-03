import { createContext, useContext, useState, useEffect } from 'react';
import { getCompetitionsByOrganization, getCompetition, getRecordedCompetitions } from '../api/apiClient';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
	const [competitions, setCompetitions] = useState([]);
	const [competitionsByOrganization, setCompetitionsByOrganization] = useState({});
	const { token, userId, ownedOrganizations, handleUnauthorized } = useAuth();

	useEffect(() => {
		const fetchAllCompetitions = async () => {
			if (!token || !userId) {
				setCompetitions([]);
				setCompetitionsByOrganization({});
				return;
			}

			try {
				const allCompetitions = [];
				const compsByOrg = {};

				// 1. Wettbewerbe für alle eigenen Organisationen laden
				for (const org of ownedOrganizations) {
					try {
						const orgCompetitionsList = await getCompetitionsByOrganization(org.id, { token, handleUnauthorized });
						const detailedOrgCompetitions = await Promise.all(
							orgCompetitionsList.map(async (c) => {
								try {
									const detailed = await getCompetition(c.id, { token, handleUnauthorized });
									// Mark as owner and check if also recorder
									const isRecorder = Array.isArray(detailed.recorders) && detailed.recorders.some((r) => String(r.id) === String(userId));
									return { ...detailed, organizationId: org.id, organizationName: org.name, isOwner: true, isRecorder };
								} catch {
									return null;
								}
							})
						);
						const validComps = detailedOrgCompetitions.filter(Boolean);
						compsByOrg[org.id] = {
							organization: org,
							competitions: validComps
						};
						allCompetitions.push(...validComps);
					} catch (err) {
						console.error(`Error fetching competitions for organization ${org.name}:`, err);
					}
				}

				// 2. Wettbewerbe laden, bei denen der Benutzer als Recorder eingetragen ist
				try {
					const recordedCompetitionsList = await getRecordedCompetitions(userId, { token, handleUnauthorized });
					const detailedRecordedCompetitions = await Promise.all(
						recordedCompetitionsList.map(async (c) => {
							// Nur Wettbewerbe hinzufügen, die nicht bereits als Besitzer geladen wurden
							if (allCompetitions.some((comp) => comp.id === c.id)) {
								return null;
							}
							try {
								const detailed = await getCompetition(c.id, { token, handleUnauthorized });
								// Mark as recorder
								return { ...detailed, isOwner: false, isRecorder: true };
							} catch {
								return null;
							}
						})
					);
					const validRecordedComps = detailedRecordedCompetitions.filter(Boolean);

					// Gruppiere Recorder-Wettbewerbe nach Organisation
					for (const comp of validRecordedComps) {
						const orgId = comp.organizationId;
						if (orgId) {
							if (!compsByOrg[orgId]) {
								compsByOrg[orgId] = {
									organization: { id: orgId, name: comp.organizationName || 'Unbekannte Organisation' },
									competitions: []
								};
							}
							compsByOrg[orgId].competitions.push(comp);
						}
					}

					allCompetitions.push(...validRecordedComps);
				} catch (err) {
					console.error('Error fetching recorded competitions:', err);
				}

				setCompetitions(allCompetitions);
				setCompetitionsByOrganization(compsByOrg);
			} catch (err) {
				console.error('Error fetching competitions:', err);
				setCompetitions([]);
				setCompetitionsByOrganization({});
			}
		};

		fetchAllCompetitions();
	}, [token, userId, ownedOrganizations, handleUnauthorized]);

	// Competition im State aktualisieren
	const updateCompetition = (competitionId, updatedCompetition) => {
		setCompetitions((prev) => prev.map((c) => (c.id === competitionId ? { ...c, ...updatedCompetition } : c)));
		// Hier könnte ggf. noch ein API-Call erfolgen, falls Backend-Sync nötig ist
	};

	// Rekursive Zählfunktion für Teilnehmer in allen Gruppen
	function countParticipantsRecursive(competition) {
		function countInGroups(groups) {
			if (!groups) return 0;
			return groups.reduce((sum, g) => {
				const groupCount = Array.isArray(g.participations) ? g.participations.length : 0;
				const subCount = g.subParticipationGroups ? countInGroups(g.subParticipationGroups) : 0;
				return sum + groupCount + subCount;
			}, 0);
		}
		const groupCount = countInGroups(competition.participantGroups);
		const directCount = Array.isArray(competition.participations) ? competition.participations.length : 0;
		return groupCount > 0 ? groupCount : directCount;
	}

	return <DataContext.Provider value={{ competitions, competitionsByOrganization, countParticipantsRecursive, updateCompetition }}>{children}</DataContext.Provider>;
};

export const useData = () => {
	const ctx = useContext(DataContext);
	if (!ctx) throw new Error('useData must be used within DataProvider');
	return ctx;
};

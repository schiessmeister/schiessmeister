import { createContext, useContext, useState, useEffect } from 'react';
import { getCompetitionsByOrganization, getCompetition, getRecordedCompetitions, createCompetition, updateCompetition as updateCompetitionApi } from '../api/apiClient';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
	const [competitions, setCompetitions] = useState([]);
	const [competitionsByOrganization, setCompetitionsByOrganization] = useState({});
	const [isLoading, setIsLoading] = useState(true);
	const { token, userId, ownedOrganizations, handleUnauthorized } = useAuth();

	useEffect(() => {
		const fetchAllCompetitions = async () => {
			if (!token || !userId) {
				setCompetitions([]);
				setCompetitionsByOrganization({});
				setIsLoading(false);
				return;
			}

			setIsLoading(true);
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
								// Mark as recorder and use organization data from the recorded competitions list
								// (which already includes organizer data from the backend)
								return {
									...detailed,
									organizationId: c.organizerId,
									organizationName: c.organizer?.name,
									isOwner: false,
									isRecorder: true
								};
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
			} finally {
				setIsLoading(false);
			}
		};

		fetchAllCompetitions();
	}, [token, userId, ownedOrganizations, handleUnauthorized]);

	// Update competition in backend and local state.
	const updateCompetition = async (competitionId, updatedCompetition) => {
		try {
			await updateCompetitionApi(competitionId, updatedCompetition, { token, handleUnauthorized });
			// Fetch the updated competition from backend to ensure consistency.
			const updatedFromBackend = await getCompetition(competitionId, { token, handleUnauthorized });

			// Update in competitions list.
			setCompetitions((prev) => prev.map((c) => (c.id === competitionId ? { ...c, ...updatedFromBackend } : c)));

			// Update in competitionsByOrganization.
			setCompetitionsByOrganization((prev) => {
				const newState = { ...prev };
				Object.keys(newState).forEach((orgId) => {
					newState[orgId] = {
						...newState[orgId],
						competitions: newState[orgId].competitions.map((c) => (c.id === competitionId ? { ...c, ...updatedFromBackend } : c))
					};
				});
				return newState;
			});
		} catch (err) {
			console.error('Error updating competition:', err);
			throw err;
		}
	};

	// Rekursive Zählfunktion für Teilnehmer in allen Gruppen
	function countParticipantsRecursive(competition) {
		function countInGroups(groups) {
			if (!groups) return 0;
			return groups.reduce((sum, g) => {
				const groupCount = Array.isArray(g.participations) ? g.participations.length : 0;
				const subCount = g.subGroups ? countInGroups(g.subGroups) : 0;
				return sum + groupCount + subCount;
			}, 0);
		}
		const groupCount = countInGroups(competition.groups);
		const directCount = Array.isArray(competition.participations) ? competition.participations.length : 0;
		return groupCount > 0 ? groupCount : directCount;
	}

	// Add a new competition.
	const addCompetition = async (organizationId, competitionData) => {
		try {
			const newCompetition = await createCompetition(organizationId, competitionData, { token, handleUnauthorized });
			// Fetch the full competition details.
			const detailedCompetition = await getCompetition(newCompetition.id, { token, handleUnauthorized });
			// Add to the competitions list.
			setCompetitions((prev) => [...prev, { ...detailedCompetition, isOwner: true, isRecorder: false }]);
			// Add to competitionsByOrganization.
			if (detailedCompetition.organizationId) {
				setCompetitionsByOrganization((prev) => {
					const orgId = detailedCompetition.organizationId;
					const updatedOrg = prev[orgId] || { organization: { id: orgId, name: detailedCompetition.organizationName || 'Unbekannte Organisation' }, competitions: [] };
					return {
						...prev,
						[orgId]: {
							...updatedOrg,
							competitions: [...updatedOrg.competitions, { ...detailedCompetition, isOwner: true, isRecorder: false }]
						}
					};
				});
			}
			return detailedCompetition;
		} catch (err) {
			console.error('Error creating competition:', err);
			throw err;
		}
	};

	// Refresh competition from backend without updating
	const refreshCompetition = async (competitionId) => {
		try {
			// Fetch the updated competition from backend
			const updatedFromBackend = await getCompetition(competitionId, { token, handleUnauthorized });

			// Update in competitions list
			setCompetitions((prev) => prev.map((c) => (c.id === competitionId ? { ...c, ...updatedFromBackend } : c)));

			// Update in competitionsByOrganization
			setCompetitionsByOrganization((prev) => {
				const newState = { ...prev };
				Object.keys(newState).forEach((orgId) => {
					newState[orgId] = {
						...newState[orgId],
						competitions: newState[orgId].competitions.map((c) => (c.id === competitionId ? { ...c, ...updatedFromBackend } : c))
					};
				});
				return newState;
			});
		} catch (err) {
			console.error('Error refreshing competition:', err);
			throw err;
		}
	};

	return <DataContext.Provider value={{ competitions, competitionsByOrganization, isLoading, countParticipantsRecursive, updateCompetition, addCompetition, refreshCompetition }}>{children}</DataContext.Provider>;
};

export const useData = () => {
	const ctx = useContext(DataContext);
	if (!ctx) throw new Error('useData must be used within DataProvider');
	return ctx;
};

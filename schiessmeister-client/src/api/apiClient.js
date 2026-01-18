import { createApi } from './api';

export const getRecordedCompetitions = async (userId, auth) => {
	if (!userId) throw new Error('User not authenticated');

	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.get(`/users/${userId}/recorded-competitions`);
};

export const getCompetition = async (id, auth = null) => {
	if (auth) {
		const api = createApi(auth.token, auth.handleUnauthorized);
		return api.get(`/competitions/${id}`);
	}
};

export const createCompetition = async (organizationId, competitionData, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.post(`/organizations/${organizationId}/competitions`, competitionData);
};

export const updateCompetition = async (id, competitionData, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);

	// Only transform participations if they exist.
	const dataToSend = {
		...competitionData,
		...(competitionData.participations && {
			participations: competitionData.participations.map((p) => ({
				class: p.class,
				results: p.results,
				orderNb: p.orderNb,
				shooterId: p.shooterId
			}))
		})
	};

	return api.put(`/competitions/${id}`, dataToSend);
};

export const getShooters = async (auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.get('/shooter');
};

export const createShooter = async (name, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.post('/shooter', { name });
};

export const deleteUser = async (userId, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.delete(`/users/${userId}`);
};

export const deleteCompetition = async (id, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.delete(`/competitions/${id}`);
};

export const getOwnedOrganizations = async (userId, token) => {
	const api = createApi(token);
	return api.get(`/users/${userId}/owned-organizations`);
};

export const getCompetitionsByOrganization = async (organizationId, auth) => {
	const api = createApi(auth?.token, auth?.handleUnauthorized);
	return api.get(`/organizations/${organizationId}/competitions`);
};

export const updateParticipation = async (id, participationData, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.put(`/participations/${id}`, participationData);
};

export const getCompetitionLeaderboards = async (id, auth = null) => {
	const api = auth ? createApi(auth.token, auth.handleUnauthorized) : createApi();
	return api.get(`/competitions/${id}/leaderboards`);
};

export const getLeaderboardSubscriptionInfo = async (id) => {
	const api = createApi();
	return api.get(`/competitions/${id}/leaderboards/subscribe`);
};

export const getCompetitionTeams = async (id, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.get(`/competitions/${id}/teams`);
};

export const getUsers = async (searchTerm = null, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	const params = searchTerm ? `?searchTerm=${encodeURIComponent(searchTerm)}` : '';
	return api.get(`/users${params}`);
};

export const createDiscipline = async (competitionId, disciplineData, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.post(`/competitions/${competitionId}/disciplines`, disciplineData);
};

export const updateDiscipline = async (id, disciplineData, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.put(`/disciplines/${id}`, disciplineData);
};

export const deleteDiscipline = async (id, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.delete(`/disciplines/${id}`);
};

export const createParticipationGroup = async (competitionId, groupData, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.post(`/competitions/${competitionId}/participation-groups`, groupData);
};

export const createSubGroup = async (parentGroupId, groupData, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.post(`/participation-groups/${parentGroupId}/sub-groups`, groupData);
};

export const updateParticipationGroup = async (id, groupData, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.put(`/participation-groups/${id}`, groupData);
};

export const deleteParticipationGroup = async (id, preserveSubGroups, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.delete(`/participation-groups/${id}?preserveSubGroups=${preserveSubGroups}`);
};

export const createParticipationInGroup = async (groupId, participationData, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.post(`/participation-groups/${groupId}/participations`, participationData);
};

export const deleteParticipation = async (id, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.delete(`/participations/${id}`);
};

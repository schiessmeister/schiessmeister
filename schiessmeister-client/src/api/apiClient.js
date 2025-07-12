import { createApi } from '../utils/api';

export const getCompetitions = async (auth) => {
	if (!auth.userId) throw new Error('User not authenticated');

	const api = createApi(auth.token, auth.handleUnauthorized);
	return api.get(`/users/${auth.userId}/competitions`);
};

export const getCompetition = async (id, auth = null) => {
	if (auth) {
		const api = createApi(auth.token, auth.handleUnauthorized);
		return api.get(`/competitions/${id}`);
	}
};

export const updateCompetition = async (id, competitionData, auth) => {
	const api = createApi(auth.token, auth.handleUnauthorized);

	competitionData = {
		...competitionData,
		participations: competitionData.participations.map((p) => ({
			class: p.class,
			results: p.results,
			orderNb: p.orderNb,
			shooterId: p.shooterId
		}))
	};

	return api.put(`/competition/${id}`, competitionData);
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
	return api.delete(`/competition/${id}`);
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

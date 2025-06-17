import { createApi } from '../utils/api';

export const getOwnedOrganizations = async (auth) => {
  if (!auth.userId) throw new Error('User not authenticated');
  const api = createApi(auth.token, auth.handleUnauthorized);
  return api.get(`/users/${auth.userId}/owned-organizations`);
};

export const getCompetitions = async (auth) => {
  const api = createApi(auth.token, auth.handleUnauthorized);
  const orgs = await getOwnedOrganizations(auth);
  let comps = [];
  for (const org of orgs) {
    const c = await api.get(`/organizations/${org.id}/competitions`);
    comps = comps.concat(c);
  }
  return comps;
};

export const createCompetition = async (organizationId, competitionData, auth) => {
  const api = createApi(auth.token, auth.handleUnauthorized);
  return api.post(`/organizations/${organizationId}/competitions`, competitionData);
};

export const getCompetition = async (id, auth = null) => {
  if (auth) {
    const api = createApi(auth.token, auth.handleUnauthorized);
    return api.get(`/competitions/${id}`);
  }
  const api = createApi();
  return api.get(`/competitions/${id}`);
};

export const updateCompetition = async (id, competitionData, auth) => {
  const api = createApi(auth.token, auth.handleUnauthorized);
  competitionData = {
    ...competitionData,
    participations: competitionData.participations.map((p) => ({
      class: p.class,
      results: p.results,
      orderNb: p.orderNb,
      shooterId: p.shooterId,
    })),
  };
  return api.put(`/competitions/${id}`, competitionData);
};

export const deleteCompetition = async (id, auth) => {
  const api = createApi(auth.token, auth.handleUnauthorized);
  return api.delete(`/competitions/${id}`);
};

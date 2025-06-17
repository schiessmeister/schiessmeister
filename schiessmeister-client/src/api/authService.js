import { createApi } from '../utils/api';

export const loginRequest = async (username, password) => {
  const api = createApi();
  return api.post('/authenticate/login', { username, password });
};

export const registerRequest = async (username, firstname, lastname, email, password, gender) => {
  const api = createApi();
  return api.post('/authenticate/register', { username, firstname, lastname, email, password, gender });
};

export const getSubscriptionDetails = async (competitionId) => {
  const api = createApi();
  return api.get(`/competitions/${competitionId}/subscribe`);
};

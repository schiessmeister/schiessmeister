import { createApi } from './api';
import { getOwnedOrganizations as getOwnedOrganizationsApi } from './apiClient';

export const loginRequest = async (email, password, role) => {
    // Echte Login-Implementierung
    const api = createApi();
    // Username = Email laut Backend-DTO
    const response = await api.post('/authenticate/login', {
        Username: email,
        Password: password
    });
    // response: { token, id, expiration, roles }
    return {
        token: response.token,
        id: response.id,
        role: role // Rolle aus Auswahl, Backend-Rollen werden ignoriert
    };
};

export const registerRequest = async (username, email, password) => {
    const api = createApi();
    return api.post('/authenticate/register', { username, email, password });
};

export const getSubscriptionDetails = async (competitionId) => {
    const api = createApi();
    return api.get(`/competition/${competitionId}/subscribe`);
};

export const getOwnedOrganizations = getOwnedOrganizationsApi;

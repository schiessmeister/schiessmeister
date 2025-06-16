import { createApi } from '../utils/api';

export const loginRequest = async (email, password, role) => {
    // Temporärer Mock-Login: Akzeptiert beliebige Zugangsdaten
    console.log('Mock-Login mit:', { email, password, role });
    return Promise.resolve({
        token: 'mock-token-' + Math.random().toString(36).substring(7),
        id: Math.floor(Math.random() * 1000),
        role: role // Verwende die ausgewählte Rolle
    });
};

export const registerRequest = async (username, email, password) => {
    const api = createApi();
    return api.post('/authenticate/register', { username, email, password });
};

export const getSubscriptionDetails = async (competitionId) => {
    const api = createApi();
    return api.get(`/competition/${competitionId}/subscribe`);
};

import { createApi } from './api';
import { getOwnedOrganizations as getOwnedOrganizationsApi } from './apiClient';

export const loginRequest = async (email, password) => {
	// Echte Login-Implementierung
	const api = createApi();
	// Username = Email laut Backend-DTO
	const response = await api.post('/authenticate/login', {
		Username: email,
		Password: password
	});
	// response: { token, id, expiration, username, fullName, etc. }
	return {
		token: response.token,
		id: response.id,
		username: response.username || email,
		fullName: response.fullName || response.username || email
	};
};

export const registerRequest = async (username, firstname, lastname, gender, birthdate, email, password) => {
	const api = createApi();
	return api.post('/authenticate/register', {
		Username: username,
		Firstname: firstname,
		Lastname: lastname,
		Gender: gender,
		Birthdate: birthdate,
		Email: email,
		Password: password
	});
};

export const getSubscriptionDetails = async (competitionId) => {
	const api = createApi();
	return api.get(`/competition/${competitionId}/subscribe`);
};

export const getOwnedOrganizations = getOwnedOrganizationsApi;

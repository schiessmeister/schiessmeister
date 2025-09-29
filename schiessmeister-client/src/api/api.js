export const BASE_URL = 'https://localhost:7087';
export const API_BASE_URL = BASE_URL + '/api';

export const createApi = (token = null, handleUnauthorized = null) => {
	const fetchWithAuth = async (endpoint, options = {}) => {
		const headers = {
			'Content-Type': 'application/json',
			...(token && { Authorization: `Bearer ${token}` }),
			...options.headers
		};

		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			...options,
			headers
		});

		if (response.status === 401 && handleUnauthorized) {
			handleUnauthorized();
			throw new Error('Unauthorized');
		}

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		// Handle 204 No Content responses
		if (response.status === 204) {
			return null;
		}

		return response.json();
	};

	return {
		get: (endpoint) => fetchWithAuth(endpoint),
		post: (endpoint, data) =>
			fetchWithAuth(endpoint, {
				method: 'POST',
				body: JSON.stringify(data)
			}),
		put: (endpoint, data) =>
			fetchWithAuth(endpoint, {
				method: 'PUT',
				body: JSON.stringify(data)
			}),
		delete: (endpoint) =>
			fetchWithAuth(endpoint, {
				method: 'DELETE'
			})
	};
};

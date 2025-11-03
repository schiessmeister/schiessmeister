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
			let errorMessage = `HTTP error! status: ${response.status}`;
			let errorData = null;
			try {
				// First, read the response as text
				const responseText = await response.text();
				if (responseText) {
					try {
						// Try to parse as JSON
						errorData = JSON.parse(responseText);
						if (Array.isArray(errorData)) {
							// Handle Identity errors format: [{code: "...", description: "..."}]
							errorMessage = errorData.map((err) => err.description || err.code).join(', ');
						} else if (errorData.message) {
							errorMessage = errorData.message;
						} else if (typeof errorData === 'string') {
							errorMessage = errorData;
						}
					} catch {
						// If JSON parsing fails, use the text as error message
						errorMessage = responseText;
						errorData = responseText;
					}
				}
			} catch {
				// If reading response fails, keep the default error message
			}
			const error = new Error(errorMessage);
			error.status = response.status;
			error.data = errorData;
			// Ensure message is accessible
			error.toString = () => errorMessage;
			throw error;
		}

		// Handle 204 No Content responses
		if (response.status === 204) {
			return null;
		}

		// Try to parse response, handle both JSON and text
		try {
			const responseText = await response.text();
			if (!responseText) {
				return null;
			}
			try {
				return JSON.parse(responseText);
			} catch {
				// If not JSON, return the text as-is
				return responseText;
			}
		} catch {
			return null;
		}
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

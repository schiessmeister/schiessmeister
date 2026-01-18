import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [token, setToken] = useState(localStorage.getItem('token'));
	const [userId, setUserId] = useState(localStorage.getItem('userId'));
	const [userFullName, setUserFullName] = useState(localStorage.getItem('userFullName'));
	const [ownedOrganizations, setOwnedOrganizations] = useState(JSON.parse(localStorage.getItem('ownedOrganizations') || '[]'));
	const navigate = useNavigate();

	useEffect(() => {
		if (token) {
			localStorage.setItem('token', token);
		} else {
			localStorage.removeItem('token');
		}
	}, [token]);

	useEffect(() => {
		if (userId) {
			localStorage.setItem('userId', userId);
		} else {
			localStorage.removeItem('userId');
		}
	}, [userId]);

	useEffect(() => {
		if (userFullName) {
			localStorage.setItem('userFullName', userFullName);
		} else {
			localStorage.removeItem('userFullName');
		}
	}, [userFullName]);

	useEffect(() => {
		localStorage.setItem('ownedOrganizations', JSON.stringify(ownedOrganizations));
	}, [ownedOrganizations]);

	const login = (newToken, newUserId, fullName, organizations) => {
		setToken(newToken);
		setUserId(newUserId);
		setUserFullName(fullName);
		setOwnedOrganizations(organizations || []);
		navigate('/competitions');
	};

	const logout = () => {
		setToken(null);
		setUserId(null);
		setUserFullName(null);
		setOwnedOrganizations([]);
		localStorage.clear();
		navigate('/login');
	};

	const handleUnauthorized = () => {
		logout();
	};

	return <AuthContext.Provider value={{ token, userId, userFullName, ownedOrganizations, login, logout, handleUnauthorized }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

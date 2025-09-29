import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
        const [token, setToken] = useState(localStorage.getItem('token'));
        const [userId, setUserId] = useState(localStorage.getItem('userId'));
        const [role, setRole] = useState(localStorage.getItem('role'));
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
                if (role) {
                        localStorage.setItem('role', role);
                } else {
                        localStorage.removeItem('role');
                }
        }, [role]);

        const login = (newToken, newUserId, newRole) => {
                setToken(newToken);
                setUserId(newUserId);
                setRole(newRole);
                navigate(`/${newRole}/competitions`);
        };

        const logout = () => {
                setToken(null);
                setUserId(null);
                setRole(null);
                navigate('/login');
        };

	const handleUnauthorized = () => {
		logout();
	};

        return <AuthContext.Provider value={{ token, userId, role, login, logout, handleUnauthorized }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loginRequest, getOwnedOrganizations } from '../api/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const Login = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuth();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);
		try {
			const data = await loginRequest(username, password);
			const orgs = await getOwnedOrganizations(data.id, data.token);

			// Login with user info and organizations
			login(data.token, data.id, data.fullName, orgs || []);
		} catch (error) {
			if (error.message && error.message.includes('401')) {
				setError('Benutzername oder Passwort ist falsch.');
			} else {
				setError(error.message || 'Fehler beim Login');
			}
			console.error('Login error:', error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-white">
			<Card className="w-full max-w-sm mt-[-4rem]">
				<CardHeader className="items-center">
					<CardTitle className="text-3xl font-bold mb-2">Schießmeister</CardTitle>
					<div className="w-full border-b border-gray-200 my-2" />
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<div>
							<Input
								id="username"
								name="username"
								type="text"
								required
								placeholder="Benutzername"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								autoComplete="username"
								disabled={isLoading}
							/>
						</div>
						<div>
							<Input
								id="password"
								name="password"
								type="password"
								required
								placeholder="Passwort"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoComplete="current-password"
								disabled={isLoading}
							/>
						</div>
						{error && <div className="text-red-600 text-sm -mt-2">{error}</div>}
						<Button type="submit" className="w-full mt-2" disabled={isLoading}>
							{isLoading ? 'Wird angemeldet...' : 'Login'}
						</Button>
					</form>
					<div className="mt-6 text-center">
						<Link to="/register" className="text-sm text-muted-foreground hover:underline">
							Sie haben keinen Account? Registrieren
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Login;

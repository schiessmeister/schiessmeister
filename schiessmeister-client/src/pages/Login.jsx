import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loginRequest, getOwnedOrganizations } from '../api/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useData } from '../context/DataContext';

const Login = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [role, setRole] = useState('manager');
	const [isLoading, setIsLoading] = useState(false);
	const { login } = useAuth();
	const [organizations, setOrganizations] = useState([]);
	const [showOrgSelect, setShowOrgSelect] = useState(false);
	const [selectedOrg, setSelectedOrg] = useState(null);
	const [pendingLogin, setPendingLogin] = useState(null);
	const { setOrganization } = useData();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);
		try {
			const data = await loginRequest(username, password, role);
			const orgs = await getOwnedOrganizations(data.id, data.token);
			if (orgs && orgs.length > 0) {
				setOrganizations(orgs);
				setShowOrgSelect(true);
				setPendingLogin(data);
				setIsLoading(false);
				return;
			} else {
				setError('Keine Organisationen gefunden.');
				setIsLoading(false);
				return;
			}
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
						<div>
							<Label htmlFor="role">Bereich</Label>
							<select
								id="role"
								className="w-full border rounded-md px-3 py-2"
								value={role}
								onChange={(e) => setRole(e.target.value)}
								disabled={isLoading}
							>
								<option value="manager">Manager</option>
								<option value="writer">Writer</option>
							</select>
						</div>
						{error && <div className="text-red-600 text-sm -mt-2">{error}</div>}
						<Button type="submit" className="w-full mt-2" disabled={isLoading}>
							{isLoading ? 'Wird angemeldet...' : 'Login'}
						</Button>
					</form>
					<div className="mt-6 text-center">
						<Link to="/register" className="text-sm text-muted-foreground hover:underline">Sie haben keinen Account? Registrieren</Link>
					</div>
					<Dialog open={showOrgSelect}>
						<DialogContent showCloseButton={false}>
							<DialogHeader>
								<DialogTitle>Organisation wählen</DialogTitle>
							</DialogHeader>
							<div className="flex flex-col gap-4">
								<select
									id="org-select"
									className="w-full border rounded-md px-3 py-2"
									value={selectedOrg ? selectedOrg.id : ''}
									onChange={e => {
										const org = organizations.find(o => o.id === Number(e.target.value));
										setSelectedOrg(org);
									}}
								>
									<option value="" disabled>Bitte wählen...</option>
									{organizations.map(org => (
										<option key={org.id} value={org.id}>{org.name}</option>
									))}
								</select>
								<Button
									className="w-full mt-2"
									disabled={!selectedOrg}
									onClick={() => {
										if (!pendingLogin || !selectedOrg) return;
										setOrganization(selectedOrg);
										localStorage.setItem('organization', JSON.stringify(selectedOrg));
										login(pendingLogin.token, pendingLogin.id, pendingLogin.role);
									}}
								>
									Weiter
								</Button>
							</div>
						</DialogContent>
					</Dialog>
				</CardContent>
			</Card>
		</div>
	);
};

export default Login;

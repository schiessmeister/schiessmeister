import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loginRequest } from '../api/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
        const [error, setError] = useState('');
        const [role, setRole] = useState('manager');
        const [isLoading, setIsLoading] = useState(false);
        const { login } = useAuth();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
                setIsLoading(true);

		try {
                        const data = await loginRequest(email, password, role);
                        login(data.token, data.id, data.role);
		} catch (error) {
			setError(error.message || 'Ungültige E-Mail oder Passwort');
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
								id="email"
								name="email"
								type="email"
								required
								placeholder="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								autoComplete="email"
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
				</CardContent>
			</Card>
		</div>
	);
};

export default Login;

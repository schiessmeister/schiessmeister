import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerRequest, loginRequest } from '../api/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Register = () => {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const { login } = useAuth();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

               try {
                        await registerRequest(username, email, password);
                        const data = await loginRequest(username, password);
                        login(data.token, data.id);
                } catch (error) {
                        setError(error.message || 'Registration failed');
                        console.error('Registration error:', error);
                }
	};

	return (
		<main>
			<h2>Account erstellen</h2>

                        <form onSubmit={handleSubmit}>
                                <div>
                                        <Label htmlFor="username">Username</Label>
                                        <Input id="username" name="username" type="text" required placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                                </div>

                                <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>

                                <div>
                                        <Label htmlFor="password">Passwort</Label>
                                        <Input id="password" name="password" type="password" required placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>

                                {error && <div>{error}</div>}

                                <Button type="submit">Registrieren</Button>
                        </form>

			<Link to="/login">Sie haben schon einen Account? Anmelden</Link>
		</main>
	);
};

export default Register;

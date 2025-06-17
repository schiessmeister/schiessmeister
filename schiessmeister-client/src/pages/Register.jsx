import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerRequest, loginRequest } from '../api/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

const Register = () => {
	const [username, setUsername] = useState('');
	const [firstname, setFirstname] = useState('');
	const [lastname, setLastname] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const { login } = useAuth();
	const [gender, setGender] = useState('');

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		try {
			await registerRequest(username, firstname, lastname, email, password, gender);
			const data = await loginRequest(username, password);
			login(data.token, data.id);
		} catch (error) {
			setError(error.message || 'Registration failed');
			console.error('Registration error:', error);
		}
	};

	return (
		<main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<Card className="w-full max-w-md shadow-lg">
				<CardHeader>
					<CardTitle>Account erstellen</CardTitle>
					<CardDescription>Bitte fülle alle Felder aus, um dich zu registrieren.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label htmlFor="username">Username</Label>
							<Input id="username" name="username" type="text" required placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
						</div>
						<div className="flex gap-4">
							<div className="w-1/2">
								<Label htmlFor="firstname">Vorname</Label>
								<Input id="firstname" name="firstname" type="text" required placeholder="Vorname" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
							</div>
							<div className="w-1/2">
								<Label htmlFor="lastname">Nachname</Label>
								<Input id="lastname" name="lastname" type="text" required placeholder="Nachname" value={lastname} onChange={(e) => setLastname(e.target.value)} />
							</div>
						</div>
						<div>
							<Label htmlFor="email">Email</Label>
							<Input id="email" name="email" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
						</div>
						<div>
							<Label htmlFor="password">Passwort</Label>
							<Input id="password" name="password" type="password" required placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} />
						</div>
						<div>
							<Label htmlFor="gender">Geschlecht</Label>
							<Select id="gender" name="gender" required value={gender} onChange={e => setGender(e.target.value)}>
								<option value="" disabled>Bitte wählen</option>
								<option value="F">Weiblich</option>
								<option value="M">Männlich</option>
							</Select>
						</div>
						{error && <div className="text-red-500 text-sm pt-2">{error}</div>}
						<Button type="submit" className="w-full">Registrieren</Button>
					</form>
				</CardContent>
				<CardFooter className="flex flex-col gap-2">
					<span className="text-sm text-muted-foreground">Sie haben schon einen Account?</span>
					<Link to="/login" className="text-blue-600 hover:underline text-sm">Anmelden</Link>
				</CardFooter>
			</Card>
		</main>
	);
};

export default Register;

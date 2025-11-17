import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerRequest, loginRequest, getOwnedOrganizations } from '../api/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const Register = () => {
	const [username, setUsername] = useState('');
	const [firstname, setFirstname] = useState('');
	const [lastname, setLastname] = useState('');
	const [gender, setGender] = useState('');
	const [birthdate, setBirthdate] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const { login } = useAuth();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		try {
			await registerRequest(username, firstname, lastname, gender, birthdate, email, password);
			const data = await loginRequest(username, password);
			const orgs = await getOwnedOrganizations(data.id, data.token);

			// Login with user info and organizations
			login(data.token, data.id, data.fullName, orgs || []);
		} catch (error) {
			// Handle both error.message and direct error string
			const errorMsg = error.message || error.toString() || 'Registration failed';
			setError(errorMsg);
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
					<Label htmlFor="firstname">Vorname</Label>
					<Input id="firstname" name="firstname" type="text" required placeholder="Vorname" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
				</div>

				<div>
					<Label htmlFor="lastname">Nachname</Label>
					<Input id="lastname" name="lastname" type="text" required placeholder="Nachname" value={lastname} onChange={(e) => setLastname(e.target.value)} />
				</div>

				<div>
					<Label htmlFor="gender">Geschlecht</Label>
					<Select id="gender" name="gender" required value={gender} onChange={(e) => setGender(e.target.value)}>
						<option value="">Bitte wählen</option>
						<option value="M">Männlich</option>
						<option value="F">Weiblich</option>
					</Select>
				</div>

				<div>
					<Label htmlFor="birthdate">Geburtsdatum</Label>
					<Input id="birthdate" name="birthdate" type="date" required value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
				</div>

				<div>
					<Label htmlFor="email">Email</Label>
					<Input id="email" name="email" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
				</div>

				<div>
					<Label htmlFor="password">Passwort</Label>
					<Input id="password" name="password" type="password" required placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} />
				</div>

				{error && <div style={{ color: 'red', marginTop: '10px', marginBottom: '10px' }}>{error}</div>}

				<Button type="submit">Registrieren</Button>
			</form>

			<Link to="/login">Sie haben schon einen Account? Anmelden</Link>
		</main>
	);
};

export default Register;

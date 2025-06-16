import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCompetitions, deleteUser } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';
import { Button } from "@/components/ui/button"

const Home = () => {
	const [competitions, setCompetitions] = useState([]);
	const [error, setError] = useState(null);
	const navigate = useNavigate();
	const auth = useAuth();

	useEffect(() => {
		const fetchCompetitions = async () => {
			try {
				//const data = await getCompetitions(auth);
				//setCompetitions(data);
			} catch (err) {
				setError('Failed to load competitions');
				console.error(err);
			}
		};

		fetchCompetitions();
	}, [auth]);

        const handleCompetitionClick = (id) => {
                navigate(`/manager/competitions/${id}`);
        };

	const handleDeleteAccount = async () => {
		if (window.confirm('Möchten Sie Ihr Konto wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
			try {
				await deleteUser(auth.userId, auth);
				auth.logout();
			} catch (err) {
				setError('Fehler beim Löschen des Kontos');
				console.error(err);
			}
		}
	};

	if (error) return <div className="error">{error}</div>;

	return (
		<main>
			<h2>Wettbewerb öffnen</h2>

			<div className="comp-list">
                                {competitions.map((comp) => (
                                        <Button key={comp.id} onClick={() => handleCompetitionClick(comp.id)}>
                                                {comp.name}
                                        </Button>
                                ))}

				{competitions.length == 0 && <p>Noch keine Bewerbe.</p>}
			</div>
			
			<h2>Wettbewerb erstellen</h2>

                        <Link to="/createcompetition">
                                <Button>Erstellen</Button>
                        </Link>

			<div className="account-actions">
                                <Button variant="secondary" onClick={auth.logout}>
                                        Abmelden
                                </Button>
                                <Button variant="secondary" onClick={handleDeleteAccount}>
                                        Konto löschen
                                </Button>
			</div>
		</main>
	);
};

export default Home;

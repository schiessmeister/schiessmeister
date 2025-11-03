import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import CompetitionForm from '../../components/CompetitionForm';

const CreateCompetition = () => {
  const { addCompetition } = useData();
  const { ownedOrganizations } = useAuth();
  const navigate = useNavigate();

  // Only users who own at least one organization can create competitions
  const canCreate = ownedOrganizations && ownedOrganizations.length > 0;

  // Redirect if no permission
  useEffect(() => {
    if (!canCreate) {
      navigate('/competitions');
    }
  }, [canCreate, navigate]);

  if (!canCreate) return <div>Sie müssen Besitzer einer Organisation sein, um Wettbewerbe zu erstellen.</div>;

  const handleSubmit = (data) => {
    addCompetition(data);
    navigate('/competitions');
  };

  return (
    <main>
      <CompetitionForm
        initialValues={{}}
        onSubmit={handleSubmit}
        submitLabel="Erstellen"
        onCancel={() => navigate('/competitions')}
      />
    </main>
  );
};

export default CreateCompetition;

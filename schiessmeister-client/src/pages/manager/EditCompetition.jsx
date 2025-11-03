import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import CompetitionForm from '../../components/CompetitionForm';
import { canEditCompetitionMeta } from '../../utils/permissions';

const EditCompetition = () => {
  const { id } = useParams();
  const { competitions, updateCompetition } = useData();
  const { ownedOrganizations } = useAuth();
  const navigate = useNavigate();

  const competition = competitions.find((c) => c.id === parseInt(id));
  
  // Permission check - only owners can edit competition metadata
  const canEdit = competition && canEditCompetitionMeta(competition, ownedOrganizations);

  // Redirect if no permission
  useEffect(() => {
    if (competition && !canEdit) {
      navigate(`/competitions/${competition.id}`);
    }
  }, [competition, canEdit, navigate]);

  if (!competition) return <div>Wettbewerb nicht gefunden</div>;
  if (!canEdit) return <div>Keine Berechtigung zum Bearbeiten.</div>;

  const handleSubmit = (data) => {
    updateCompetition(competition.id, data);
    navigate(`/competitions/${competition.id}`);
  };

  return (
    <main>
      <CompetitionForm
        initialValues={competition}
        onSubmit={handleSubmit}
        submitLabel="Speichern"
        onCancel={() => navigate(`/competitions/${competition.id}`)}
      />
    </main>
  );
};

export default EditCompetition;

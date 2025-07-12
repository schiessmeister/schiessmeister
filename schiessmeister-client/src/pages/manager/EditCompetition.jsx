import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import CompetitionForm from '../../components/CompetitionForm';

const EditCompetition = () => {
  const { id } = useParams();
  const { competitions, updateCompetition } = useData();
  const navigate = useNavigate();

  const competition = competitions.find((c) => c.id === parseInt(id));
  if (!competition) return <div>Wettbewerb nicht gefunden</div>;

  const handleSubmit = (data) => {
    updateCompetition(competition.id, data);
    navigate(`/manager/competitions/${competition.id}`);
  };

  return (
    <main>
      <CompetitionForm
        initialValues={competition}
        onSubmit={handleSubmit}
        submitLabel="Speichern"
        onCancel={() => navigate(`/manager/competitions/${competition.id}`)}
      />
    </main>
  );
};

export default EditCompetition;

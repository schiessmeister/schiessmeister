import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import CompetitionForm from '../components/CompetitionForm';

const CreateCompetition = () => {
  const { addCompetition } = useData();
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    await addCompetition(data);
    navigate('/manager/competitions');
  };

  return (
    <main>
      <CompetitionForm
        initialValues={{}}
        onSubmit={handleSubmit}
        submitLabel="Erstellen"
        onCancel={() => navigate('/manager/competitions')}
      />
    </main>
  );
};

export default CreateCompetition;

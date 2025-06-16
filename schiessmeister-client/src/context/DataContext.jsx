import { createContext, useContext, useState } from 'react';
import { CompetitionService } from '../services/CompetitionService';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [competitions, setCompetitions] = useState(
    CompetitionService.getCompetitions()
  );

  const addCompetition = (competition) => {
    CompetitionService.addCompetition(competition);
    setCompetitions([...CompetitionService.getCompetitions()]);
  };

  const updateCompetition = (id, updated) => {
    CompetitionService.updateCompetition(id, updated);
    setCompetitions([...CompetitionService.getCompetitions()]);
  };

  return (
    <DataContext.Provider value={{ competitions, addCompetition, updateCompetition }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

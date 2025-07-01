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

  // Rekursive Zählfunktion für Teilnehmer in allen Gruppen
  function countParticipantsRecursive(competition) {
    // Hilfsfunktion für Gruppen
    function countInGroups(groups) {
      if (!groups) return 0;
      return groups.reduce((sum, g) => {
        const groupCount = Array.isArray(g.participations) ? g.participations.length : 0;
        const subCount = g.subParticipationGroups ? countInGroups(g.subParticipationGroups) : 0;
        return sum + groupCount + subCount;
      }, 0);
    }
    // Teilnehmer in Gruppen + Teilnehmer direkt in der Competition (falls vorhanden)
    const groupCount = countInGroups(competition.participantGroups);
    const directCount = Array.isArray(competition.participations) ? competition.participations.length : 0;
    return groupCount > 0 ? groupCount : directCount;
  }

  return (
    <DataContext.Provider value={{ competitions, addCompetition, updateCompetition, countParticipantsRecursive }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

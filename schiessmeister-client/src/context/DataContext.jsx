import { createContext, useContext, useState, useEffect } from 'react';
import { getCompetitionsByOrganization, getCompetition } from '../api/apiClient';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [competitions, setCompetitions] = useState([]);
  const [organization, setOrganizationState] = useState(() => {
    const orgRaw = localStorage.getItem('organization');
    return orgRaw ? JSON.parse(orgRaw) : null;
  });
  const { token, handleUnauthorized } = useAuth();

  useEffect(() => {
    const fetchCompetitions = async () => {
      if (organization?.id) {
        try {
          // 1. Wettbewerbe der Organisation laden (nur Basisdaten)
          const competitionsList = await getCompetitionsByOrganization(organization.id, { token, handleUnauthorized });
          // 2. Für jeden Wettbewerb die Details nachladen
          const detailedCompetitions = await Promise.all(
            competitionsList.map(async (c) => {
              try {
                return await getCompetition(c.id, { token, handleUnauthorized });
              } catch (err) {
                return null; // Fehlerhafte Wettbewerbe überspringen
              }
            })
          );
          setCompetitions(detailedCompetitions.filter(Boolean));
        } catch (err) {
          setCompetitions([]);
        }
      } else {
        setCompetitions([]);
      }
    };
    fetchCompetitions();
  }, [organization, token, handleUnauthorized]);

  const setOrganization = (org) => {
    setOrganizationState(org);
    if (org) {
      localStorage.setItem('organization', JSON.stringify(org));
    } else {
      localStorage.removeItem('organization');
    }
  };

  // Competition im State aktualisieren
  const updateCompetition = (competitionId, updatedCompetition) => {
    setCompetitions(prev => prev.map(c => c.id === competitionId ? { ...c, ...updatedCompetition } : c));
    // Hier könnte ggf. noch ein API-Call erfolgen, falls Backend-Sync nötig ist
  };

  // Rekursive Zählfunktion für Teilnehmer in allen Gruppen
  function countParticipantsRecursive(competition) {
    function countInGroups(groups) {
      if (!groups) return 0;
      return groups.reduce((sum, g) => {
        const groupCount = Array.isArray(g.participations) ? g.participations.length : 0;
        const subCount = g.subParticipationGroups ? countInGroups(g.subParticipationGroups) : 0;
        return sum + groupCount + subCount;
      }, 0);
    }
    const groupCount = countInGroups(competition.participantGroups);
    const directCount = Array.isArray(competition.participations) ? competition.participations.length : 0;
    return groupCount > 0 ? groupCount : directCount;
  }

  return (
    <DataContext.Provider value={{ competitions, countParticipantsRecursive, organization, setOrganization, updateCompetition }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

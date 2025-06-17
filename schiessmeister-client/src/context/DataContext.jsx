import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getCompetitions, createCompetition, updateCompetition as apiUpdateCompetition, getOwnedOrganizations } from '../api/apiClient';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const auth = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const loadCompetitions = useCallback(async () => {
    if (!auth.token) {
      setCompetitions([]);
      setOrganizations([]);
      return;
    }
    try {
      const orgs = await getOwnedOrganizations(auth);
      setOrganizations(orgs);
      const comps = await getCompetitions(auth);
      setCompetitions(comps);
    } catch (err) {
      console.error('Failed to load competitions', err);
    }
  }, [auth]);

  useEffect(() => {
    loadCompetitions();
  }, [loadCompetitions]);

  const addCompetition = async (competition) => {
    if (!organizations.length) throw new Error('No organization available');
    const newComp = await createCompetition(organizations[0].id, competition, auth);
    setCompetitions((prev) => [...prev, newComp]);
    return newComp;
  };

  const updateCompetition = async (id, updated) => {
    const updatedComp = await apiUpdateCompetition(id, updated, auth);
    setCompetitions((prev) => prev.map((c) => (c.id === id ? updatedComp : c)));
    return updatedComp;
  };

  return (
    <DataContext.Provider value={{ competitions, addCompetition, updateCompetition, reloadCompetitions: loadCompetitions }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

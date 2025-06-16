import { sampleCompetitions } from '../data/sampleData';

let competitions = [...sampleCompetitions];

export const CompetitionService = {
  getCompetitions() {
    return competitions;
  },
  addCompetition(competition) {
    const newComp = { ...competition, id: Date.now() };
    competitions = [...competitions, newComp];
    return newComp;
  },
  updateCompetition(id, updated) {
    competitions = competitions.map(c =>
      c.id === id ? { ...c, ...updated } : c
    );
    return competitions.find(c => c.id === id);
  }
};
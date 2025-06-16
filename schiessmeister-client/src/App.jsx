import Login from './pages/Login';
import Register from './pages/Register';
import Competitions from './pages/Competitions';
import CreateCompetition from './pages/CreateCompetition';
import EditCompetition from './pages/EditCompetition';
import CompetitionDetail from './pages/CompetitionDetail';
import Results from './pages/Results';
import ResultsInput from './pages/ResultsInput';
import CompetitionOverview from './pages/CompetitionOverview';
import WriterCompetitionOverview from './pages/WriterCompetitionOverview';
import ParticipantsList from './pages/Participantslist';
import CreateParticipantGroup from './pages/CreateParticipantGroup';
import EditParticipantGroup from './pages/EditParticipantGroup';
import Logout from './pages/Logout';
import CompetitionLeaderboard from './pages/CompetitionLeaderboard';
import PublicLeaderboard from './pages/PublicLeaderboard';
import WriterParticipantsList from './pages/WriterParticipantsList';
import WriterParticipantGroupView from './pages/WriterParticipantGroupView';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ProtectedRoute from './components/ProtectedRoute';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RoleSwitch from './components/RoleSwitch';

export default function App() {
        return (
                <BrowserRouter>
                        <AuthProvider>
                                <DataProvider>
                                        {/* Role Switch mit integriertem Logout */}
                                        <RoleSwitch />
                                        <Routes>
                                                {/* Public routes */}
                                                <Route path="login" element={<Login />} />
                                                <Route path="register" element={<Register />} />
                                                <Route path="logout" element={<Logout />} />
                                                <Route path="public-leaderboard/:id" element={<PublicLeaderboard />} />

                                                {/* Protected routes */}
                                                <Route element={<ProtectedRoute />}>
                                                        {/* Manager */}
                                                        <Route path="manager/competitions" element={<Competitions />} />
                                                        <Route path="manager/competitions/new" element={<CreateCompetition />} />
                                                        <Route path="manager/competitions/:id" element={<CompetitionDetail editable={false} />} />
                                                        <Route path="manager/competitions/:id/edit" element={<EditCompetition />} />
                                                        <Route path="manager/competitions/:id/leaderboard" element={<CompetitionLeaderboard />} />
                                                        <Route path="manager/participant-groups/new" element={<CreateParticipantGroup />} />
                                                        <Route path="manager/participant-groups/:id/edit" element={<EditParticipantGroup />} />
                                                        
                                                        {/* Writer */}
                                                        <Route path="writer/competitions" element={<Competitions />} />
                                                        <Route path="writer/competitions/:id" element={<WriterCompetitionOverview />} />
                                                        <Route path="writer/competitions/:competitionId/participationGroups/:groupId" element={<WriterParticipantGroupView />} />
                                                        <Route path="writer/results/:competitionId/:participationId" element={<ResultsInput />} />
                                                        <Route path="writer/participantsList/:id" element={<WriterParticipantsList />} />
                                                </Route>

                                                {/* Redirects */}
                                                <Route path="/" element={<Navigate to="/login" replace />} />
                                                <Route path="*" element={<Navigate to="/login" replace />} />
                                        </Routes>
                                </DataProvider>
                        </AuthProvider>
                </BrowserRouter>
        );
}

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<App />
	</StrictMode>
);

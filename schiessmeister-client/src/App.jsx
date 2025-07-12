import Login from './pages/Login';
import Register from './pages/Register';
import Competitions from './pages/Competitions';
import CreateCompetition from './pages/manager/CreateCompetition';
import EditCompetition from './pages/manager/EditCompetition';
import CompetitionDetail from './pages/manager/CompetitionDetail';
import EditParticipantGroup from './pages/manager/EditParticipantGroup';
import Logout from './pages/Logout';
import CompetitionLeaderboard from './pages/manager/CompetitionLeaderboard';
import WriterParticipantsList from './pages/writer/WriterParticipantsList';
import WriterParticipantGroupView from './pages/writer/WriterParticipantGroupView';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ProtectedRoute from './components/ProtectedRoute';
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

                                                {/* Protected routes */}
                                                <Route element={<ProtectedRoute />}>
                                                        {/* Manager */}
                                                        <Route path="manager/competitions" element={<Competitions />} />
                                                        <Route path="manager/competitions/new" element={<CreateCompetition />} />
                                                        <Route path="manager/competitions/:id" element={<CompetitionDetail editable={false} />} />
                                                        <Route path="manager/competitions/:id/edit" element={<EditCompetition />} />
                                                        <Route path="manager/competitions/:id/leaderboard" element={<CompetitionLeaderboard />} />
                                                        <Route path="manager/participant-groups/:id/edit" element={<EditParticipantGroup />} />
                                                        
                                                        {/* Writer */}
                                                        <Route path="writer/competitions" element={<Competitions />} />
                                                        <Route path="writer/competitions/:competitionId/participationGroups/:groupId" element={<WriterParticipantGroupView />} />
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

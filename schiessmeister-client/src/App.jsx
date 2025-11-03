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
import UserHeader from './components/UserHeader';

export default function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<DataProvider>
					{/* User Header mit Logout */}
					<UserHeader />
					<Routes>
						{/* Public routes */}
						<Route path="login" element={<Login />} />
						<Route path="register" element={<Register />} />
						<Route path="logout" element={<Logout />} />

						{/* Protected routes */}
						<Route element={<ProtectedRoute />}>
							{/* Unified competitions path */}
							<Route path="competitions" element={<Competitions />} />
							<Route path="competitions/new" element={<CreateCompetition />} />
							<Route path="competitions/:id" element={<CompetitionDetail editable={false} />} />
							<Route path="competitions/:id/edit" element={<EditCompetition />} />
							<Route path="competitions/:id/leaderboard" element={<CompetitionLeaderboard />} />
							<Route path="participant-groups/:id/edit" element={<EditParticipantGroup />} />
							<Route path="competitions/:competitionId/participationGroups/:groupId" element={<WriterParticipantGroupView />} />
							<Route path="participantsList/:id" element={<WriterParticipantsList />} />
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

import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const UserHeader = () => {
	const { token, userFullName, ownedOrganizations, logout } = useAuth();

	// Wenn nicht eingeloggt, nichts anzeigen
	if (!token) return null;

	// Initialen für Avatar generieren
	const getInitials = (name) => {
		if (!name) return '?';
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
		}
		return name[0].toUpperCase();
	};

	// Organisationsnamen mit Komma getrennt
	const organizationNames = ownedOrganizations.map((org) => org.name).join(', ') || 'Keine Organisationen';

	return (
		<div className="fixed top-4 right-4 z-50 flex items-center gap-4">
			<div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-sm">
				<div className="flex items-center gap-3">
					<Avatar className="h-8 w-8">
						<AvatarFallback>{getInitials(userFullName)}</AvatarFallback>
					</Avatar>
					<div className="flex flex-col">
						<span className="text-sm font-medium">{userFullName || 'Benutzer'}</span>
						<span className="text-xs text-muted-foreground">{organizationNames}</span>
					</div>
				</div>
				<Button variant="ghost" size="icon" className="h-8 w-8" onClick={logout}>
					<LogOut className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};

export default UserHeader;

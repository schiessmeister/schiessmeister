import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useState } from 'react';
import { getOwnedOrganizations } from '../api/apiClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const RoleSwitch = () => {
    const { role, login, token, logout } = useAuth();
    const { organization, setOrganization } = useData();
    const [showOrgDialog, setShowOrgDialog] = useState(false);
    const [orgList, setOrgList] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const navigate = useNavigate();

    // Wenn nicht eingeloggt, nichts anzeigen
    if (!token) return null;

    const handleRoleSwitch = () => {
        const newRole = role === 'manager' ? 'writer' : 'manager';
        // Behalte den Token und die ID bei, ändere nur die Rolle
        login(localStorage.getItem('token'), localStorage.getItem('userId'), newRole);
        navigate(`/${newRole}/competitions`);
    };

    return (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>
                            {role === 'manager' ? 'M' : 'W'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">
                            {role === 'manager' ? 'Manager' : 'Writer'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                           {/* Organisation anzeigen */}
                           {organization ? `Orga: ${organization.name}` : 'Keine Organisation'}
                           <button
                               className="text-xs text-blue-600 underline ml-1"
                               onClick={async (e) => {
                                   e.preventDefault();
                                   // Hole Orga-Liste
                                   const userId = localStorage.getItem('userId');
                                   const token = localStorage.getItem('token');
                                   if (userId && token) {
                                       const orgs = await getOwnedOrganizations(userId, token);
                                       setOrgList(orgs);
                                       setShowOrgDialog(true);
                                   }
                               }}
                           >wechseln</button>
                        </span>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRoleSwitch}
                    className="h-8"
                >
                    Zu {role === 'manager' ? 'Writer' : 'Manager'} wechseln
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={logout}
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
            {/* Orga-Wechsel Dialog */}
            <Dialog open={showOrgDialog} onOpenChange={setShowOrgDialog}>
                <DialogContent showCloseButton={true}>
                    <DialogHeader>
                        <DialogTitle>Organisation wechseln</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <select
                            id="org-switch-select"
                            className="w-full border rounded-md px-3 py-2"
                            value={selectedOrg ? selectedOrg.id : ''}
                            onChange={e => {
                                const org = orgList.find(o => o.id === Number(e.target.value));
                                setSelectedOrg(org);
                            }}
                        >
                            <option value="" disabled>Bitte wählen...</option>
                            {orgList.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                        <Button
                            className="w-full mt-2"
                            disabled={!selectedOrg}
                            onClick={() => {
                                if (!selectedOrg) return;
                                setOrganization(selectedOrg);
                                localStorage.setItem('organization', JSON.stringify(selectedOrg));
                                setShowOrgDialog(false);
                                window.location.reload();
                            }}
                        >
                            Wechseln
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RoleSwitch; 
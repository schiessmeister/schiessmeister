import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const RoleSwitch = () => {
    const { role, login, token } = useAuth();
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
                           Luca Nigsch
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
                <Link to="/logout">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <LogOut className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default RoleSwitch; 
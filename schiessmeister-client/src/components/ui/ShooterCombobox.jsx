import React, { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { getUsers } from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';

/**
 * Single-select combobox component for shooters.
 * Dynamically fetches users from the API.
 *
 * @param {Object} value - Selected shooter object.
 * @param {Function} onChange - Callback when selection changes.
 * @param {string} placeholder - Placeholder text.
 * @param {string} label - Label text.
 * @param {boolean} disabled - Whether the combobox is disabled.
 */
export function ShooterCombobox({ value = null, onChange, placeholder = 'Teilnehmer auswählen...', label = 'Teilnehmer', disabled = false }) {
	const [open, setOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(false);
	const auth = useAuth();

	const fetchUsers = useCallback(
		async (term) => {
			try {
				setLoading(true);
				const response = await getUsers(term || null, auth);
				setUsers(response || []);
			} catch (err) {
				console.error('Failed to fetch users:', err);
				setUsers([]);
			} finally {
				setLoading(false);
			}
		},
		[auth]
	);

	// Debounced search effect
	useEffect(() => {
		if (!open) return;

		const timeoutId = setTimeout(() => {
			fetchUsers(searchTerm);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchTerm, open, fetchUsers]);

	// Fetch users on open
	useEffect(() => {
		if (open) {
			fetchUsers('');
		}
	}, [open, fetchUsers]);

	const handleSelect = (user) => {
		// Transform user object to shooter format (matching backend format)
		const shooter = {
			id: user.id,
			fullname: user.fullname || `${user.firstname} ${user.lastname}`,
			firstname: user.firstname,
			lastname: user.lastname,
			userName: user.userName || user.username,
			email: user.email,
			// Keep legacy 'name' field for backward compatibility
			name: user.fullname || `${user.firstname} ${user.lastname}`
		};
		onChange(shooter);
		setOpen(false);
	};

	const getShooterDisplayName = (shooter) => {
		if (!shooter) return '';
		// Handle both formats: from backend (fullname, userName) and local (name, email)
		const name = shooter.name || shooter.fullname || `${shooter.firstname || ''} ${shooter.lastname || ''}`.trim();
		const username = shooter.email || shooter.userName;
		return username ? `${name} (${username})` : name;
	};

	const getUserDisplayName = (user) => {
		const fullname = user.fullname || `${user.firstname} ${user.lastname}`;
		const username = user.userName || user.username;
		return username ? `${fullname} (${username})` : fullname;
	};

	const getDisplayText = () => {
		if (!value) {
			return <span className="text-muted-foreground">{placeholder}</span>;
		}
		return getShooterDisplayName(value);
	};

	const isSelected = (user) => {
		if (!value) return false;
		const username = user.userName || user.username;
		return value.email === username;
	};

	return (
		<div className="w-full">
			{label && <label className="block font-medium mb-1">{label}</label>}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						className="w-full justify-between border border-input shadow-xs rounded-md bg-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						disabled={disabled}
						aria-expanded={open}
					>
						<span className="truncate text-left flex-1">{getDisplayText()}</span>
						<ChevronDownIcon className="ml-2 size-4 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[220px] p-0 border-none shadow-none">
					<Command shouldFilter={false}>
						<CommandInput placeholder="Suchen..." value={searchTerm} onValueChange={setSearchTerm} />
						<CommandList>
							{loading && <div className="py-6 text-center text-sm text-muted-foreground">Lädt...</div>}
							{!loading && 0 === users.length && <CommandEmpty>Keine Teilnehmer gefunden.</CommandEmpty>}
							{!loading &&
								users.map((user) => (
									<CommandItem key={user.id} onSelect={() => handleSelect(user)} className="flex items-center gap-2 cursor-pointer" data-selected={isSelected(user)}>
										<span className="flex items-center gap-2">{getUserDisplayName(user)}</span>
										{isSelected(user) && <CheckIcon className="ml-auto size-4 text-primary" />}
									</CommandItem>
								))}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}

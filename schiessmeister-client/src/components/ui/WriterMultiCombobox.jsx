import React, { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { getUsers } from '@/api/apiClient';
import { useAuth } from '@/context/AuthContext';

/**
 * Multi-select combobox component.
 * Supports both static options and dynamic user loading from API.
 *
 * @param {Array} options - Static options (strings) - if provided, uses static mode.
 * @param {Array} value - Selected values (strings for static mode, user objects for dynamic mode).
 * @param {Function} onChange - Callback when selection changes.
 * @param {string} placeholder - Placeholder text.
 * @param {string} label - Label text.
 * @param {boolean} disabled - Whether the combobox is disabled.
 * @param {boolean} useDynamicUsers - If true, loads users dynamically from API instead of using static options.
 */
export function WriterMultiCombobox({ options = [], value = [], onChange, placeholder = 'Schreiber auswählen...', label = 'Schreiber', disabled = false, useDynamicUsers = false }) {
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
				// Filter out the current user - they don't need recorder rights as organization owner.
				// Use != instead of !== because userId might be string while user.id is number.
				const filteredUsers = (response || []).filter((user) => user.id != auth.userId);
				setUsers(filteredUsers);
			} catch (err) {
				console.error('Failed to fetch users:', err);
				setUsers([]);
			} finally {
				setLoading(false);
			}
		},
		[auth]
	);

	// Dynamic mode: Debounced search effect.
	useEffect(() => {
		if (!useDynamicUsers || !open) return;

		const timeoutId = setTimeout(() => {
			fetchUsers(searchTerm);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchTerm, open, useDynamicUsers, fetchUsers]);

	// Dynamic mode: Fetch users on open.
	useEffect(() => {
		if (useDynamicUsers && open) {
			fetchUsers('');
		}
	}, [open, useDynamicUsers, fetchUsers]);

	// Handle selection for both static and dynamic modes.
	const handleSelect = (item) => {
		if (useDynamicUsers) {
			// Dynamic mode: work with user objects.
			const isSelected = value.some((v) => v.id === item.id);
			if (isSelected) {
				onChange(value.filter((v) => v.id !== item.id));
			} else {
				onChange([...value, item]);
			}
		} else {
			// Static mode: work with strings.
			if (value.includes(item)) {
				onChange(value.filter((v) => v !== item));
			} else {
				onChange([...value, item]);
			}
		}
	};

	const isSelected = (item) => {
		if (useDynamicUsers) {
			return value.some((v) => v.id === item.id);
		}
		return value.includes(item);
	};

	const getUserDisplayName = (user) => {
		const fullname = user.fullname || `${user.firstname} ${user.lastname}`;
		const username = user.userName || user.username;
		return username ? `${fullname} (${username})` : fullname;
	};

	const getDisplayText = () => {
		if (0 === value.length) {
			return <span className="text-muted-foreground">{placeholder}</span>;
		}
		if (useDynamicUsers) {
			return value.map((u) => getUserDisplayName(u)).join(', ');
		}
		return value.join(', ');
	};

	const itemsList = useDynamicUsers ? users : options;

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
					<Command shouldFilter={!useDynamicUsers}>
						<CommandInput placeholder="Suchen..." value={useDynamicUsers ? searchTerm : undefined} onValueChange={useDynamicUsers ? setSearchTerm : undefined} />
						<CommandList>
							{useDynamicUsers && loading && <div className="py-6 text-center text-sm text-muted-foreground">Lädt...</div>}
							{!loading && 0 === itemsList.length && <CommandEmpty>Keine Schreiber gefunden.</CommandEmpty>}
							{!loading &&
								itemsList.map((item) => {
									const key = useDynamicUsers ? item.id : item;
									const displayName = useDynamicUsers ? getUserDisplayName(item) : item;
									return (
										<CommandItem key={key} onSelect={() => handleSelect(item)} className="flex items-center gap-2 cursor-pointer" data-selected={isSelected(item)}>
											<span className="flex items-center gap-2">{displayName}</span>
											{isSelected(item) && <CheckIcon className="ml-auto size-4 text-primary" />}
										</CommandItem>
									);
								})}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}

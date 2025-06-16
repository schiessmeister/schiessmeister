import React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

export function WriterMultiCombobox({
  options = [],
  value = [],
  onChange,
  placeholder = "Schreiber auswählen...",
  label = "Schreiber",
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false);
  const handleSelect = (option) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
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
            <span className="truncate text-left flex-1">
              {value.length === 0
                ? <span className="text-muted-foreground">{placeholder}</span>
                : value.join(", ")}
            </span>
            <ChevronDownIcon className="ml-2 size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[220px] p-0 border-none shadow-none">
          <Command>
            <CommandInput placeholder="Suchen..." />
            <CommandList>
              <CommandEmpty>Keine Schreiber gefunden.</CommandEmpty>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => handleSelect(option)}
                  className="flex items-center gap-2 cursor-pointer"
                  data-selected={value.includes(option)}
                >
                  <span className="flex items-center gap-2">{option}</span>
                  {value.includes(option) && (
                    <CheckIcon className="ml-auto size-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 
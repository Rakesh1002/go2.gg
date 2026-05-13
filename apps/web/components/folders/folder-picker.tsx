"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFolders } from "@/hooks/use-queries";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Folder, FolderOpen, X } from "lucide-react";
import { useState } from "react";

export interface FolderPickerProps {
  /** Current folder id, or `"none"` to mean "links not in any folder",
   *  or `null` / `undefined` for "no filter applied". */
  value?: string | "none" | null;
  onChange: (folderId: string | "none" | null) => void;
  /** Show "No folder" option that maps to "none" (filter mode). Defaults true. */
  includeNone?: boolean;
  /** Show "Clear" affordance so caller can unset to undefined. Defaults true. */
  allowClear?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function FolderPicker({
  value,
  onChange,
  includeNone = true,
  allowClear = true,
  placeholder = "No folder",
  className,
  disabled,
}: FolderPickerProps) {
  const [open, setOpen] = useState(false);
  const { data: folders = [], isLoading } = useFolders();

  const selected = value && value !== "none" ? folders.find((f) => f.id === value) : null;

  const label = (() => {
    if (value === "none") return "No folder";
    if (selected) return selected.name;
    return placeholder;
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="flex items-center gap-2 truncate">
            {selected ? (
              <Folder className="h-4 w-4 shrink-0" style={{ color: selected.color }} />
            ) : (
              <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{label}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search folders..." />
          <CommandList>
            <CommandEmpty>{isLoading ? "Loading..." : "No folders yet."}</CommandEmpty>
            {includeNone && (
              <CommandGroup>
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onChange("none");
                    setOpen(false);
                  }}
                >
                  <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                  No folder
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === "none" ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              </CommandGroup>
            )}
            {folders.length > 0 && (
              <>
                {includeNone && <CommandSeparator />}
                <CommandGroup heading="Folders">
                  {folders.map((folder) => (
                    <CommandItem
                      key={folder.id}
                      value={folder.name}
                      onSelect={() => {
                        onChange(folder.id);
                        setOpen(false);
                      }}
                    >
                      <Folder className="mr-2 h-4 w-4 shrink-0" style={{ color: folder.color }} />
                      <span className="truncate">{folder.name}</span>
                      <span className="ml-auto text-muted-foreground text-xs">
                        {folder.linkCount}
                      </span>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          value === folder.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            {allowClear && value != null && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="__clear__"
                    onSelect={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                  >
                    <X className="mr-2 h-4 w-4 text-muted-foreground" />
                    Clear selection
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

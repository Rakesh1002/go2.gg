"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronsUpDown,
  Building2,
  PlusCircle,
  Settings,
  Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  role: string;
}

export function OrgSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showNewOrgDialog, setShowNewOrgDialog] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");

  // Fetch organizations
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/v1/organizations`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const result = await response.json();
          const orgs = result.data || [];
          setOrganizations(orgs);

          // Set selected org from localStorage or first org
          const savedOrgId = localStorage.getItem("selectedOrgId");
          const savedOrg = orgs.find((o: Organization) => o.id === savedOrgId);
          setSelectedOrg(savedOrg || orgs[0] || null);
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizations();
  }, []);

  // Save selected org to localStorage
  const handleSelectOrg = (org: Organization) => {
    setSelectedOrg(org);
    localStorage.setItem("selectedOrgId", org.id);
    setOpen(false);
    router.refresh();
  };

  // Create new organization
  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/v1/organizations`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newOrgName,
            slug: newOrgSlug || newOrgName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const newOrg = result.data;
        setOrganizations([...organizations, newOrg]);
        handleSelectOrg(newOrg);
        setShowNewOrgDialog(false);
        setNewOrgName("");
        setNewOrgSlug("");
      } else {
        const error = await response.json();
        console.error("Failed to create org:", error);
        alert(error.error?.message || "Failed to create organization");
      }
    } catch (error) {
      console.error("Error creating organization:", error);
    } finally {
      setCreating(false);
    }
  };

  // Auto-generate slug from name
  useEffect(() => {
    if (newOrgName) {
      setNewOrgSlug(
        newOrgName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
      );
    }
  }, [newOrgName]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // For single org users (or no orgs), show a simple label without dropdown
  if (organizations.length <= 1) {
    const orgName = selectedOrg?.name || "Personal";
    const orgInitials = orgName.slice(0, 2).toUpperCase();

    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Avatar className="h-6 w-6">
          {selectedOrg?.logoUrl && <AvatarImage src={selectedOrg.logoUrl} alt={orgName} />}
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {orgInitials}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate">{orgName}</span>
      </div>
    );
  }

  // For multi-org users (Business/Enterprise), show full switcher
  return (
    <Dialog open={showNewOrgDialog} onOpenChange={setShowNewOrgDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select organization"
            className="w-full justify-between"
          >
            {selectedOrg ? (
              <>
                <Avatar className="mr-2 h-5 w-5">
                  {selectedOrg.logoUrl && (
                    <AvatarImage src={selectedOrg.logoUrl} alt={selectedOrg.name} />
                  )}
                  <AvatarFallback className="text-xs">
                    {selectedOrg.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedOrg.name}</span>
              </>
            ) : (
              <>
                <Building2 className="mr-2 h-4 w-4" />
                <span>Select organization</span>
              </>
            )}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search organization..." />
            <CommandList>
              <CommandEmpty>No organization found.</CommandEmpty>
              <CommandGroup heading="Organizations">
                {organizations.map((org) => (
                  <CommandItem
                    key={org.id}
                    onSelect={() => handleSelectOrg(org)}
                    className="cursor-pointer"
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      {org.logoUrl && <AvatarImage src={org.logoUrl} alt={org.name} />}
                      <AvatarFallback className="text-xs">
                        {org.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{org.name}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedOrg?.id === org.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setShowNewOrgDialog(true);
                    }}
                    className="cursor-pointer"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Organization
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
              {selectedOrg && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Manage">
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        router.push("/dashboard/team");
                      }}
                      className="cursor-pointer"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Team Members
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        router.push("/dashboard/settings");
                      }}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to collaborate with your team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              placeholder="Acme Inc."
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">app.example.com/</span>
              <Input
                id="slug"
                placeholder="acme-inc"
                value={newOrgSlug}
                onChange={(e) =>
                  setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Only lowercase letters, numbers, and hyphens allowed.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewOrgDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateOrg} disabled={!newOrgName.trim() || creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

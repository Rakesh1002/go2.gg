"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, MoreHorizontal, Eye, Trash2, Users, ExternalLink, Building2 } from "lucide-react";

// Demo organizations
const demoOrgs = [
  {
    id: "1",
    name: "Acme Inc.",
    slug: "acme",
    logoUrl: null,
    memberCount: 12,
    plan: "enterprise",
    mrr: 299,
    createdAt: "2024-01-01T10:00:00Z",
    ownerEmail: "owner@acme.com",
  },
  {
    id: "2",
    name: "TechCorp",
    slug: "techcorp",
    logoUrl: null,
    memberCount: 5,
    plan: "pro",
    mrr: 49,
    createdAt: "2024-01-05T14:30:00Z",
    ownerEmail: "admin@techcorp.io",
  },
  {
    id: "3",
    name: "StartupXYZ",
    slug: "startupxyz",
    logoUrl: null,
    memberCount: 3,
    plan: "starter",
    mrr: 19,
    createdAt: "2024-01-10T09:15:00Z",
    ownerEmail: "founder@startupxyz.com",
  },
  {
    id: "4",
    name: "Freelancer Pro",
    slug: "freelancer-pro",
    logoUrl: null,
    memberCount: 1,
    plan: "free",
    mrr: 0,
    createdAt: "2024-01-15T16:45:00Z",
    ownerEmail: "me@freelancer.dev",
  },
];

type Organization = (typeof demoOrgs)[0];

export function OrgManagement() {
  const [orgs, setOrgs] = useState(demoOrgs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const filteredOrgs = orgs.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMRR = orgs.reduce((sum, org) => sum + org.mrr, 0);

  const handleViewMembers = (org: Organization) => {
    toast.info(`Viewing members for ${org.name}`);
  };

  const handleDeleteOrg = () => {
    if (!selectedOrg) return;

    setOrgs((prev) => prev.filter((o) => o.id !== selectedOrg.id));
    toast.success(`${selectedOrg.name} has been deleted`);
    setShowDeleteDialog(false);
    setSelectedOrg(null);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orgs.reduce((sum, org) => sum + org.memberCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMRR.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search organizations by name, slug, or owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Organizations ({filteredOrgs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={org.logoUrl || undefined} />
                        <AvatarFallback>{org.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-sm text-muted-foreground">/{org.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{org.ownerEmail}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        org.plan === "enterprise"
                          ? "default"
                          : org.plan === "pro"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {org.memberCount}
                    </div>
                  </TableCell>
                  <TableCell>${org.mrr}/mo</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewMembers(org)}>
                          <Users className="mr-2 h-4 w-4" />
                          View Members
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View in Stripe
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedOrg(org);
                            setShowDeleteDialog(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Organization
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedOrg?.name}? This action cannot be undone and
              will remove all data including members, subscriptions, and resources.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrg}>
              Delete Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

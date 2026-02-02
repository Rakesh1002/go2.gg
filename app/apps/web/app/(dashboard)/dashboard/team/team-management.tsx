"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserPlus,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  User,
  Eye,
  Trash2,
  Mail,
} from "lucide-react";

interface Member {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

const roleIcons = {
  owner: ShieldCheck,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const roleBadgeVariants: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
  viewer: "outline",
};

export function TeamManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [inviting, setInviting] = useState(false);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function initializeOrg() {
      // First check localStorage for selected org
      let orgId: string | null = localStorage.getItem("selectedOrgId");
      
      // If no org in localStorage, fetch user's organizations and use the first one
      if (!orgId) {
        try {
          const response = await fetch(`${API_URL}/api/v1/organizations`, {
            credentials: "include",
          });
          
          if (response.ok) {
            const result = await response.json();
            const orgs = result.data || [];
            if (orgs.length > 0) {
              const firstOrgId = orgs[0].id as string;
              orgId = firstOrgId;
              localStorage.setItem("selectedOrgId", firstOrgId);
            }
          }
        } catch (error) {
          console.error("Failed to fetch organizations:", error);
        }
      }
      
      if (orgId) {
        setCurrentOrgId(orgId);
        fetchMembers(orgId);
      } else {
        setLoading(false);
      }
    }
    
    initializeOrg();
  }, []);

  const fetchMembers = async (orgId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/organizations/${orgId}/members`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data || []);

        // Find current user's role
        const currentUserId = localStorage.getItem("userId");
        const currentMember = data.data?.find((m: Member) => m.userId === currentUserId);
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        }
      }
    } catch (error) {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !currentOrgId) return;

    setInviting(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/organizations/${currentOrgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to send invitation");
      }

      toast.success(
        data.data?.status === "pending"
          ? "Invitation sent successfully"
          : "Member added successfully"
      );
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      fetchMembers(currentOrgId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!currentOrgId) return;

    try {
      const response = await fetch(`/api/v1/organizations/${currentOrgId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to update role");
      }

      toast.success("Role updated successfully");
      fetchMembers(currentOrgId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentOrgId) return;

    try {
      const response = await fetch(`/api/v1/organizations/${currentOrgId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to remove member");
      }

      toast.success("Member removed successfully");
      fetchMembers(currentOrgId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";
  const canChangeRoles = currentUserRole === "owner";

  if (!currentOrgId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No organization selected.</p>
          <p className="text-sm text-muted-foreground">
            Create or select an organization to manage your team.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite Card */}
      {canManageMembers && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invite Team Members</CardTitle>
            <CardDescription>Add new members to your organization by email.</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation email to add a new member to your team.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) => setInviteRole(v as typeof inviteRole)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admin - Can manage members and settings
                          </div>
                        </SelectItem>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Member - Can create and edit resources
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Viewer - Read-only access
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    {inviting ? "Sending..." : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? "s" : ""} in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  {canManageMembers && <TableHead className="w-[50px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const RoleIcon = roleIcons[member.role];
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.user.avatarUrl || undefined} />
                            <AvatarFallback>
                              {(member.user.name || member.user.email).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.user.name || "No name"}</div>
                            <div className="text-sm text-muted-foreground">{member.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariants[member.role]} className="gap-1">
                          <RoleIcon className="h-3 w-3" />
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                      {canManageMembers && (
                        <TableCell>
                          {member.role !== "owner" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canChangeRoles && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateRole(member.id, "admin")}
                                      disabled={member.role === "admin"}
                                    >
                                      <Shield className="mr-2 h-4 w-4" />
                                      Make Admin
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateRole(member.id, "member")}
                                      disabled={member.role === "member"}
                                    >
                                      <User className="mr-2 h-4 w-4" />
                                      Make Member
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateRole(member.id, "viewer")}
                                      disabled={member.role === "viewer"}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Make Viewer
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

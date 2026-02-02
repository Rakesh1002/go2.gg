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
import {
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  Trash2,
  UserCog,
  Shield,
  Mail,
  ExternalLink,
} from "lucide-react";

// Demo users - in production these would come from an API
const demoUsers = [
  {
    id: "1",
    email: "john@example.com",
    name: "John Doe",
    avatarUrl: null,
    createdAt: "2024-01-15T10:30:00Z",
    lastLoginAt: "2024-01-20T14:22:00Z",
    isAdmin: false,
    isBanned: false,
    organizationCount: 2,
    subscriptionPlan: "pro",
  },
  {
    id: "2",
    email: "jane@example.com",
    name: "Jane Smith",
    avatarUrl: null,
    createdAt: "2024-01-10T08:15:00Z",
    lastLoginAt: "2024-01-19T09:45:00Z",
    isAdmin: false,
    isBanned: false,
    organizationCount: 1,
    subscriptionPlan: "starter",
  },
  {
    id: "3",
    email: "admin@shipquest.dev",
    name: "Admin User",
    avatarUrl: null,
    createdAt: "2023-12-01T12:00:00Z",
    lastLoginAt: "2024-01-20T16:00:00Z",
    isAdmin: true,
    isBanned: false,
    organizationCount: 5,
    subscriptionPlan: "enterprise",
  },
  {
    id: "4",
    email: "banned@example.com",
    name: "Banned User",
    avatarUrl: null,
    createdAt: "2024-01-05T11:20:00Z",
    lastLoginAt: "2024-01-08T10:00:00Z",
    isAdmin: false,
    isBanned: true,
    organizationCount: 0,
    subscriptionPlan: "free",
  },
];

type User = (typeof demoUsers)[0];

export function UserManagement() {
  const [users, setUsers] = useState(demoUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImpersonate = (user: User) => {
    // In production, this would set an impersonation session
    toast.success(`Impersonating ${user.email}`);
    window.open(`/dashboard?impersonate=${user.id}`, "_blank");
  };

  const handleBanUser = () => {
    if (!selectedUser) return;

    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? { ...u, isBanned: !u.isBanned } : u))
    );
    toast.success(
      selectedUser.isBanned
        ? `${selectedUser.email} has been unbanned`
        : `${selectedUser.email} has been banned`
    );
    setShowBanDialog(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;

    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    toast.success(`${selectedUser.email} has been deleted`);
    setShowDeleteDialog(false);
    setSelectedUser(null);
  };

  const handleMakeAdmin = (user: User) => {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u)));
    toast.success(
      user.isAdmin ? `${user.email} is no longer an admin` : `${user.email} is now an admin`
    );
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Organizations</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback>
                          {(user.name || user.email).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name || "No name"}</span>
                          {user.isAdmin && (
                            <Badge variant="default" className="gap-1">
                              <Shield className="h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isBanned ? "destructive" : "outline"}>
                      {user.isBanned ? "Banned" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {user.subscriptionPlan.charAt(0).toUpperCase() +
                        user.subscriptionPlan.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.organizationCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.lastLoginAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleImpersonate(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Impersonate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View in Stripe
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleMakeAdmin(user)}>
                          <UserCog className="mr-2 h-4 w-4" />
                          {user.isAdmin ? "Remove Admin" : "Make Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setShowBanDialog(true);
                          }}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          {user.isBanned ? "Unban User" : "Ban User"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteDialog(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
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

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser?.isBanned ? "Unban User" : "Ban User"}</DialogTitle>
            <DialogDescription>
              {selectedUser?.isBanned
                ? `Are you sure you want to unban ${selectedUser?.email}? They will regain access to their account.`
                : `Are you sure you want to ban ${selectedUser?.email}? They will lose access to their account.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.isBanned ? "default" : "destructive"}
              onClick={handleBanUser}
            >
              {selectedUser?.isBanned ? "Unban" : "Ban"} User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.email}? This action cannot be undone
              and will remove all their data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Folder, MoreHorizontal, Pencil, Trash2, Link2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

interface FolderData {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  linkCount: number;
  createdAt: string;
  updatedAt: string;
}

const FOLDER_COLORS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#ec4899", label: "Pink" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#10b981", label: "Emerald" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ef4444", label: "Red" },
  { value: "#06b6d4", label: "Cyan" },
];

export function FoldersClient() {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderData | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [formLoading, setFormLoading] = useState(false);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/folders`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setFolders(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch folders:", error);
      toast.error("Failed to load folders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor("#6366f1");
  };

  const openEditDialog = (folder: FolderData) => {
    setEditingFolder(folder);
    setName(folder.name);
    setDescription(folder.description || "");
    setColor(folder.color);
  };

  const closeDialogs = () => {
    setCreateDialogOpen(false);
    setEditingFolder(null);
    resetForm();
  };

  const handleCreateFolder = async () => {
    if (!name.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description, color }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create folder");
      }

      toast.success("Folder created successfully");
      closeDialogs();
      fetchFolders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create folder");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !name.trim()) return;

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/folders/${editingFolder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description, color }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to update folder");
      }

      toast.success("Folder updated successfully");
      closeDialogs();
      fetchFolders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update folder");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this folder? Links will be moved out of the folder."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/folders/${folderId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to delete folder");
      }

      toast.success("Folder deleted successfully");
      fetchFolders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete folder");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Folders</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {["skeleton-1", "skeleton-2", "skeleton-3"].map((id) => (
            <Card key={id} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Folders</h1>
          <p className="text-muted-foreground">Organize your links into folders</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Folder</DialogTitle>
              <DialogDescription>Create a new folder to organize your links</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Campaign Links"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Links for the Q1 marketing campaign"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all",
                        color === c.value ? "border-foreground scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialogs}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={formLoading}>
                Create Folder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {folders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No folders yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-sm">
              Create folders to organize your links by project, campaign, or any way you like.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create your first folder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <Card key={folder.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${folder.color}20` }}
                    >
                      <Folder className="h-5 w-5" style={{ color: folder.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{folder.name}</CardTitle>
                      {folder.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {folder.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/links?folder=${folder.id}`}>
                          <Link2 className="h-4 w-4 mr-2" />
                          View Links
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(folder)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteFolder(folder.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-xs">
                  <Link2 className="h-3 w-3 mr-1" />
                  {folder.linkCount} {folder.linkCount === 1 ? "link" : "links"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editingFolder !== null} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>Update folder name, description, or color</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Campaign Links"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Links for the Q1 marketing campaign"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      color === c.value ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFolder} disabled={formLoading}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Key, AlertTriangle } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const createKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

type CreateKeyFormData = z.infer<typeof createKeySchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function ApiKeysClient() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateKeyFormData>({
    resolver: zodResolver(createKeySchema),
  });

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
      
      setCurrentOrgId(orgId);
      if (orgId) {
        fetchKeys(orgId);
      } else {
        setLoading(false);
      }
    }
    
    initializeOrg();
  }, []);

  async function fetchKeys(orgId: string) {
    try {
      const response = await fetch(`${API_URL}/api/v1/api-keys?organizationId=${orgId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setKeys(result.data.keys);
      }
    } catch (error) {
      console.error("Failed to fetch keys:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onCreateKey(data: CreateKeyFormData) {
    if (!currentOrgId) {
      toast.error("No organization selected");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          organizationId: currentOrgId,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Failed to create key");
      }

      setNewKey(result.data.key);
      setKeys((prev) => [
        {
          id: result.data.id,
          name: result.data.name,
          prefix: result.data.keyPrefix,
          lastUsedAt: null,
          expiresAt: result.data.expiresAt,
          createdAt: result.data.createdAt,
        },
        ...prev,
      ]);
      reset();
      toast.success("API key created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function deleteKey(id: string) {
    try {
      const response = await fetch(`${API_URL}/api/v1/api-keys/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setKeys((prev) => prev.filter((key) => key.id !== id));
        toast.success("API key deleted");
      } else {
        throw new Error("Failed to delete key");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete key");
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-6">
      {/* Create Key Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create API Key
          </Button>
        </DialogTrigger>
        <DialogContent>
          {newKey ? (
            <>
              <DialogHeader>
                <DialogTitle>API Key Created</DialogTitle>
                <DialogDescription>
                  Copy your API key now. You won't be able to see it again.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border bg-muted p-3">
                  <code className="flex-1 break-all text-sm">{newKey}</code>
                  <Button size="icon" variant="ghost" onClick={() => copyKey(newKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Store this key securely. It won't be shown again.</span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setNewKey(null);
                    setDialogOpen(false);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit(onCreateKey)}>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>Create a new API key for programmatic access.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production Server"
                  className="mt-2"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Key"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Keys are used to authenticate API requests. Keep them secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map((key) => (
                <Skeleton key={key} className="h-12 w-full" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Key className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No API keys</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create an API key to get started with the API.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-sm">{key.prefix}...</code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteKey(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

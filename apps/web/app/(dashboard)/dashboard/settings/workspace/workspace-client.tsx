"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: "owner" | "admin" | "member";
  createdAt?: string;
}

export function WorkspaceSettingsClient() {
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state — kept separate from `org` so we can detect dirty + reset.
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Delete-workspace dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrg() {
      try {
        const savedOrgId =
          typeof window !== "undefined" ? localStorage.getItem("selectedOrgId") : null;
        const res = await fetch(`${API_URL}/api/v1/organizations`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load organizations");
        const json = await res.json();
        const orgs = (json.data ?? []) as Organization[];
        const picked = orgs.find((o) => o.id === savedOrgId) ?? orgs[0];
        if (cancelled) return;
        if (!picked) {
          toast.error("No workspace found");
          setLoading(false);
          return;
        }
        setOrg(picked);
        setName(picked.name);
        setSlug(picked.slug);
        setLogoUrl(picked.logoUrl ?? "");
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchOrg();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!org) return;
    if (!name.trim()) {
      toast.error("Name can't be empty");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (name !== org.name) body.name = name.trim();
      if (slug !== org.slug) body.slug = slug.trim();
      if ((logoUrl || null) !== (org.logoUrl ?? null)) body.logoUrl = logoUrl.trim() || null;

      if (Object.keys(body).length === 0) {
        toast.success("Nothing to save");
        return;
      }

      const res = await fetch(`${API_URL}/api/v1/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Failed to save");
      const updated = json.data as Organization;
      setOrg({ ...org, ...updated });
      toast.success("Workspace saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!org) return;
    if (deleteConfirm !== org.slug) {
      toast.error(`Type "${org.slug}" to confirm`);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/organizations/${org.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message || "Failed to delete");
      }
      // Wipe local org selection so the next page doesn't try to use the
      // dead id.
      try {
        localStorage.removeItem("selectedOrgId");
      } catch {
        /* ignore */
      }
      toast.success("Workspace deleted");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!org) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No workspace to manage.
        </CardContent>
      </Card>
    );
  }

  const canEdit = org.role === "owner" || org.role === "admin";
  const canDelete = org.role === "owner";
  const dirty =
    name !== org.name || slug !== org.slug || (logoUrl || null) !== (org.logoUrl ?? null);

  return (
    <div className="space-y-6">
      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>How your workspace appears across go2.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar preview + logo url */}
          <div className="flex items-start gap-6">
            <Avatar className="h-16 w-16">
              {logoUrl && <AvatarImage src={logoUrl} alt={name} />}
              <AvatarFallback className="bg-primary/10 text-primary">
                {name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                disabled={!canEdit}
              />
              <p className="text-muted-foreground text-xs">
                Square PNG/SVG works best. File upload coming soon — paste a URL for now.
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Workspace slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              disabled={!canEdit}
            />
            <p className="text-muted-foreground text-xs">
              Lowercase letters, numbers, and hyphens. Used in invite + workspace URLs.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setName(org.name);
                setSlug(org.slug);
                setLogoUrl(org.logoUrl ?? "");
              }}
              disabled={!dirty || saving}
            >
              Reset
            </Button>
            <Button onClick={save} disabled={!dirty || saving || !canEdit}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger zone
          </CardTitle>
          <CardDescription>
            Deleting the workspace removes every link, gallery, QR code, and audit log it owns.
            Members get unlinked. This can&apos;t be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => {
              setDeleteConfirm("");
              setDeleteOpen(true);
            }}
            disabled={!canDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete workspace
          </Button>
          {!canDelete && (
            <p className="mt-2 text-muted-foreground text-xs">
              Only the workspace owner can delete this workspace.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{org.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              This permanently removes the workspace and all its data. Type{" "}
              <code className="rounded bg-muted px-1 font-mono">{org.slug}</code> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={org.slug}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || deleteConfirm !== org.slug}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

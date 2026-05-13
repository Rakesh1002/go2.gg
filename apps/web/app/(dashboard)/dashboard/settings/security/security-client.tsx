"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { Loader2, Shield, History, Download, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

type Provider = "saml" | "oidc" | "google_workspace" | "okta" | "azure_ad";
type DefaultRole = "viewer" | "member" | "admin";

interface SsoConfig {
  id: string;
  provider: Provider;
  enabled: boolean;
  ssoUrl: string;
  sloUrl: string | null;
  emailDomain: string | null;
  enforceSSO: boolean;
  autoProvision: boolean;
  defaultRole: DefaultRole;
  hasCertificate: boolean;
  hasOidcCredentials: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  actionLabel?: string;
  resourceType: string | null;
  resourceId: string | null;
  userId: string | null;
  user?: { id: string; email: string; name?: string | null } | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface ActionType {
  value: string;
  label: string;
  category: string;
}

export function SecurityClient() {
  return (
    <Tabs defaultValue="sso" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="sso" className="gap-2">
          <Shield className="h-4 w-4" /> SAML SSO
        </TabsTrigger>
        <TabsTrigger value="audit" className="gap-2">
          <History className="h-4 w-4" /> Audit log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sso" className="mt-6">
        <SsoPanel />
      </TabsContent>
      <TabsContent value="audit" className="mt-6">
        <AuditPanel />
      </TabsContent>
    </Tabs>
  );
}

// -----------------------------------------------------------------------------
// SSO Panel
// -----------------------------------------------------------------------------

function SsoPanel() {
  const [config, setConfig] = useState<SsoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    provider: "saml" as Provider,
    enabled: false,
    ssoUrl: "",
    sloUrl: "",
    emailDomain: "",
    certificate: "",
    enforceSSO: false,
    autoProvision: true,
    defaultRole: "member" as DefaultRole,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/sso/config`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { data: { config: SsoConfig | null } };
        if (cancelled) return;
        setConfig(json.data.config);
        if (json.data.config) {
          setForm((f) => ({
            ...f,
            provider: json.data.config!.provider,
            enabled: json.data.config!.enabled,
            ssoUrl: json.data.config!.ssoUrl,
            sloUrl: json.data.config!.sloUrl ?? "",
            emailDomain: json.data.config!.emailDomain ?? "",
            enforceSSO: json.data.config!.enforceSSO,
            autoProvision: json.data.config!.autoProvision,
            defaultRole: json.data.config!.defaultRole,
          }));
        }
      } catch (err) {
        toast.error("Couldn't load SSO config");
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        provider: form.provider,
        enabled: form.enabled,
        ssoUrl: form.ssoUrl,
        enforceSSO: form.enforceSSO,
        autoProvision: form.autoProvision,
        defaultRole: form.defaultRole,
      };
      if (form.sloUrl) body.sloUrl = form.sloUrl;
      if (form.emailDomain) body.emailDomain = form.emailDomain;
      if (form.certificate) body.certificate = form.certificate;

      const res = await fetch(`${API_URL}/api/v1/sso/config`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(err.error?.message ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { data: { config: SsoConfig } };
      setConfig(json.data.config);
      toast.success("SSO configuration saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>SAML / SSO</CardTitle>
              <CardDescription>
                Let your team log in with your identity provider. Once
                configured, users with email addresses on your verified
                domain are routed through your IdP automatically.
              </CardDescription>
            </div>
            {config?.enabled ? (
              <Badge className="shrink-0">Enabled</Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0">
                Disabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Service Provider info */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
            <div className="font-medium">Service Provider details</div>
            <p className="text-muted-foreground">
              Configure your IdP to send SAML assertions to:
            </p>
            <SpRow
              label="ACS URL"
              value={`${API_URL}/api/v1/sso/callback`}
            />
            <SpRow
              label="Entity ID"
              value={`https://go2.gg/sso/${config?.id ?? "<your-org>"}`}
            />
            <SpRow
              label="Metadata XML"
              value={`${API_URL}/api/v1/sso/metadata`}
              link
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provider">
              <Select
                value={form.provider}
                onValueChange={(v) => setForm({ ...form, provider: v as Provider })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saml">Generic SAML 2.0</SelectItem>
                  <SelectItem value="okta">Okta</SelectItem>
                  <SelectItem value="azure_ad">Azure AD / Entra</SelectItem>
                  <SelectItem value="google_workspace">
                    Google Workspace
                  </SelectItem>
                  <SelectItem value="oidc">OIDC</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Email domain">
              <Input
                placeholder="acme.com"
                value={form.emailDomain}
                onChange={(e) =>
                  setForm({ ...form, emailDomain: e.target.value })
                }
              />
            </Field>
          </div>

          <Field label="IdP SSO URL">
            <Input
              placeholder="https://idp.example.com/sso"
              value={form.ssoUrl}
              onChange={(e) => setForm({ ...form, ssoUrl: e.target.value })}
            />
          </Field>

          <Field label="IdP SLO URL (optional)">
            <Input
              placeholder="https://idp.example.com/slo"
              value={form.sloUrl}
              onChange={(e) => setForm({ ...form, sloUrl: e.target.value })}
            />
          </Field>

          <Field label="X.509 Certificate (PEM)">
            <textarea
              className="min-h-[140px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
              placeholder="-----BEGIN CERTIFICATE-----..."
              value={form.certificate}
              onChange={(e) =>
                setForm({ ...form, certificate: e.target.value })
              }
            />
            {config?.hasCertificate && !form.certificate && (
              <p className="mt-1 text-xs text-muted-foreground">
                A certificate is already on file. Paste a new one to rotate.
              </p>
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default role for new users">
              <Select
                value={form.defaultRole}
                onValueChange={(v) =>
                  setForm({ ...form, defaultRole: v as DefaultRole })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div />
          </div>

          <Toggle
            label="Auto-provision users"
            description="Create a Go2 account on first SSO login from a verified domain."
            checked={form.autoProvision}
            onChange={(v) => setForm({ ...form, autoProvision: v })}
          />
          <Toggle
            label="Enforce SSO"
            description="Block password and OAuth logins for users on the verified domain."
            checked={form.enforceSSO}
            onChange={(v) => setForm({ ...form, enforceSSO: v })}
          />
          <Toggle
            label="Enable SSO"
            description="Once enabled, affected users will be routed through your IdP."
            checked={form.enabled}
            onChange={(v) => setForm({ ...form, enabled: v })}
          />

          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Audit log panel
// -----------------------------------------------------------------------------

function AuditPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [actions, setActions] = useState<ActionType[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (actionFilter !== "all") params.set("action", actionFilter);

        const [logsRes, actionsRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/audit/logs?${params}`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/api/v1/audit/actions`, {
            credentials: "include",
          }),
        ]);
        if (cancelled) return;
        if (logsRes.ok) {
          const json = (await logsRes.json()) as {
            data: { logs: AuditLog[] };
          };
          setLogs(json.data.logs ?? []);
        }
        if (actionsRes.ok) {
          const json = (await actionsRes.json()) as {
            data: { actions: ActionType[] };
          };
          setActions(json.data.actions ?? []);
        }
      } catch (err) {
        toast.error("Couldn't load audit logs");
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [actionFilter]);

  async function exportCsv() {
    try {
      const res = await fetch(`${API_URL}/api/v1/audit/export`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Couldn't export audit log");
      console.error(err);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>Audit log</CardTitle>
            <CardDescription>
              Every privileged action your team takes — link mutations, role
              changes, SSO config edits, billing events.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No audit events yet — they'll appear here as your team uses Go2.
          </div>
        ) : (
          <div className="divide-y">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {log.actionLabel ?? log.action}
                    </code>
                    {log.resourceType && (
                      <span className="text-xs text-muted-foreground">
                        on {log.resourceType}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {log.user?.email ?? log.userId ?? "system"}
                    {log.ipAddress && ` · ${log.ipAddress}`}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Tiny helpers
// -----------------------------------------------------------------------------

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="space-y-0.5">
        <div className="font-medium text-sm">{label}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SpRow({
  label,
  value,
  link,
}: {
  label: string;
  value: string;
  link?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {link ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-primary hover:underline truncate max-w-[280px] sm:max-w-md"
          >
            {value}
            <ExternalLink className="ml-1 inline h-3 w-3" />
          </a>
        ) : (
          <code className="truncate max-w-[280px] sm:max-w-md">{value}</code>
        )}
        <CopyButton value={value} className="h-6 w-6" />
      </div>
    </div>
  );
}

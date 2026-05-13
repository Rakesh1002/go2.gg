"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Copy, DollarSign, Gift, Send, Users } from "lucide-react";
import { toast } from "sonner";

interface AffiliateMeResponse {
  isAffiliate: boolean;
  status: "pending" | "approved" | "rejected" | null;
  affiliate: {
    id: string;
    code: string;
    shareUrl: string;
    commissionRate: number;
    totalEarnings: number;
    paidEarnings: number;
    pendingEarnings: number;
    paypalEmail: string | null;
    createdAt: string;
  } | null;
  stats: {
    totalReferrals: number;
    paidReferrals: number;
    pendingReferrals: number;
  };
}

interface ReferralRow {
  id: string;
  user: { name: string | null; email: string | null } | null;
  commissionAmount: number | null;
  status: "pending" | "paid" | "cancelled";
  paidAt: string | null;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function AffiliatesClient() {
  const [me, setMe] = useState<AffiliateMeResponse | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [savingPayout, setSavingPayout] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadMe() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/affiliates/me`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load affiliate status");
      const body = await res.json();
      const data: AffiliateMeResponse = body.data;
      setMe(data);
      setPaypalEmail(data.affiliate?.paypalEmail ?? "");

      if (data.isAffiliate) {
        const refRes = await fetch(`${API_URL}/api/v1/affiliates/referrals`, {
          credentials: "include",
        });
        if (refRes.ok) {
          const refBody = await refRes.json();
          setReferrals(refBody.data?.referrals ?? []);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't load affiliate data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function handleApply() {
    setApplying(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/affiliates/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error?.message ?? "Failed to apply");
      }
      const body = await res.json();
      toast.success(body.data?.message ?? "You're in!");
      await loadMe();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Apply failed");
    } finally {
      setApplying(false);
    }
  }

  async function handleSavePayout() {
    if (!paypalEmail.trim()) {
      toast.error("Enter a PayPal email");
      return;
    }
    setSavingPayout(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/affiliates/payout-info`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paypalEmail: paypalEmail.trim() }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Payout email saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingPayout(false);
    }
  }

  async function handleCopy() {
    if (!me?.affiliate?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(me.affiliate.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — copy manually");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  // Not enrolled — show pitch + apply CTA.
  if (!me?.isAffiliate) {
    return (
      <div className="space-y-6">
        <header>
          <h2 className="font-bold text-2xl tracking-tight">Affiliate program</h2>
          <p className="text-muted-foreground">
            Earn 40% recurring commission for every customer you refer to Go2.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              How it works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Step n={1} title="Apply">
              Click the button below. You're approved instantly.
            </Step>
            <Step n={2} title="Share your link">
              You get a personal <code className="rounded bg-muted px-1">go2.gg/r/CODE</code> link.
              Anyone who signs up through it is attributed to you for 30 days.
            </Step>
            <Step n={3} title="Earn 40% recurring">
              Every time a referred customer's invoice is paid, 40% of it lands in your pending
              balance — for the lifetime of their subscription.
            </Step>
            <Step n={4} title="Get paid">
              Add your PayPal email and we'll send your earnings on the 1st of each month for
              balances over $50.
            </Step>
          </CardContent>
        </Card>

        <Button size="lg" onClick={handleApply} disabled={applying}>
          {applying ? "Joining…" : "Join the program"}
        </Button>
      </div>
    );
  }

  const aff = me.affiliate!;
  const isPending = me.status === "pending";

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-bold text-2xl tracking-tight">Affiliate program</h2>
        <p className="text-muted-foreground">
          {isPending
            ? "Application under review — we'll email when approved."
            : `Earning ${Math.round(aff.commissionRate * 100)}% recurring on every referred invoice.`}
        </p>
      </header>

      {/* Share link */}
      {!isPending && (
        <Card>
          <CardHeader>
            <CardTitle>Your share link</CardTitle>
            <CardDescription>
              Paste this anywhere. Cookie attribution lasts 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={aff.shareUrl} readOnly className="font-mono text-sm" />
              <Button variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
            <p className="mt-2 text-muted-foreground text-xs">
              Code: <span className="font-mono">{aff.code}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          label="Total referrals"
          value={me.stats.totalReferrals.toString()}
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          label="Pending earnings"
          value={`$${aff.pendingEarnings.toFixed(2)}`}
          sub="Awaiting next payout"
        />
        <StatCard
          icon={<Send className="h-4 w-4 text-muted-foreground" />}
          label="Paid out"
          value={`$${aff.paidEarnings.toFixed(2)}`}
          sub={`Lifetime total $${aff.totalEarnings.toFixed(2)}`}
        />
      </div>

      {/* Payout info */}
      <Card>
        <CardHeader>
          <CardTitle>Payout info</CardTitle>
          <CardDescription>
            We send earnings via PayPal on the 1st of each month for balances over $50.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex max-w-md flex-col gap-3">
            <Label htmlFor="paypal">PayPal email</Label>
            <Input
              id="paypal"
              type="email"
              placeholder="you@example.com"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
            />
            <Button onClick={handleSavePayout} disabled={savingPayout} className="w-fit">
              {savingPayout ? "Saving…" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referrals table */}
      <Card>
        <CardHeader>
          <CardTitle>Referrals</CardTitle>
          <CardDescription>The people who signed up through your link.</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No referrals yet. Share your link to get your first one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-muted-foreground/20 border-b">
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground text-xs">
                      User
                    </th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground text-xs">
                      Status
                    </th>
                    <th className="px-2 py-2 text-right font-medium text-muted-foreground text-xs">
                      Commission
                    </th>
                    <th className="px-2 py-2 text-right font-medium text-muted-foreground text-xs">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r.id} className="border-muted/40 border-b last:border-0">
                      <td className="px-2 py-2">
                        <div className="font-medium">{r.user?.name ?? "Pending signup"}</div>
                        <div className="text-muted-foreground text-xs">{r.user?.email ?? "—"}</div>
                      </td>
                      <td className="px-2 py-2">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {r.commissionAmount != null
                          ? `$${r.commissionAmount.toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-2 py-2 text-right text-muted-foreground text-xs">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm">
        {n}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">{value}</div>
        {sub ? <p className="text-muted-foreground text-xs">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: ReferralRow["status"] }) {
  if (status === "paid") {
    return <Badge className="bg-green-500/10 text-green-600">Paid</Badge>;
  }
  if (status === "cancelled") {
    return <Badge variant="outline">Cancelled</Badge>;
  }
  return <Badge variant="secondary">Pending</Badge>;
}

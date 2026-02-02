"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DollarSign,
  Users,
  TrendingUp,
  Copy,
  ExternalLink,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { siteConfig } from "@repo/config";

interface AffiliateData {
  id: string;
  code: string;
  commissionRate: number;
  totalEarnings: number;
  paidEarnings: number;
  pendingEarnings: number;
  paypalEmail: string | null;
  createdAt: string;
}

interface AffiliateStats {
  totalReferrals: number;
  paidReferrals: number;
  pendingReferrals: number;
}

interface Referral {
  id: string;
  user: { name: string | null; email: string | null } | null;
  commissionAmount: number | null;
  status: "pending" | "paid" | "cancelled";
  paidAt: string | null;
  createdAt: string;
}

interface AffiliateResponse {
  isAffiliate: boolean;
  status: "pending" | "approved" | "rejected" | null;
  affiliate: AffiliateData | null;
  stats: AffiliateStats | null;
}

export function AffiliateDashboard() {
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AffiliateResponse | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`${apiUrl}/api/v1/affiliates/me`, {
          credentials: "include",
        });
        if (response.ok) {
          const result = await response.json();
          setData(result.data);
          if (result.data?.affiliate?.paypalEmail) {
            setPaypalEmail(result.data.affiliate.paypalEmail);
          }
          // Fetch referrals if approved affiliate
          if (result.data?.status === "approved") {
            const referralsRes = await fetch(`${apiUrl}/api/v1/affiliates/referrals`, {
              credentials: "include",
            });
            if (referralsRes.ok) {
              const referralsResult = await referralsRes.json();
              setReferrals(referralsResult.data?.referrals || []);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch affiliate data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [apiUrl]);

  async function fetchAffiliateData() {
    try {
      const response = await fetch(`${apiUrl}/api/v1/affiliates/me`, {
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        if (result.data?.affiliate?.paypalEmail) {
          setPaypalEmail(result.data.affiliate.paypalEmail);
        }
        // Fetch referrals if approved affiliate
        if (result.data?.status === "approved") {
          const referralsRes = await fetch(`${apiUrl}/api/v1/affiliates/referrals`, {
            credentials: "include",
          });
          if (referralsRes.ok) {
            const referralsResult = await referralsRes.json();
            setReferrals(referralsResult.data?.referrals || []);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch affiliate data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    setApplying(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/affiliates/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        toast.success("Affiliate application submitted!");
        fetchAffiliateData();
      } else {
        const error = await response.json();
        toast.error(error.error?.message || "Failed to submit application");
      }
    } catch {
      toast.error("Failed to submit application");
    } finally {
      setApplying(false);
    }
  }

  async function handleUpdatePayout() {
    if (!paypalEmail) return;
    setSaving(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/affiliates/payout-info`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paypalEmail }),
      });
      if (response.ok) {
        toast.success("Payout information updated!");
        setShowPayoutDialog(false);
        fetchAffiliateData();
      } else {
        toast.error("Failed to update payout information");
      }
    } catch {
      toast.error("Failed to update payout information");
    } finally {
      setSaving(false);
    }
  }

  const copyLink = () => {
    if (data?.affiliate?.code) {
      const link = `${siteConfig.url}?ref=${data.affiliate.code}`;
      navigator.clipboard.writeText(link);
      toast.success("Affiliate link copied to clipboard!");
    }
  };

  if (loading) {
    return <AffiliateSkeleton />;
  }

  // Not an affiliate yet - show apply CTA
  if (!data?.isAffiliate) {
    return <ApplySection onApply={handleApply} applying={applying} />;
  }

  // Application pending
  if (data.status === "pending") {
    return <PendingSection createdAt={data.affiliate?.createdAt} />;
  }

  // Application rejected
  if (data.status === "rejected") {
    return <RejectedSection />;
  }

  // Approved affiliate - show dashboard
  // At this point we know affiliate and stats exist since status is "approved"
  const affiliate = data.affiliate;
  const stats = data.stats;

  if (!affiliate || !stats) {
    return null; // Safety check - should never happen
  }

  const affiliateLink = `${siteConfig.url}?ref=${affiliate.code}`;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${affiliate.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-green-600">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${affiliate.pendingEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Next payout</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.paidReferrals} paid, {stats.pendingReferrals} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Commission Rate
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(affiliate.commissionRate * 100)}%</div>
            <p className="text-xs text-muted-foreground">Per conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Affiliate Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Affiliate Link</CardTitle>
          <CardDescription>
            Share this link to earn {Math.round(affiliate.commissionRate * 100)}% commission on
            every sale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={affiliateLink} readOnly className="font-mono" />
            <Button onClick={copyLink} variant="outline" className="gap-2">
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button variant="outline" asChild>
              <a
                href={affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                title="Open affiliate link"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">Open affiliate link in new tab</span>
              </a>
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your code: <span className="font-mono font-medium">{affiliate.code}</span>
          </p>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
          <CardDescription>Your most recent conversions and earnings.</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {referral.user?.email || "—"}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {referral.commissionAmount
                        ? `+$${referral.commissionAmount.toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          referral.status === "paid"
                            ? "default"
                            : referral.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {referral.status === "paid"
                          ? "Paid"
                          : referral.status === "cancelled"
                            ? "Cancelled"
                            : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No referrals yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Share your link to start earning!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Settings</CardTitle>
          <CardDescription>Configure how you want to receive your earnings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">PayPal</p>
                <p className="text-sm text-muted-foreground">
                  {affiliate.paypalEmail || "Not configured"}
                </p>
              </div>
              <Badge variant={affiliate.paypalEmail ? "default" : "secondary"}>
                {affiliate.paypalEmail ? "Active" : "Not set"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Payouts are processed on the 1st of each month. Minimum payout: $50.
            </p>
            <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">Update Payout Method</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Payout Information</DialogTitle>
                  <DialogDescription>
                    Enter your PayPal email to receive affiliate payouts.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="paypal">PayPal Email</Label>
                    <Input
                      id="paypal"
                      type="email"
                      placeholder="your@email.com"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdatePayout} disabled={!paypalEmail || saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApplySection({ onApply, applying }: { onApply: () => void; applying: boolean }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Join Our Affiliate Program</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Earn 40% commission on every sale you refer. Share your unique link and start earning
          passive income today.
        </p>
        <div className="grid gap-4 text-left max-w-sm mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">40% Commission</p>
              <p className="text-sm text-muted-foreground">Earn on every paid subscription</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Monthly Payouts</p>
              <p className="text-sm text-muted-foreground">Get paid on the 1st of each month</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Real-time Tracking</p>
              <p className="text-sm text-muted-foreground">Monitor clicks and conversions</p>
            </div>
          </div>
        </div>
        <Button size="lg" onClick={onApply} disabled={applying}>
          {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Apply to Become an Affiliate
        </Button>
      </CardContent>
    </Card>
  );
}

function PendingSection({ createdAt }: { createdAt?: string }) {
  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-amber-100 p-4 mb-4 dark:bg-amber-900">
          <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Application Under Review</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          Your affiliate application is being reviewed. We'll notify you by email once it's
          approved.
        </p>
        {createdAt && (
          <p className="text-sm text-muted-foreground">
            Applied on {new Date(createdAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RejectedSection() {
  return (
    <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-red-100 p-4 mb-4 dark:bg-red-900">
          <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Application Not Approved</h3>
        <p className="text-muted-foreground max-w-md">
          Unfortunately, your affiliate application was not approved at this time. If you believe
          this was a mistake, please contact support.
        </p>
      </CardContent>
    </Card>
  );
}

function AffiliateSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["s1", "s2", "s3", "s4"].map((id) => (
          <Card key={id}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

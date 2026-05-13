"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface PayoutRow {
  id: string;
  userId: string;
  code: string;
  paypalEmail: string | null;
  pendingEarnings: number;
  paidEarnings: number;
  totalEarnings: number;
  ownerEmail: string | null;
  ownerName: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function AffiliatePayoutsClient() {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/affiliates/admin/payouts`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load payouts");
      const body = await res.json();
      setRows(body.data?.rows ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkPaid(row: PayoutRow) {
    if (!row.paypalEmail) {
      toast.error("No PayPal email on file — affiliate must add one first.");
      return;
    }
    if (
      !window.confirm(
        `Mark $${row.pendingEarnings.toFixed(2)} as paid to ${row.paypalEmail}?\n\nMake sure you've actually sent the money via PayPal Mass Payouts before confirming.`,
      )
    ) {
      return;
    }
    setMarking(row.id);
    try {
      const res = await fetch(`${API_URL}/api/v1/affiliates/admin/${row.id}/mark-paid`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: row.pendingEarnings }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Mark-paid failed");
      }
      toast.success("Payout recorded.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mark-paid failed");
    } finally {
      setMarking(null);
    }
  }

  const totalPending = rows.reduce((acc, r) => acc + r.pendingEarnings, 0);
  const payable = rows.filter((r) => r.paypalEmail);

  function downloadPaypalCsv() {
    // PayPal Mass Payouts CSV format:
    //   email_address,amount,currency_code,reference_id,note
    // Reference: https://developer.paypal.com/docs/payouts/standard/integrate/mass-pay/
    const header = ["email_address", "amount", "currency_code", "reference_id", "note"];
    const lines = [header.join(",")];
    for (const row of payable) {
      const note = `Go2 affiliate payout — ${row.code}`;
      const reference = `aff_${row.id.slice(0, 12)}`;
      lines.push(
        [
          row.paypalEmail,
          row.pendingEarnings.toFixed(2),
          "USD",
          reference,
          // Wrap note in quotes since it contains spaces
          `"${note.replace(/"/g, '""')}"`,
        ].join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `paypal-payouts-${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-bold text-2xl tracking-tight">Affiliate payouts</h1>
        <p className="text-muted-foreground">
          Affiliates with pending earnings. Download the PayPal Mass Payouts CSV, upload it at
          paypal.com → Send & Request → Send Money to Many People at Once, then come back and
          mark each row paid here.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pending: ${totalPending.toFixed(2)}</CardTitle>
            <CardDescription>
              {rows.length} affiliate{rows.length === 1 ? "" : "s"} owed.
              {rows.length > payable.length
                ? ` ${rows.length - payable.length} missing PayPal email.`
                : ""}
            </CardDescription>
          </div>
          {payable.length > 0 ? (
            <Button variant="outline" onClick={downloadPaypalCsv}>
              Download CSV ({payable.length})
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No pending payouts. Nice and clean.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-muted-foreground/20 border-b">
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground text-xs">
                      Affiliate
                    </th>
                    <th className="px-2 py-2 text-left font-medium text-muted-foreground text-xs">
                      PayPal
                    </th>
                    <th className="px-2 py-2 text-right font-medium text-muted-foreground text-xs">
                      Pending
                    </th>
                    <th className="px-2 py-2 text-right font-medium text-muted-foreground text-xs">
                      Lifetime
                    </th>
                    <th className="px-2 py-2 text-right font-medium text-muted-foreground text-xs">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-muted/40 border-b last:border-0">
                      <td className="px-2 py-2">
                        <div className="font-medium">{r.ownerName ?? r.ownerEmail ?? r.code}</div>
                        <div className="text-muted-foreground text-xs">
                          {r.ownerEmail} · <span className="font-mono">{r.code}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        {r.paypalEmail ? (
                          <span className="font-mono text-xs">{r.paypalEmail}</span>
                        ) : (
                          <span className="text-destructive text-xs">missing</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right font-semibold tabular-nums">
                        ${r.pendingEarnings.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right text-muted-foreground tabular-nums">
                        ${r.totalEarnings.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!r.paypalEmail || marking === r.id}
                          onClick={() => handleMarkPaid(r)}
                        >
                          {marking === r.id ? "Marking…" : "Mark paid"}
                        </Button>
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

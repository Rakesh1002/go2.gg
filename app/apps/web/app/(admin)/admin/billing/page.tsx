import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign, Users, CreditCard, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Billing & Revenue - Admin",
  description: "Revenue analytics and billing overview",
};

// Demo revenue data
const revenueStats = [
  {
    title: "Monthly Recurring Revenue",
    value: "$45,231",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
  },
  {
    title: "Annual Recurring Revenue",
    value: "$542,772",
    change: "+15.2%",
    trend: "up" as const,
    icon: TrendingUp,
  },
  {
    title: "Active Subscriptions",
    value: "187",
    change: "+8",
    trend: "up" as const,
    icon: Users,
  },
  {
    title: "Churn Rate",
    value: "2.3%",
    change: "-0.5%",
    trend: "down" as const,
    icon: RefreshCw,
  },
];

const planBreakdown = [
  { plan: "Enterprise", subscribers: 23, mrr: 6877, percentage: 15.2 },
  { plan: "Pro", subscribers: 89, mrr: 4361, percentage: 9.6 },
  { plan: "Starter", subscribers: 156, mrr: 2964, percentage: 6.6 },
  { plan: "Free", subscribers: 1243, mrr: 0, percentage: 0 },
];

const recentTransactions = [
  {
    id: "txn_1",
    customer: "Acme Inc.",
    email: "billing@acme.com",
    amount: 299,
    type: "subscription",
    status: "succeeded",
    date: "2024-01-20T14:30:00Z",
  },
  {
    id: "txn_2",
    customer: "TechCorp",
    email: "admin@techcorp.io",
    amount: 49,
    type: "subscription",
    status: "succeeded",
    date: "2024-01-20T12:15:00Z",
  },
  {
    id: "txn_3",
    customer: "StartupXYZ",
    email: "founder@startupxyz.com",
    amount: 19,
    type: "upgrade",
    status: "succeeded",
    date: "2024-01-20T10:45:00Z",
  },
  {
    id: "txn_4",
    customer: "FailedCo",
    email: "billing@failed.com",
    amount: 99,
    type: "subscription",
    status: "failed",
    date: "2024-01-19T18:20:00Z",
  },
  {
    id: "txn_5",
    customer: "RefundMe LLC",
    email: "support@refundme.com",
    amount: -149,
    type: "refund",
    status: "refunded",
    date: "2024-01-19T15:00:00Z",
  },
];

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Revenue</h1>
        <p className="text-muted-foreground">
          Monitor revenue, subscriptions, and billing activity.
        </p>
      </div>

      {/* Revenue Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {revenueStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p
                className={`flex items-center gap-1 text-xs ${
                  stat.trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>% of Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planBreakdown.map((plan) => (
                <TableRow key={plan.plan}>
                  <TableCell>
                    <Badge
                      variant={
                        plan.plan === "Enterprise"
                          ? "default"
                          : plan.plan === "Pro"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {plan.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>{plan.subscribers.toLocaleString()}</TableCell>
                  <TableCell>${plan.mrr.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${Math.min(plan.percentage * 2, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{plan.percentage}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{txn.customer}</div>
                      <div className="text-sm text-muted-foreground">{txn.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className={txn.amount < 0 ? "text-red-600" : "text-green-600"}>
                    {txn.amount < 0 ? "-" : "+"}${Math.abs(txn.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        txn.status === "succeeded"
                          ? "default"
                          : txn.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(txn.date).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

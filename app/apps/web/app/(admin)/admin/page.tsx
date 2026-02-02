import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, CreditCard, Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Overview",
  description: "Platform overview and statistics",
};

// Demo stats - in production these would come from the database
const stats = [
  {
    title: "Total Users",
    value: "2,543",
    change: "+12%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Organizations",
    value: "187",
    change: "+8%",
    changeType: "positive" as const,
    icon: Building2,
  },
  {
    title: "Monthly Revenue",
    value: "$45,231",
    change: "+23%",
    changeType: "positive" as const,
    icon: CreditCard,
  },
  {
    title: "Active Sessions",
    value: "342",
    change: "-3%",
    changeType: "negative" as const,
    icon: Activity,
  },
];

const recentActivity = [
  { type: "user", action: "New user registered", email: "john@example.com", time: "2 min ago" },
  { type: "org", action: "Organization created", name: "Acme Inc.", time: "15 min ago" },
  {
    type: "billing",
    action: "Subscription upgraded",
    plan: "Pro → Enterprise",
    time: "1 hour ago",
  },
  { type: "user", action: "User banned", email: "spam@example.com", time: "2 hours ago" },
  { type: "org", action: "Member invited", org: "TechCorp", time: "3 hours ago" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management tools.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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
                className={`text-xs ${
                  stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.email || activity.name || activity.plan || activity.org}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-semibold">Manage Users</h3>
              <p className="text-sm text-muted-foreground">View, edit, and ban users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-semibold">Manage Organizations</h3>
              <p className="text-sm text-muted-foreground">View and manage organizations</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <CreditCard className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-semibold">Revenue Analytics</h3>
              <p className="text-sm text-muted-foreground">View billing and revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

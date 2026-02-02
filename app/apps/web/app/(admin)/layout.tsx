import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUser } from "@/lib/auth/server";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Settings,
  ArrowLeft,
  Shield,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Super Admin dashboard for managing the platform",
};

const adminNav = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Organizations", href: "/admin/orgs", icon: Building2 },
  { title: "Billing", href: "/admin/billing", icon: CreditCard },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is admin (check for admin emails)
  const adminEmails = process.env["ADMIN_EMAILS"]?.split(",") || [];
  const isAdmin = adminEmails.includes(user.email || "");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-card lg:block">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold">Admin Panel</span>
        </div>
        <nav className="space-y-1 p-4">
          {adminNav.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <item.icon className="h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/dashboard">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:pl-64">
        <div className="container py-8">{children}</div>
      </main>
    </div>
  );
}

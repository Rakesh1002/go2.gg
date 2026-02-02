import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const codeExamples = {
  auth: `// Server Component - Protected Page
import { getServerUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getServerUser();
  
  if (!user) {
    redirect("/login");
  }
  
  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
      {/* Your dashboard content */}
    </div>
  );
}`,
  payments: `// Create Stripe Checkout Session
import { stripe } from "@repo/payments";

export async function createCheckout(userId: string, priceId: string) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: \`\${APP_URL}/dashboard?success=true\`,
    cancel_url: \`\${APP_URL}/pricing\`,
    metadata: { userId },
  });
  
  return session.url;
}`,
  api: `// Hono API Route with Validation
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono();

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post("/users", zValidator("json", schema), async (c) => {
  const data = c.req.valid("json");
  const user = await createUser(data);
  return c.json({ success: true, user });
});`,
  config: `// Site Configuration - packages/config/src/site.ts
export const siteConfig = {
  name: "YourSaaS",
  tagline: "Your amazing tagline",
  description: "Full product description for SEO",
  url: "https://yoursaas.com",
  
  // Social links
  links: {
    twitter: "https://twitter.com/yoursaas",
    github: "https://github.com/yoursaas",
  },
  
  // Customize everything via config!
};`,
};

export function CodePreview() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8 bg-[var(--marketing-bg)]">
      <div className="mx-auto max-w-2xl text-center">
        <Badge
          variant="outline"
          className="mb-4 border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5"
        >
          <span className="text-[var(--marketing-text)]">Developer Experience</span>
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight text-[var(--marketing-text)] md:text-4xl">
          Clean, Readable Code
        </h2>
        <p className="mt-4 text-[var(--marketing-text-muted)]">
          Well-organized, typed, and documented. Ready to customize for your needs.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-4xl">
        <Tabs defaultValue="auth" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="api">API Routes</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          {Object.entries(codeExamples).map(([key, code]) => (
            <TabsContent key={key} value={key} className="mt-4">
              <div className="overflow-hidden rounded-lg border border-code-border bg-code-bg">
                <div className="flex items-center gap-2 border-b border-code-border px-4 py-2">
                  <div className="h-3 w-3 rounded-full bg-chrome-red" />
                  <div className="h-3 w-3 rounded-full bg-chrome-yellow" />
                  <div className="h-3 w-3 rounded-full bg-chrome-green" />
                  <span className="ml-2 text-xs text-code-text/60">
                    {key === "auth" && "app/(dashboard)/page.tsx"}
                    {key === "payments" && "lib/payments.ts"}
                    {key === "api" && "apps/api/src/routes/users.ts"}
                    {key === "config" && "packages/config/src/site.ts"}
                  </span>
                </div>
                <pre className="overflow-x-auto p-4 text-sm">
                  <code className="text-code-text">{code}</code>
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

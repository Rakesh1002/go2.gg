import { Badge } from "@/components/ui/badge";

const techStack = [
  {
    category: "Frontend",
    items: [
      { name: "Next.js 16", description: "App Router, RSC" },
      { name: "React 19", description: "Latest features" },
      { name: "TypeScript", description: "Strict mode" },
      { name: "Tailwind v4", description: "Modern CSS" },
      { name: "shadcn/ui", description: "Components" },
    ],
  },
  {
    category: "Backend",
    items: [
      { name: "Hono", description: "Fast API framework" },
      { name: "Cloudflare Workers", description: "Edge runtime" },
      { name: "Drizzle ORM", description: "Type-safe DB" },
      { name: "Zod", description: "Validation" },
      { name: "OpenAPI", description: "Auto docs" },
    ],
  },
  {
    category: "Services",
    items: [
      { name: "Supabase", description: "Auth & DB" },
      { name: "Stripe", description: "Payments" },
      { name: "React Email", description: "Templates" },
      { name: "PostHog", description: "Analytics" },
      { name: "Sentry", description: "Errors" },
    ],
  },
  {
    category: "Infrastructure",
    items: [
      { name: "Cloudflare D1", description: "SQLite DB" },
      { name: "Cloudflare KV", description: "Key-value" },
      { name: "Cloudflare R2", description: "Object storage" },
      { name: "OpenNext", description: "CF adapter" },
      { name: "Wrangler", description: "CLI" },
    ],
  },
];

export function TechStackSection() {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            Tech Stack
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Built on Modern Technologies
          </h2>
          <p className="mt-4 text-muted-foreground">
            Carefully chosen stack optimized for developer experience and production performance.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {techStack.map((category) => (
            <div key={category.category}>
              <h3 className="mb-4 font-semibold">{category.category}</h3>
              <ul className="space-y-3">
                {category.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

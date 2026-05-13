interface Step {
  step: number;
  title: string;
  description: string;
}

interface HowItWorksProps {
  headline?: string;
  subheadline?: string;
  steps?: Step[];
}

const defaultSteps: Step[] = [
  {
    step: 1,
    title: "Clone & Install",
    description:
      "Clone the repository and run pnpm install. All dependencies are configured and ready to go.",
  },
  {
    step: 2,
    title: "Configure Services",
    description:
      "Add your Supabase, Stripe, and Cloudflare credentials. We provide detailed setup guides.",
  },
  {
    step: 3,
    title: "Customize Branding",
    description:
      "Update the config files with your product name, pricing, and features. No code changes needed.",
  },
  {
    step: 4,
    title: "Deploy & Launch",
    description:
      "Deploy to Cloudflare with one command. Your SaaS is live and ready for customers.",
  },
];

export function HowItWorks({
  headline = "Launch in 4 simple steps",
  subheadline = "From zero to production-ready SaaS in hours, not months.",
  steps = defaultSteps,
}: HowItWorksProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-bold text-3xl tracking-tight md:text-4xl">{headline}</h2>
        <p className="mt-4 text-lg text-muted-foreground">{subheadline}</p>
      </div>

      <div className="mx-auto mt-16 max-w-4xl">
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-0 left-8 hidden h-full w-0.5 bg-border md:block" />

          <div className="space-y-12">
            {steps.map((item, index) => (
              <div key={item.step} className="relative flex gap-6">
                {/* Step number */}
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-background bg-primary font-bold text-primary-foreground text-xl">
                  {item.step}
                </div>

                {/* Content */}
                <div className="pt-3">
                  <h3 className="font-semibold text-xl">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Testimonials Configuration
 *
 * Customer testimonials for social proof on landing page.
 */

export interface Testimonial {
  /** Unique ID */
  id: string;
  /** Customer name */
  name: string;
  /** Customer role/title */
  role: string;
  /** Company name */
  company: string;
  /** Company logo URL (optional) */
  avatar?: string;
  /** Testimonial quote */
  quote: string;
  /** Rating out of 5 (optional) */
  rating?: number;
  /** Featured testimonial (shown prominently) */
  featured?: boolean;
}

export const testimonialsConfig = {
  /** Headline for testimonials section */
  headline: "Loved by developers worldwide",
  /** Subheadline */
  subheadline: "See what our customers are saying about their experience.",
};

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Founder & CEO",
    company: "TechStart",
    avatar: "/testimonials/sarah.jpg",
    quote:
      "We launched our SaaS in just 2 weeks instead of 3 months. The authentication and payments were already set up perfectly. This saved us thousands in development costs.",
    rating: 5,
    featured: true,
  },
  {
    id: "2",
    name: "Marcus Johnson",
    role: "Lead Developer",
    company: "DevFlow",
    avatar: "/testimonials/marcus.jpg",
    quote:
      "The code quality is exceptional. TypeScript strict mode, proper error handling, and a clean architecture. It's exactly how I would have built it myself, but in a fraction of the time.",
    rating: 5,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "CTO",
    company: "ScaleUp",
    avatar: "/testimonials/emily.jpg",
    quote:
      "We've tried other boilerplates before, but this one is on another level. The edge deployment with Cloudflare Workers gives us incredible performance globally.",
    rating: 5,
    featured: true,
  },
  {
    id: "4",
    name: "David Park",
    role: "Solo Founder",
    company: "IndieHacker",
    avatar: "/testimonials/david.jpg",
    quote:
      "As a solo founder, I don't have time to set up auth, payments, and emails from scratch. This boilerplate let me focus on what matters - my product.",
    rating: 5,
  },
  {
    id: "5",
    name: "Lisa Thompson",
    role: "Engineering Manager",
    company: "GrowthCo",
    avatar: "/testimonials/lisa.jpg",
    quote:
      "The documentation is comprehensive and the code is well-commented. Onboarding new developers to our project has been incredibly smooth.",
    rating: 5,
  },
  {
    id: "6",
    name: "Alex Kim",
    role: "Freelance Developer",
    company: "Self-employed",
    avatar: "/testimonials/alex.jpg",
    quote:
      "I use this for all my client projects now. It's become my secret weapon for delivering high-quality SaaS products quickly.",
    rating: 5,
  },
];

/**
 * Get featured testimonials
 */
export function getFeaturedTestimonials(): Testimonial[] {
  return testimonials.filter((t) => t.featured);
}

/**
 * Logo cloud companies (for social proof)
 */
export const logoCloudCompanies = [
  { name: "Vercel", logo: "/logos/vercel.svg" },
  { name: "Stripe", logo: "/logos/stripe.svg" },
  { name: "Cloudflare", logo: "/logos/cloudflare.svg" },
  { name: "Supabase", logo: "/logos/supabase.svg" },
  { name: "PostHog", logo: "/logos/posthog.svg" },
  { name: "Resend", logo: "/logos/resend.svg" },
];

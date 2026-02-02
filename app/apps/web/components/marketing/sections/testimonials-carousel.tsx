"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Founder",
    company: "IndieSaaS",
    avatar: "A",
    quote:
      "Shipped my MVP in 3 days instead of 3 months. The auth and payments were already set up perfectly. This is exactly what I was looking for.",
    rating: 5,
  },
  {
    name: "Sarah Miller",
    role: "Senior Developer",
    company: "TechCorp",
    avatar: "S",
    quote:
      "The code quality is exceptional. TypeScript strict mode, proper error handling, clean architecture. It's how I would have built it myself.",
    rating: 5,
  },
  {
    name: "Mike Johnson",
    role: "CTO",
    company: "StartupX",
    avatar: "M",
    quote:
      "We've evaluated 5+ boilerplates. ShipQuest is the only one that's truly production-ready. The Cloudflare edge deployment is a game-changer.",
    rating: 5,
  },
  {
    name: "Emily Zhang",
    role: "Solo Founder",
    company: "SideProject",
    avatar: "E",
    quote:
      "As a solo founder, I needed something I could trust. The documentation is amazing and the Discord community is super helpful.",
    rating: 5,
  },
  {
    name: "David Park",
    role: "Tech Lead",
    company: "AgencyPro",
    avatar: "D",
    quote:
      "We use ShipQuest for all client projects now. It's become our secret weapon for delivering high-quality SaaS products quickly.",
    rating: 5,
  },
  {
    name: "Lisa Thompson",
    role: "Freelancer",
    company: "Self-employed",
    avatar: "L",
    quote:
      "The ROI is incredible. Paid for itself on the first project. Now I can take on more clients without the boilerplate overhead.",
    rating: 5,
  },
];

export function TestimonialsCarousel() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="outline" className="mb-4">
          Testimonials
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Loved by Developers</h2>
        <p className="mt-4 text-muted-foreground">
          See what developers are saying about ShipQuest.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="relative">
            <CardContent className="pt-6">
              {/* Quote Icon */}
              <Quote className="absolute right-4 top-4 h-8 w-8 text-muted-foreground/20" />

              {/* Rating */}
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={`star-${index}-${i}`}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-muted-foreground">"{testimonial.quote}"</blockquote>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

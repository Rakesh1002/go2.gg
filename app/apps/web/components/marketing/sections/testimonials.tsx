"use client";

import { motion } from "framer-motion";
import { testimonialsConfig, testimonials, type Testimonial } from "@repo/config";
import { Star, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TestimonialsProps {
  headline?: string;
  subheadline?: string;
  items?: Testimonial[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  },
};

export function Testimonials({
  headline = testimonialsConfig.headline,
  subheadline = testimonialsConfig.subheadline,
  items = testimonials,
}: TestimonialsProps) {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8 bg-[var(--marketing-bg)]">
      {/* Background decoration */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[var(--marketing-accent)]/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-2xl text-center"
      >
        <Badge
          variant="outline"
          className="mb-4 border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5"
        >
          <Star className="mr-1.5 h-3 w-3 fill-rating-star text-rating-star" />
          <span className="text-[var(--marketing-text)]">Testimonials</span>
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight text-[var(--marketing-text)] md:text-4xl lg:text-5xl">
          {headline}
        </h2>
        <p className="mt-4 text-lg text-[var(--marketing-text-muted)]">{subheadline}</p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="relative mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            variants={itemVariants}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--marketing-accent)]/5 hover:-translate-y-1"
          >
            {/* Quote icon */}
            <Quote className="absolute right-4 top-4 h-8 w-8 text-[var(--marketing-accent)]/10 transition-colors group-hover:text-[var(--marketing-accent)]/20" />

            {/* Rating */}
            {testimonial.rating && (
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <motion.div
                    key={`star-${testimonial.id}-${i}`}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <Star className="h-4 w-4 fill-rating-star text-rating-star" />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Quote */}
            <blockquote className="flex-1 text-[var(--marketing-text-muted)] leading-relaxed">
              "{testimonial.quote}"
            </blockquote>

            {/* Author */}
            <div className="mt-6 flex items-center gap-4 border-t border-[var(--marketing-border)] pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--marketing-accent)] to-[var(--marketing-accent-light)] text-lg font-semibold text-white">
                {testimonial.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-[var(--marketing-text)]">{testimonial.name}</div>
                <div className="text-sm text-[var(--marketing-text-muted)]">
                  {testimonial.role}, {testimonial.company}
                </div>
              </div>
            </div>

            {/* Hover accent */}
            <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-[var(--marketing-accent)]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

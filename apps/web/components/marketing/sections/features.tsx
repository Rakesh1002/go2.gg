"use client";

import { motion, type Variants } from "framer-motion";
import { featuresConfig, features, type Feature } from "@repo/config";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface FeaturesProps {
  headline?: string;
  subheadline?: string;
  items?: Feature[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const _itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export function Features({
  headline = featuresConfig.headline,
  subheadline = featuresConfig.subheadline,
  items = features,
}: FeaturesProps) {
  return (
    <section className="relative border-y bg-muted/30" id="features">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="pointer-events-none absolute top-0 left-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-secondary/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">
            <Sparkles className="mr-1.5 h-3 w-3" />
            Features
          </Badge>
          <h2 className="font-bold text-3xl tracking-tight md:text-4xl lg:text-5xl">{headline}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{subheadline}</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((feature, index) => {
            // Dynamically get icon from lucide-react
            const IconComponent =
              (Icons as unknown as Record<string, LucideIcon>)[feature.icon] ?? Icons.Sparkles;

            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group hover:-translate-y-1 relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-primary/5 hover:shadow-xl"
              >
                {/* Hover gradient overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Icon */}
                <div className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 transition-transform duration-300 group-hover:scale-110">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>

                {/* Content */}
                <h3 className="relative mb-2 font-semibold text-lg">{feature.title}</h3>
                <p className="relative text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Corner accent */}
                <div className="-bottom-8 -right-8 pointer-events-none absolute h-24 w-24 rounded-full bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

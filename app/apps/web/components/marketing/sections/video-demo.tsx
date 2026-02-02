"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { BarChart3, Link2, Play, Sparkles, X, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoDemoProps {
  videoId?: string;
  thumbnailUrl?: string;
}

export function VideoDemo({
  videoId = "dQw4w9WgXcQ", // Placeholder - replace with actual demo video
  thumbnailUrl,
}: VideoDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">
            <Sparkles className="mr-1.5 h-3 w-3" />
            Demo
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            See Go2 in Action
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Watch how Go2 helps you create, track, and optimize short links in seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-12 max-w-4xl"
        >
          <div className="relative aspect-video overflow-hidden rounded-2xl border bg-card shadow-2xl">
            {isPlaying ? (
              <>
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                  title="Go2 Demo Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
                <button
                  type="button"
                  onClick={() => setIsPlaying(false)}
                  aria-label="Close video"
                  className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            ) : (
              <button
                type="button"
                className="group relative flex h-full w-full cursor-pointer items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5"
                onClick={() => setIsPlaying(true)}
                aria-label="Play demo video"
              >
                {/* Thumbnail or placeholder */}
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt="Go2 demo video thumbnail"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gradient text-6xl font-bold md:text-8xl">Go2</div>
                  </div>
                )}

                {/* Play button */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-primary/20"
                >
                  <Play
                    className="ml-1 h-8 w-8 text-primary"
                    fill="currentColor"
                    aria-hidden="true"
                  />
                </motion.div>

                {/* Duration badge */}
                <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1 text-sm font-medium text-white">
                  2:45
                </div>
              </button>
            )}
          </div>

          {/* Video highlights */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { time: "0:00", title: "Create Short Links", icon: Link2, color: "text-primary" },
              { time: "0:55", title: "Track Analytics", icon: BarChart3, color: "text-secondary" },
              { time: "1:50", title: "Lightning Redirects", icon: Zap, color: "text-green-500" },
            ].map((item, index) => (
              <motion.div
                key={item.time}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${item.color}`}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-muted-foreground">{item.time}</p>
                  <p className="font-semibold">{item.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

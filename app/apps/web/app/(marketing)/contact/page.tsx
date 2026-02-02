import type { Metadata } from "next";
import { getMetadata, siteConfig } from "@repo/config";
import { ContactForm } from "./contact-form";
import { Mail, MessageSquare, MapPin } from "lucide-react";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";

export const metadata: Metadata = getMetadata({
  title: "Contact",
  description: "Get in touch with our team. We'd love to hear from you.",
});

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      <GeometricShapes position="hero-right" />

      <div className="max-w-7xl mx-auto relative px-4 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
            Contact Us
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl ">
            Get in touch
          </h1>
          <p className="mt-6 text-xl text-[var(--marketing-text-muted)] leading-relaxed">
            Have a question or want to learn more? Our team is ready to help you scale your links.
          </p>
        </div>

        <div className="mx-auto mt-20 grid max-w-6xl gap-16 lg:grid-cols-12 lg:items-start">
          {/* Contact Info - Left Column */}
          <div className="lg:col-span-4 space-y-10">
            <div>
              <h2 className="text-xl font-bold text-[var(--marketing-text)] ">
                Contact Information
              </h2>
              <p className="mt-2 text-[var(--marketing-text-muted)] leading-relaxed">
                Reach out directly through one of these channels.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-4 group">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] transition-colors group-hover:bg-[var(--marketing-accent)] group-hover:text-[var(--marketing-bg)]">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--marketing-text)]">Email</h3>
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="text-[var(--marketing-text-muted)] hover:text-[var(--marketing-accent)] transition-colors"
                  >
                    {siteConfig.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] transition-colors group-hover:bg-[var(--marketing-accent)] group-hover:text-[var(--marketing-bg)]">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--marketing-text)]">Community</h3>
                  <a
                    href={siteConfig.links.discord ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--marketing-text-muted)] hover:text-[var(--marketing-accent)] transition-colors"
                  >
                    Ask on Discord
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] transition-colors group-hover:bg-[var(--marketing-accent)] group-hover:text-[var(--marketing-bg)]">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--marketing-text)]">Office</h3>
                  <p className="text-[var(--marketing-text-muted)] leading-relaxed">
                    Remote-first company
                    <br />
                    Available worldwide
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form - Right Column */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 md:p-10 shadow-xl shadow-[var(--marketing-accent)]/5">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

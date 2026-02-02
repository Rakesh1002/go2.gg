import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata } from "@repo/config";
import { Calendar, Video, Users, Clock, Bell } from "lucide-react";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = getMetadata({
  title: "Events & Webinars",
  description:
    "Join Go2 events, webinars, and community meetups. Learn best practices and connect with other users.",
});

const upcomingEvents: Array<{
  title: string;
  date: string;
  time: string;
  type: string;
  description: string;
  href: string;
}> = [
  // Add events when available
  // {
  //   title: "Getting Started with Go2",
  //   date: "February 15, 2026",
  //   time: "2:00 PM EST",
  //   type: "Webinar",
  //   description: "Learn the basics of Go2 and how to get the most out of your links.",
  //   href: "#",
  // },
];

const pastEvents = [
  {
    title: "Link Management Best Practices",
    date: "January 10, 2026",
    type: "Webinar",
    description: "Expert tips on organizing and managing your link library at scale.",
    recordingAvailable: true,
    href: "#",
  },
  {
    title: "API Deep Dive",
    date: "December 20, 2025",
    type: "Workshop",
    description: "Hands-on workshop for building integrations with the Go2 API.",
    recordingAvailable: true,
    href: "#",
  },
  {
    title: "Analytics Masterclass",
    date: "December 5, 2025",
    type: "Webinar",
    description: "Understanding your link analytics and making data-driven decisions.",
    recordingAvailable: true,
    href: "#",
  },
];

const eventTypes = [
  {
    icon: Video,
    title: "Webinars",
    description: "Live online sessions covering features, best practices, and tips.",
  },
  {
    icon: Users,
    title: "Community Meetups",
    description: "Connect with other Go2 users and share experiences.",
  },
  {
    icon: Calendar,
    title: "Workshops",
    description: "Hands-on training sessions for developers and power users.",
  },
];

export default function EventsPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <GeometricShapes position="hero-right" />
        <div className="max-w-7xl relative mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
            <Calendar className="h-4 w-4" />
            Events & Webinars
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl animate-fade-in-up">
            Learn &{" "}
            <span className="text-[var(--marketing-accent)] text-gradient-warm">Connect</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed animate-fade-in-up stagger-1">
            Join our webinars, workshops, and community events to learn best practices and connect
            with other Go2 users.
          </p>
        </div>
      </section>

      {/* Event Types */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-3">
            {eventTypes.map((type) => (
              <div
                key={type.title}
                className="p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] mx-auto mb-4">
                  <type.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg text-[var(--marketing-text)] mb-2">
                  {type.title}
                </h3>
                <p className="text-sm text-[var(--marketing-text-muted)]">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-[var(--marketing-text)] mb-8">Upcoming Events</h2>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-medium text-[var(--marketing-accent)] uppercase tracking-wider">
                        {event.type}
                      </span>
                      <h3 className="text-xl font-bold text-[var(--marketing-text)] mt-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-[var(--marketing-text-muted)] mt-2">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-[var(--marketing-text-muted)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {event.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event.time}
                        </span>
                      </div>
                    </div>
                    <Link href={event.href}>
                      <Button className="bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]">
                        Register
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
              <Calendar className="h-12 w-12 text-[var(--marketing-text-muted)] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-2">
                No Upcoming Events
              </h3>
              <p className="text-[var(--marketing-text-muted)] max-w-md mx-auto">
                We don't have any scheduled events right now. Subscribe below to get notified when
                we announce new events.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Past Events */}
      <section className="border-y border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-[var(--marketing-text)] mb-8">Past Events</h2>

            <div className="space-y-4">
              {pastEvents.map((event, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[var(--marketing-text-muted)] uppercase tracking-wider">
                        {event.type}
                      </span>
                      <span className="text-xs text-[var(--marketing-text-muted)]">•</span>
                      <span className="text-xs text-[var(--marketing-text-muted)]">
                        {event.date}
                      </span>
                    </div>
                    <h3 className="font-bold text-[var(--marketing-text)]">{event.title}</h3>
                    <p className="text-sm text-[var(--marketing-text-muted)] mt-1">
                      {event.description}
                    </p>
                  </div>
                  {event.recordingAvailable && (
                    <Link
                      href={event.href}
                      className="flex items-center gap-2 text-sm text-[var(--marketing-accent)] hover:underline flex-shrink-0"
                    >
                      <Video className="h-4 w-4" />
                      Watch Recording
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] mx-auto mb-6">
            <Bell className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--marketing-text)] mb-4">
            Get Event Updates
          </h2>
          <p className="text-[var(--marketing-text-muted)] mb-8">
            Subscribe to be notified about upcoming events, webinars, and workshops.
          </p>
          <form className="flex max-w-md mx-auto gap-3">
            <Input
              type="email"
              placeholder="you@email.com"
              className="h-12 bg-[var(--marketing-bg-elevated)] border-[var(--marketing-border)] text-[var(--marketing-text)] focus-visible:ring-[var(--marketing-accent)]/20"
            />
            <Button className="h-12 px-6 bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}

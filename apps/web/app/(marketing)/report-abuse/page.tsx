import { getMetadata } from "@repo/config";
import type { Metadata } from "next";
import { ReportAbuseForm } from "./report-abuse-form";

export const metadata: Metadata = getMetadata({
  title: "Report abuse",
  description:
    "Report a phishing, malware, scam, or other harmful go2.gg short link. We review reports within 24 hours.",
});

export default async function ReportAbusePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const params = await searchParams;
  const prefillUrl = typeof params.url === "string" ? params.url : "";

  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 font-semibold text-red-500 text-sm">
            Trust & Safety
          </div>
          <h1 className="font-extrabold text-4xl text-[var(--marketing-text)] tracking-tight sm:text-5xl md:text-6xl">
            Report an abusive link
          </h1>
          <p className="mt-6 text-[var(--marketing-text-muted)] text-xl leading-relaxed">
            Phishing, malware, scams, impersonation, or other harmful content? Tell us and we'll
            review within 24 hours.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <div className="rounded-3xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 shadow-xl md:p-10">
            <div className="mb-8 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-6">
              <h2 className="mb-3 font-bold text-[var(--marketing-text)] text-lg">
                What happens after you report
              </h2>
              <ul className="space-y-2 text-[var(--marketing-text-muted)] text-sm leading-relaxed">
                <li>1. We move the link to the front of our automated rescan queue.</li>
                <li>
                  2. Google Safe Browsing and Cloudflare URL Scanner re-check the destination within
                  minutes.
                </li>
                <li>3. If flagged, the link is disabled and the owner is notified.</li>
                <li>
                  4. Critical reports (child safety, active malware) are routed to{" "}
                  <a className="underline" href="mailto:abuse@go2.gg">
                    abuse@go2.gg
                  </a>{" "}
                  for immediate human review.
                </li>
              </ul>
            </div>
            <ReportAbuseForm prefillUrl={prefillUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const REASONS = [
  { value: "phishing", label: "Phishing — impersonates a brand to steal credentials" },
  { value: "malware", label: "Malware — distributes harmful software" },
  { value: "scam_fraud", label: "Scam / fraud" },
  { value: "impersonation", label: "Impersonation of a person or brand" },
  { value: "spam", label: "Spam" },
  { value: "child_safety", label: "Child safety (CSAM)" },
  { value: "intellectual_property", label: "Copyright / trademark" },
  { value: "violence_hate", label: "Violence or hate speech" },
  { value: "other", label: "Other" },
] as const;

const schema = z.object({
  shortUrl: z.string().url("Enter the full short URL (https://go2.gg/...)"),
  reason: z.enum([
    "phishing",
    "malware",
    "scam_fraud",
    "impersonation",
    "spam",
    "child_safety",
    "intellectual_property",
    "violence_hate",
    "other",
  ]),
  notes: z.string().max(2000).optional(),
  reporterEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export function ReportAbuseForm({ prefillUrl }: { prefillUrl?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      shortUrl: prefillUrl ?? "",
      reason: "phishing",
    },
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
      const body = {
        shortUrl: data.shortUrl,
        reason: data.reason,
        notes: data.notes || undefined,
        reporterEmail: data.reporterEmail || undefined,
      };
      const res = await fetch(`${apiUrl}/api/v1/abuse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || j?.message || "Failed to submit report");
      }
      setIsSuccess(true);
      reset({ shortUrl: "", reason: "phishing", notes: "", reporterEmail: "" });
      toast.success("Report received. Thank you for flagging this.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h2 className="font-bold text-[var(--marketing-text)] text-xl">Report received</h2>
        <p className="text-[var(--marketing-text-muted)]">
          The link has been moved to the front of our rescan queue. Critical reports are reviewed
          within 24 hours.
        </p>
        <Button onClick={() => setIsSuccess(false)} variant="outline">
          File another report
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="shortUrl">Short URL</Label>
        <Input id="shortUrl" placeholder="https://go2.gg/example" {...register("shortUrl")} />
        {errors.shortUrl && <p className="text-red-500 text-sm">{errors.shortUrl.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <select
          id="reason"
          className="block w-full rounded-md border border-[var(--marketing-border)] bg-[var(--marketing-bg)] px-3 py-2 text-[var(--marketing-text)]"
          {...register("reason")}
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder="What did you see when you visited this link? Anything else we should know?"
          {...register("notes")}
        />
        {errors.notes && <p className="text-red-500 text-sm">{errors.notes.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reporterEmail">Your email (optional)</Label>
        <Input
          id="reporterEmail"
          type="email"
          placeholder="you@example.com"
          {...register("reporterEmail")}
        />
        <p className="text-[var(--marketing-text-muted)] text-xs">
          Only used if we need follow-up. We won't share it with the link owner.
        </p>
        {errors.reporterEmail && (
          <p className="text-red-500 text-sm">{errors.reporterEmail.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit report"
        )}
      </Button>
    </form>
  );
}

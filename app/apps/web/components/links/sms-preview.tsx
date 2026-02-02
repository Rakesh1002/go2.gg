"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react";

interface SMSPreviewProps {
  url: string;
  message?: string;
  className?: string;
}

// SMS character limits
const SMS_SEGMENT_SIZE_7BIT = 160;
const SMS_SEGMENT_SIZE_UNICODE = 70;
const SMS_MULTIPART_7BIT = 153;
const SMS_MULTIPART_UNICODE = 67;

// Carriers known to flag certain URL patterns
const CARRIER_WARNING_PATTERNS = [
  /bit\.ly/i,
  /tinyurl/i,
  /goo\.gl/i,
  /t\.co/i,
  /ow\.ly/i,
  /buff\.ly/i,
];

// Common spam trigger words
const SPAM_TRIGGERS = [
  "free",
  "winner",
  "claim",
  "urgent",
  "act now",
  "limited time",
  "click here",
  "prize",
];

function hasUnicodeCharacters(text: string): boolean {
  // Check for characters outside basic ASCII + common extended chars
  return /[^\x00-\x7F]/.test(text);
}

function calculateSMSSegments(text: string): {
  segments: number;
  remaining: number;
  encoding: "7bit" | "unicode";
  totalChars: number;
} {
  const isUnicode = hasUnicodeCharacters(text);
  const totalChars = text.length;

  if (isUnicode) {
    if (totalChars <= SMS_SEGMENT_SIZE_UNICODE) {
      return {
        segments: 1,
        remaining: SMS_SEGMENT_SIZE_UNICODE - totalChars,
        encoding: "unicode",
        totalChars,
      };
    }
    const segments = Math.ceil(totalChars / SMS_MULTIPART_UNICODE);
    const used = totalChars % SMS_MULTIPART_UNICODE;
    return {
      segments,
      remaining: used === 0 ? 0 : SMS_MULTIPART_UNICODE - used,
      encoding: "unicode",
      totalChars,
    };
  }

  if (totalChars <= SMS_SEGMENT_SIZE_7BIT) {
    return {
      segments: 1,
      remaining: SMS_SEGMENT_SIZE_7BIT - totalChars,
      encoding: "7bit",
      totalChars,
    };
  }
  const segments = Math.ceil(totalChars / SMS_MULTIPART_7BIT);
  const used = totalChars % SMS_MULTIPART_7BIT;
  return {
    segments,
    remaining: used === 0 ? 0 : SMS_MULTIPART_7BIT - used,
    encoding: "7bit",
    totalChars,
  };
}

function checkCarrierWarnings(url: string): string[] {
  const warnings: string[] = [];

  for (const pattern of CARRIER_WARNING_PATTERNS) {
    if (pattern.test(url)) {
      warnings.push("This URL shortener may be flagged by some carriers");
      break;
    }
  }

  return warnings;
}

function checkSpamTriggers(message: string): string[] {
  const triggers: string[] = [];
  const lowerMessage = message.toLowerCase();

  for (const trigger of SPAM_TRIGGERS) {
    if (lowerMessage.includes(trigger)) {
      triggers.push(`Contains spam trigger word: "${trigger}"`);
    }
  }

  return triggers;
}

export function SMSPreview({ url, message = "", className }: SMSPreviewProps) {
  const fullMessage = message ? `${message} ${url}` : url;

  const analysis = useMemo(() => {
    const smsInfo = calculateSMSSegments(fullMessage);
    const carrierWarnings = checkCarrierWarnings(url);
    const spamWarnings = checkSpamTriggers(fullMessage);

    return {
      ...smsInfo,
      carrierWarnings,
      spamWarnings,
      allWarnings: [...carrierWarnings, ...spamWarnings],
    };
  }, [fullMessage, url]);

  const segmentColor =
    analysis.segments === 1
      ? "text-green-600"
      : analysis.segments <= 3
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Phone Preview */}
      <div className="mx-auto max-w-[280px]">
        <div className="overflow-hidden rounded-3xl border-4 border-gray-800 bg-gray-100 shadow-xl">
          {/* Phone Header */}
          <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
            <span className="text-xs text-white">9:41</span>
            <div className="h-4 w-16 rounded-full bg-gray-700" />
            <span className="text-xs text-white">100%</span>
          </div>

          {/* Message Header */}
          <div className="border-b bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">Your Brand</span>
            </div>
          </div>

          {/* Message Content */}
          <div className="min-h-[200px] bg-white p-4">
            <div className="inline-block max-w-[200px] rounded-2xl rounded-tl-md bg-gray-200 px-4 py-2">
              <p className="break-words text-sm">
                {fullMessage || "Your message preview will appear here..."}
              </p>
            </div>
            <p className="mt-1 text-xs text-gray-400">Just now</p>
          </div>
        </div>
      </div>

      {/* Character Count & Analysis */}
      <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Character Count</span>
          <span className="font-mono text-sm">{analysis.totalChars}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">SMS Segments</span>
          <span className={cn("font-mono text-sm font-bold", segmentColor)}>
            {analysis.segments}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Remaining in Segment</span>
          <span className="font-mono text-sm">{analysis.remaining}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Encoding</span>
          <span className="text-sm capitalize">{analysis.encoding}</span>
        </div>

        {/* Cost Estimate */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estimated Cost</span>
            <span className="text-sm">~${(analysis.segments * 0.0075).toFixed(4)}/msg</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Based on average US carrier rates</p>
        </div>
      </div>

      {/* Warnings */}
      {analysis.allWarnings.length > 0 && (
        <div className="space-y-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Warnings</span>
          </div>
          <ul className="space-y-1">
            {analysis.allWarnings.map((warning, idx) => (
              <li key={idx} className="text-xs text-yellow-600">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Indicators */}
      {analysis.allWarnings.length === 0 && url && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">SMS-optimized and carrier-friendly</span>
        </div>
      )}

      {/* Tips */}
      <div className="text-xs text-muted-foreground">
        <p className="font-medium">SMS Best Practices:</p>
        <ul className="mt-1 space-y-1">
          <li>• Keep messages under 160 characters for single-segment delivery</li>
          <li>• Avoid URL shorteners known to be flagged by carriers</li>
          <li>• Go2 links are carrier-safe and optimized for SMS</li>
          <li>• Include clear call-to-action</li>
        </ul>
      </div>
    </div>
  );
}

// Compact version for inline use
export function SMSCharacterCount({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const analysis = useMemo(() => calculateSMSSegments(text), [text]);

  const segmentColor =
    analysis.segments === 1
      ? "text-green-600"
      : analysis.segments <= 3
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className={cn("flex items-center gap-3 text-xs", className)}>
      <span>{analysis.totalChars} chars</span>
      <span className={cn("font-medium", segmentColor)}>
        {analysis.segments} SMS {analysis.segments === 1 ? "segment" : "segments"}
      </span>
      <span className="text-muted-foreground">{analysis.remaining} remaining</span>
    </div>
  );
}

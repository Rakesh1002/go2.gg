/**
 * Support Agent
 *
 * AI-powered support agent that uses RAG over documentation to answer questions.
 * Supports auto-responses for common questions with confidence routing.
 */

import type { Env } from "../bindings.js";

// Confidence thresholds for response routing
export const CONFIDENCE_THRESHOLDS = {
  AUTO_SEND: 0.85, // >85% - auto-send response
  DRAFT_REVIEW: 0.7, // 70-85% - draft for review
  DRAFT_FLAG: 0.5, // 50-70% - draft with flag
  ESCALATE: 0.5, // <50% - escalate immediately
} as const;

// Ticket categories
export type TicketCategory =
  | "how_to"
  | "bug_report"
  | "billing"
  | "feature_request"
  | "account"
  | "api"
  | "urgent";

export interface SupportQuery {
  message: string;
  userEmail?: string;
  userId?: string;
  organizationId?: string;
  category?: TicketCategory;
  metadata?: Record<string, unknown>;
}

export interface SupportResponse {
  answer: string;
  confidence: number;
  category: TicketCategory;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  action: "auto_send" | "draft_review" | "draft_flag" | "escalate";
  suggestedActions?: string[];
}

// Documentation snippets for RAG context
const DOCS_CONTEXT = `
# Go2.gg Documentation Summary

## Getting Started
- Create an account at go2.gg
- Dashboard available at go2.gg/dashboard
- API documentation at go2.gg/docs/api

## Creating Links
- Click "Create Link" button in dashboard
- Enter destination URL
- Optionally customize slug, add password, set expiration
- Copy and share your short link

## Custom Domains
- Add custom domains in Settings > Domains
- Verify ownership via DNS TXT record
- Point domain to Go2 via CNAME record

## Analytics
- View click analytics on link detail page
- Track geographic, device, browser, referrer data
- Export analytics data via API

## API Usage
- Generate API key in Settings > API Keys
- Base URL: api.go2.gg
- Authentication: Bearer token in Authorization header
- Rate limits: 100 requests/minute (Pro), 500/minute (Business)

## Billing & Plans
- Free plan: 50 links, 1 domain, basic analytics
- Pro plan ($9/mo): 500 links/month, 5 domains, custom slugs, API access
- Business plan ($49/mo): 5,000 links/month, 25 domains, team members (5)
- Need more? Contact sales for enterprise
- Manage subscription in Settings > Billing

## Common Issues
- "Link not found": Check if link is expired or archived
- "Rate limit exceeded": Upgrade plan or wait 1 minute
- "Domain verification failed": Ensure DNS records are correct
- "API authentication failed": Check API key is valid and included

## Contact Support
- Email: support@go2.gg
- Response time: <24 hours (Pro), <4 hours (Business)
`;

/**
 * Categorize a support ticket based on its content
 */
export function categorizeTicket(message: string): TicketCategory {
  const lower = message.toLowerCase();

  // Check for urgent keywords
  if (
    lower.includes("urgent") ||
    lower.includes("emergency") ||
    lower.includes("critical") ||
    lower.includes("down") ||
    lower.includes("broken")
  ) {
    return "urgent";
  }

  // Check for billing-related keywords
  if (
    lower.includes("billing") ||
    lower.includes("payment") ||
    lower.includes("invoice") ||
    lower.includes("subscription") ||
    lower.includes("refund") ||
    lower.includes("charge") ||
    lower.includes("price") ||
    lower.includes("plan")
  ) {
    return "billing";
  }

  // Check for API-related keywords
  if (
    lower.includes("api") ||
    lower.includes("endpoint") ||
    lower.includes("webhook") ||
    lower.includes("sdk") ||
    lower.includes("token") ||
    lower.includes("authentication") ||
    lower.includes("rate limit")
  ) {
    return "api";
  }

  // Check for bug reports
  if (
    lower.includes("bug") ||
    lower.includes("error") ||
    lower.includes("doesn't work") ||
    lower.includes("not working") ||
    lower.includes("issue") ||
    lower.includes("problem")
  ) {
    return "bug_report";
  }

  // Check for feature requests
  if (
    lower.includes("feature") ||
    lower.includes("request") ||
    lower.includes("would be nice") ||
    lower.includes("suggestion") ||
    lower.includes("can you add")
  ) {
    return "feature_request";
  }

  // Check for account-related keywords
  if (
    lower.includes("account") ||
    lower.includes("password") ||
    lower.includes("login") ||
    lower.includes("sign in") ||
    lower.includes("email") ||
    lower.includes("settings")
  ) {
    return "account";
  }

  // Default to how_to for general questions
  return "how_to";
}

/**
 * Determine response action based on confidence
 */
export function determineAction(confidence: number): SupportResponse["action"] {
  if (confidence >= CONFIDENCE_THRESHOLDS.AUTO_SEND) {
    return "auto_send";
  }
  if (confidence >= CONFIDENCE_THRESHOLDS.DRAFT_REVIEW) {
    return "draft_review";
  }
  if (confidence >= CONFIDENCE_THRESHOLDS.DRAFT_FLAG) {
    return "draft_flag";
  }
  return "escalate";
}

/**
 * Build the support agent prompt
 */
function buildPrompt(query: SupportQuery, category: TicketCategory): string {
  const contextInfo = query.userId
    ? `User ID: ${query.userId}\nOrganization: ${query.organizationId || "None"}\nEmail: ${query.userEmail || "Unknown"}`
    : "User: Guest (not authenticated)";

  return `You are a helpful customer support agent for Go2.gg, a URL shortening service.

CONTEXT:
${contextInfo}
Ticket Category: ${category}

DOCUMENTATION:
${DOCS_CONTEXT}

USER'S QUESTION:
${query.message}

INSTRUCTIONS:
1. Answer the user's question directly and helpfully based on the documentation
2. If referencing documentation, mention where they can find more info
3. Keep your response concise but complete (2-4 paragraphs max)
4. Use a friendly, professional tone
5. If you're unsure, say so and offer to escalate to human support
6. For billing issues, always suggest checking Settings > Billing
7. For API issues, point to the API documentation at go2.gg/docs/api
8. Never make up information - only use what's in the documentation

After your response, rate your confidence from 0.0 to 1.0 based on how certain you are the answer is correct and complete.

Format your response as JSON:
{
  "answer": "Your helpful response here",
  "confidence": 0.85,
  "sources": [{"title": "Doc Title", "url": "go2.gg/docs/...", "snippet": "relevant text"}],
  "suggestedActions": ["Optional action 1", "Optional action 2"]
}`;
}

/**
 * Process a support query using AI
 */
export async function processSupportQuery(env: Env, query: SupportQuery): Promise<SupportResponse> {
  // Categorize the ticket
  const category = query.category || categorizeTicket(query.message);

  // Check for urgent tickets - always escalate
  if (category === "urgent") {
    return {
      answer:
        "I understand this is urgent. I'm immediately escalating your request to our support team who will respond as quickly as possible. In the meantime, please check our status page at status.go2.gg for any known issues.",
      confidence: 1.0,
      category,
      sources: [],
      action: "escalate",
      suggestedActions: ["Check status page", "Email support@go2.gg"],
    };
  }

  try {
    // Use Workers AI for response generation
    const prompt = buildPrompt(query, category);

    const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    // Parse the AI response
    const content = (response as { response?: string }).response || "";

    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          answer?: string;
          confidence?: number;
          sources?: Array<{ title: string; url: string; snippet: string }>;
          suggestedActions?: string[];
        };

        const confidence = Math.min(1.0, Math.max(0.0, parsed.confidence || 0.5));

        return {
          answer: parsed.answer || content,
          confidence,
          category,
          sources: parsed.sources || [],
          action: determineAction(confidence),
          suggestedActions: parsed.suggestedActions,
        };
      }
    } catch {
      // JSON parsing failed, use raw response
    }

    // Fallback for non-JSON response
    return {
      answer: content,
      confidence: 0.6,
      category,
      sources: [],
      action: "draft_review",
    };
  } catch (error) {
    console.error("Support agent error:", error);

    // Return fallback response on error
    return {
      answer:
        "I apologize, but I'm having trouble processing your request right now. A member of our support team will review your question and get back to you shortly. For immediate assistance, you can also email us at support@go2.gg.",
      confidence: 0,
      category,
      sources: [],
      action: "escalate",
      suggestedActions: ["Email support@go2.gg"],
    };
  }
}

/**
 * Get canned response for common questions (faster than AI)
 */
export function getCannedResponse(message: string): SupportResponse | null {
  const lower = message.toLowerCase();

  // How to create a link
  if (
    lower.includes("how") &&
    (lower.includes("create") || lower.includes("make")) &&
    lower.includes("link")
  ) {
    return {
      answer:
        'Creating a short link is easy! Just go to your dashboard at go2.gg/dashboard and click the "Create Link" button. Enter your destination URL, optionally customize the slug, and click Create. Your short link will be ready to share immediately!',
      confidence: 0.95,
      category: "how_to",
      sources: [
        {
          title: "Creating Links",
          url: "https://go2.gg/docs/features/links",
          snippet: "Click Create Link button in dashboard",
        },
      ],
      action: "auto_send",
    };
  }

  // How to add a custom domain
  if (lower.includes("custom") && lower.includes("domain")) {
    return {
      answer:
        "To add a custom domain: 1) Go to Settings > Domains in your dashboard, 2) Click 'Add Domain' and enter your domain, 3) Add the DNS records shown (TXT for verification, CNAME to point to Go2), 4) Click 'Verify' once DNS has propagated (usually 5-10 minutes). Need help? Check our detailed guide at go2.gg/docs/features/domains",
      confidence: 0.92,
      category: "how_to",
      sources: [
        {
          title: "Custom Domains",
          url: "https://go2.gg/docs/features/domains",
          snippet: "Add DNS records for verification",
        },
      ],
      action: "auto_send",
    };
  }

  // API key question
  if (lower.includes("api") && (lower.includes("key") || lower.includes("token"))) {
    return {
      answer:
        "You can generate an API key in your dashboard under Settings > API Keys. Click 'Create API Key', give it a name, and copy the key (it's only shown once!). Use this key in the Authorization header as 'Bearer YOUR_API_KEY' when making API requests. Full API docs are at go2.gg/docs/api",
      confidence: 0.93,
      category: "api",
      sources: [
        {
          title: "API Authentication",
          url: "https://go2.gg/docs/api/authentication",
          snippet: "Generate API key in Settings",
        },
      ],
      action: "auto_send",
    };
  }

  // Pricing/plans question
  if (
    lower.includes("pricing") ||
    lower.includes("plans") ||
    (lower.includes("how much") && lower.includes("cost"))
  ) {
    return {
      answer:
        "We offer three plans: Free (50 links, 1 domain), Pro ($9/mo - 500 links/month, 5 domains, API access), and Business ($49/mo - 5,000 links/month, 25 domains, team features). All plans include analytics and QR codes. Need more? Contact sales for enterprise. Compare plans at go2.gg/pricing or upgrade anytime in Settings > Billing.",
      confidence: 0.94,
      category: "billing",
      sources: [
        {
          title: "Pricing",
          url: "https://go2.gg/pricing",
          snippet: "Compare all plan features",
        },
      ],
      action: "auto_send",
    };
  }

  return null;
}

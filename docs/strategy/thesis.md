# Go2 — Thesis

> **The bet in one sentence:** As AI agents start taking real actions on the web, every link they create needs to be attributable and measurable — and the incumbent shorteners weren't built for an agent as the actor, so the link/attribution/click primitive for agents is up for grabs.

## Problem
Today's URL shorteners (Bitly and the long tail) treat the link as a marketing artifact created by a human in a dashboard. They tax your own traffic, aren't phishing-resistant by default, and have no native concept of an AI agent creating a link on a human's behalf. There is no clean answer to "how many sales did this agent's links produce?" because the actor model stops at the human account.

## Why now
- **Agents are becoming actors.** MCP, agent cards, and tool-calling mean agents now create artifacts (links, posts, outreach) at scale. The infrastructure for attributing and measuring those actions barely exists.
- **Edge compute matured.** Cloudflare Workers + D1 + KV + Analytics Engine make sub-10ms global redirects with per-click analytics economically viable for a solo-built product, undercutting the incumbent's pricing.
- **Phishing pressure.** Shortened links are a phishing vector; default-on destination scanning is now table stakes and a real differentiator vs. legacy tools.

## Wedge
Developers and AI-agent builders who want a link primitive they can call in one curl/MCP command — no account required to try, anonymous guest links, typed SDK, native MCP server with `agentId`/`agentRunId` attribution. Land with the agent/developer use case, expand into the marketer's branded-links + analytics budget that the incumbents own.

## Insight
The non-obvious bet: the shortener of record for the agent era is not a "better Bitly" — it's an attribution primitive where the agent is a first-class actor and every click joins back to the run that produced it. Incumbents are structurally anchored to the human-in-a-dashboard model and a per-link pricing tax; an edge-native, agent-native, open-source entrant can be faster, cheaper, and safer by default.

## What would make us kill this
- {prompt: define falsifiable kill conditions} — e.g. agent builders show no willingness to adopt a dedicated link primitive (they just paste raw URLs or use whatever the platform gives them).
- The incumbents ship credible agent-native MCP + per-agent attribution and bundle it free, erasing the wedge.
- Phishing/abuse load on the open hosted product makes trust & safety cost exceed any plausible revenue.

---
**Owner:** Rakesh Roushan · **Last reviewed:** 2026-06-21 · **Review by:** 2026-09-21

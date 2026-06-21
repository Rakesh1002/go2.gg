# Go2 — PRD

> **Scope:** The Go2 product as a whole — agentic URL shortener with branded links, REST API + SDK, native MCP server, and per-agent attribution.

## Goal
Let any human or AI agent create a phishing-resistant, branded short link in one call (dashboard, API, or MCP) and see every click joined back to the actor that created it — so growth teams ditch the Bitly tax and agent builders can answer "how much did this agent's links produce?"

## Users & jobs
- **Marketers / growth teams** — branded short links on their own domain, click analytics (geo, device, referrer, UTM), retargeting pixels, A/B tests, conversion + revenue attribution.
- **Developers** — REST API + typed SDK, anonymous guest links (no account), custom domains with auto-SSL, webhooks, full OpenAPI 3.1.
- **AI agents** — native MCP server (`create_link`, `get_stats`, `list_agent_runs`, …), `agentId`/`agentRunId` stamping, run rollups.

Link [[jtbd]] for detail.

## Requirements
### Must have
- [x] Sub-10ms global redirects on Cloudflare edge
- [x] Phishing defence on create/update + rolling rescan (Google Safe Browsing v4, Cloudflare URL Scanner v2, brand-typosquat slug guard)
- [x] REST API + typed SDK; anonymous guest links via `/api/v1/public/links`
- [x] Native MCP server at `mcp.go2.gg` with per-agent / per-run attribution
- [x] Click analytics (geo, device, browser, referrer, UTM); CSV export
- [x] Custom domains with auto-SSL via Cloudflare
- [x] Disabled links return HTTP 410 with explanation; `X-Robots-Tag: noindex` on redirects
- [x] Self-host parity on user's own Cloudflare account (AGPL-3.0)

### Should have
- [ ] {prompt: confirm current state} A/B testing + conversion attribution with revenue
- [ ] {prompt: confirm} Team seats / SSO (Business plan)
- [ ] {prompt: list next planned features}

### Non-goals
- Becoming a general marketing-automation suite — stay a link/attribution/click primitive.
- {prompt: add explicit out-of-scope items}

## Success metrics
- {prompt: define targets} — e.g. links created/week, share via API/MCP vs dashboard, agent-attributed clicks, paid conversion, abuse rate kept under threshold.

## Open questions
- {prompt: list decisions needed → Decisions DB}

---
**Owner:** Rakesh Roushan · **Last reviewed:** 2026-06-21 · **Review by:** 2026-09-21

# Go2 — Market

## Size
- **TAM / SAM / SOM:** {prompt: size the URL-management / link-attribution market and the emerging agent-tooling slice; derive from Bitly/Rebrandly/Short.io revenue + MCP/agent-tooling adoption curve}
- **Wedge market:** Developers and AI-agent builders who need a programmatic link/attribution primitive (REST API + typed SDK + MCP), expanding into marketing/growth teams' branded-links + analytics spend.

## ICP
- **Primary:** AI-agent and developer builders who want a link they can mint via API or MCP without an account; and growth/marketing teams who want branded short links on their own domain with click analytics, without paying the Bitly tax.
- **Secondary:** Agencies and SaaS teams embedding short links + attribution into their own products; self-hosters who want full feature parity on their own Cloudflare account (AGPL-3.0).

## Competition
| Competitor | What they do | Where they're weak | Our angle |
|------------|--------------|--------------------|-----------|
| Bitly | Branded short links, click analytics, enterprise | Taxes your own traffic; no agent-native model; legacy stack | Edge-native sub-10ms; agent-first MCP + per-agent attribution; no traffic tax |
| Rebrandly | Branded domains, link management | Pricey at scale; no MCP/agent surfaces | Open-source, self-hostable, MCP-native |
| Short.io / Dub.co | Dev-friendly link management, OSS (Dub) | Agent attribution not first-class | `agentId`/`agentRunId` join-back to clicks; phishing-resistant by default |
| {prompt: add others} | | | |

Teardowns: [[market]] — {prompt: add teardown links once written}

## Trends & tailwinds
- Rapid adoption of MCP / agent tooling creates demand for agent-callable primitives.
- Rising phishing/abuse scrutiny makes default-on destination scanning a buying criterion.
- Edge compute cost curve enables undercutting incumbent per-link pricing.
- **Headwinds:** abuse load on an open hosted shortener; incumbents could fast-follow agent features; commoditization of basic shortening.

---
**Owner:** Rakesh Roushan · **Last reviewed:** 2026-06-21 · **Review by:** 2026-09-21

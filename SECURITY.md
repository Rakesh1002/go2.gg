# Security & Trust Policy

Two separate channels — please use the right one:

- **Security vulnerability** in the code or infrastructure → **security@go2.gg** (private; coordinated disclosure)
- **Abusive content** (phishing/malware/scam/CSAM short link) on go2.gg → **abuse@go2.gg** or [report it here](https://go2.gg/report-abuse) (24h SLA)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously at Go2. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Create a Public Issue

Please **do not** create a public GitHub issue for security vulnerabilities. This could put other users at risk.

### 2. Report Privately

Send a detailed report to: **security@go2.gg**

Include:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)
- Your contact information

### 3. What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Assessment**: We will assess the vulnerability and determine its severity
- **Resolution**: We aim to resolve critical issues within 7 days
- **Disclosure**: We will coordinate disclosure timing with you

### 4. Safe Harbor

We consider security research conducted in accordance with this policy to be:

- Authorized in compliance with any applicable anti-hacking laws
- Exempt from restrictions in our Terms of Service that would interfere with security research
- Lawful, helpful to the overall security of the internet, and conducted in good faith

You are expected to:

- Make every effort to avoid privacy violations, degradation of user experience, disruption to production systems, and destruction of data
- Only interact with accounts you own or have explicit permission to access
- Stop testing and report immediately if you access user data

## Scope

### In Scope

- go2.gg web application
- api.go2.gg API endpoints
- Go2 browser extension
- Open source codebase

### Out of Scope

- Third-party services (Cloudflare, Stripe, Better Auth providers)
- Social engineering of Go2 employees / contributors
- Physical security attacks
- Volumetric DDoS (handled at the Cloudflare edge)

> **Note on phishing destinations:** phishing or malware content hosted on a
> URL someone shortened with Go2 is **in scope for abuse review**, not
> security vulnerability disclosure — please use `abuse@go2.gg` or the
> [`/report-abuse`](https://go2.gg/report-abuse) form. We disable confirmed
> abusive links within 24 hours and notify the link owner.

## Security Best Practices

### For Users

- Use strong, unique passwords
- Enable two-factor authentication
- Keep your API keys secure
- Review connected applications regularly

### For Contributors

- Never commit secrets or credentials
- Use environment variables for sensitive data
- Follow secure coding practices
- Review dependencies for vulnerabilities

## Bug Bounty

Currently, we do not offer a paid bug bounty program. However, we will:

- Credit you in our security acknowledgments (with your permission)
- Provide a letter of appreciation
- Consider swag or account credits for significant findings

## Security Features

Go2 implements the following security measures:

- **Authentication**: Better Auth (OAuth + magic-link + email-OTP); password hashing per the framework defaults; CSRF tokens on state-changing routes
- **Authorization**: Row-level access via D1 + Better Auth's organization/role model
- **Encryption**: TLS everywhere (Cloudflare-terminated); secrets stored as Worker secret bindings, never in code or wrangler.toml
- **Rate Limiting**: Per-IP + per-user, via Durable Object atomic counters
- **Input Validation**: Zod schemas at every API boundary
- **Bot Protection**: Cloudflare Turnstile on abuse reports + auth flows; bot detection on click tracking
- **DDoS Protection**: Cloudflare WAF and network protection

## Trust & Safety (link-content moderation)

Go2 actively defends the shortener domain against phishing and malware
campaigns trying to use it as a redirect host. Three layers run on every
link create + update + on a rolling rescan:

1. **Google Safe Browsing v4** Lookup API — every destination URL is checked for `MALWARE`, `SOCIAL_ENGINEERING`, `UNWANTED_SOFTWARE`, `POTENTIALLY_HARMFUL_APPLICATION`. Flagged URLs are blocked at create time and disabled on the next rescan if they go live after creation.
2. **Cloudflare URL Scanner v2** — second-layer phishing classifier; catches what Safe Browsing hasn't seen yet.
3. **Brand-typosquat slug guard** — rejects custom slugs that fuzzy-match (Levenshtein, with Unicode-homoglyph normalization) a 40+ brand allowlist (QuickBooks, PayPal, Microsoft, Apple, Google, Meta, Chase, Coinbase, etc.) when the destination isn't the brand's verified domain.

Disabled links return `HTTP 410 Gone` with an explanation page and a
"Report a different link" CTA. Every shortlink response carries
`X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` so Google never
indexes a `/<slug>` path.

A daily rescan (`0 */4 * * *`) re-checks active destinations through both
scanners; flagged links auto-disable and the owner is emailed. Reported
links are prioritised in the next rescan window.

If you spot abusive content on a `go2.gg/...` short link, please use
[**/report-abuse**](https://go2.gg/report-abuse) or email
**abuse@go2.gg** — both are reviewed within 24 hours.

## Contact

- Security vulnerabilities: **security@go2.gg**
- Abusive content / phishing reports: **abuse@go2.gg** or [/report-abuse](https://go2.gg/report-abuse)
- General questions: hello@go2.gg
- GitHub: https://github.com/Rakesh1002/go2.gg

Thank you for helping keep Go2 and our users safe!

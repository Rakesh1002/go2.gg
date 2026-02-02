# Security Policy

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

- Third-party services (Cloudflare, Supabase, Stripe)
- Social engineering attacks
- Physical security attacks
- Denial of service attacks

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

- **Authentication**: Secure OAuth and magic link authentication via Supabase
- **Authorization**: Row-level security for user data
- **Encryption**: TLS/SSL for all communications
- **Rate Limiting**: Protection against abuse via Durable Objects
- **Input Validation**: Strict validation of all user inputs
- **CSRF Protection**: Token-based CSRF prevention
- **Bot Protection**: Cloudflare Turnstile integration
- **DDoS Protection**: Cloudflare WAF and network protection

## Contact

- Security issues: security@go2.gg
- General questions: hello@go2.gg
- GitHub: https://github.com/Rakesh1002/go2.gg

Thank you for helping keep Go2 and our users safe!

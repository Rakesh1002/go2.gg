<div align="center">

<a href="https://go2.gg">
  <img src="https://go2.gg/og-image.png" alt="Go2 - The Open Source Link Management Platform" width="100%">
</a>

<br />
<br />

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Rakesh1002/go2.gg?style=social)](https://github.com/Rakesh1002/go2.gg)
[![Built with Cloudflare Workers](https://img.shields.io/badge/Built%20with-Cloudflare%20Workers-F38020)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)

**The open-source, edge-native link management platform with sub-10ms redirects globally.**

[Website](https://go2.gg) · [Documentation](https://go2.gg/docs) · [Self-Hosting Guide](SELF_HOSTING.md)

</div>

---

## 🚀 Deploy Your Own

Go2 can be self-hosted on your own infrastructure or used via our managed cloud service.

| Option             | Best For                                                                         | Get Started                             |
| ------------------ | -------------------------------------------------------------------------------- | --------------------------------------- |
| **☁️ Go2 Cloud**   | Teams who want managed infrastructure, automatic updates, and enterprise support | [Start Free →](https://go2.gg/)         |
| **🏠 Self-Hosted** | Developers who want full control, data sovereignty, or custom modifications      | [Self-Hosting Guide →](SELF_HOSTING.md) |

---

## Why Go2?

Traditional URL shorteners are slow, expensive, and closed-source. Go2 is the modern alternative:

| Feature            | Go2                    | Traditional Shorteners |
| ------------------ | ---------------------- | ---------------------- |
| **Speed**          | ~10ms globally         | 80-150ms               |
| **Edge Locations** | 310+ via Cloudflare    | 1-10 data centers      |
| **Open Source**    | ✅ AGPL v3             | ❌ Proprietary         |
| **Self-Hostable**  | ✅ Full feature parity | ❌ Cloud-only          |
| **API-First**      | ✅ Full REST + SDKs    | Limited or paid        |
| **Free Tier**      | 50 links/month         | 10-25 links            |

## ✨ Features

### Core Features (All Plans)

- **⚡ Lightning Fast** — Sub-10ms redirects from 310+ edge locations worldwide
- **🌐 Custom Domains** — Use your own branded domains with automatic SSL
- **📊 Real-Time Analytics** — Track clicks, locations, devices, referrers, and more
- **📱 QR Codes** — Generate dynamic QR codes with custom styling
- **🔌 Developer-First** — Full REST API with TypeScript, Python, and Go SDKs
- **🏷️ Tags & Organization** — Organize links with tags and search
- **🔗 UTM Builder** — Automatically append campaign parameters

### Pro Features

- 🔐 Password-protected links
- ⏰ Link expiration (date or click-based)
- 🌍 Geo targeting (redirect by country)
- 📱 Device targeting (iOS/Android/Desktop)
- 📂 Folders for organization
- 🔔 Webhooks for integrations
- 📍 Pixel tracking (Facebook, Google, TikTok)
- 🎨 Link-in-bio pages

### Business Features

- 🧪 A/B testing with traffic splitting
- 📈 Conversion tracking with revenue attribution
- 👥 Team collaboration with roles
- 🔒 Advanced permissions
- ⚡ Real-time analytics

## 🛠️ Tech Stack

Go2 is built on modern, edge-first infrastructure:

| Layer        | Technology                                                                     |
| ------------ | ------------------------------------------------------------------------------ |
| **Runtime**  | [Cloudflare Workers](https://workers.cloudflare.com) (V8 isolates at the edge) |
| **API**      | [Hono.js](https://hono.dev) (ultrafast web framework)                          |
| **Web**      | [Next.js 14](https://nextjs.org) (App Router, React Server Components)         |
| **Database** | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite at the edge)    |
| **Cache**    | [Cloudflare KV](https://developers.cloudflare.com/kv/) (edge-replicated)       |
| **Auth**     | [Better Auth](https://better-auth.com) (edge-native authentication)            |
| **Payments** | [Stripe](https://stripe.com)                                                   |
| **Email**    | [Resend](https://resend.com)                                                   |
| **Monorepo** | [Turborepo](https://turbo.build) + pnpm                                        |

## 🏁 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Cloudflare account (free tier works)
- (Optional) Stripe account for payments
- (Optional) Resend account for emails

### Local Development

```bash
# Clone the repository
git clone https://github.com/Rakesh1002/go2.gg.git
cd go2.gg

# Install dependencies
cd app
pnpm install

# Copy environment variables
cp env.example .env.local

# Start development servers
pnpm dev
```

The web app runs at `http://localhost:3000` and API at `http://localhost:8787`.

### Self-Hosting

For production self-hosting, see our comprehensive [Self-Hosting Guide](SELF_HOSTING.md) which covers:

- Cloudflare Workers deployment
- Database setup (D1)
- Custom domain configuration
- Environment variables
- SSL certificates
- Scaling considerations

## 📁 Project Structure

```
go2.gg/
├── app/                      # Main application monorepo
│   ├── apps/
│   │   ├── api/              # Cloudflare Workers API (Hono.js)
│   │   ├── web/              # Next.js dashboard & marketing site
│   │   └── extension/        # Browser extension
│   ├── packages/             # Shared packages
│   │   ├── auth/             # Authentication (Better Auth)
│   │   ├── db/               # Database schemas (Drizzle ORM)
│   │   ├── payments/         # Stripe integration
│   │   ├── analytics/        # Analytics tracking
│   │   ├── email/            # Email templates (React Email)
│   │   └── config/           # Shared configuration
│   ├── content/              # MDX documentation
│   └── infra/                # Infrastructure configs
└── docs/                     # Development & deployment documentation
```

## 🧑‍💻 Development

```bash
# Start all services
pnpm dev

# Start specific apps
pnpm dev:web      # Web app only
pnpm dev:api      # API only

# Build all packages
pnpm build

# Run linting
pnpm lint

# Type checking
pnpm typecheck

# Format code
pnpm format

# Database operations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
```

## 🚀 Deployment

### API (Cloudflare Workers)

```bash
cd app/apps/api
pnpm run deploy
```

### Web (Vercel / Cloudflare Pages)

The web app supports deployment to Vercel or Cloudflare Pages. Push to `main` triggers automatic deployment.

For detailed instructions, see [Deployment Guide](docs/deployment/cloudflare.md).

## 📖 Documentation

- [Getting Started](docs/development/getting-started.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Self-Hosting Guide](SELF_HOSTING.md)
- [API Reference](https://go2.gg/docs/api)
- [Deployment Guide](docs/deployment/cloudflare.md)
- [Environment Variables](docs/deployment/environment.md)

## 🤝 Contributing

We love contributions! Go2 is community-driven and we welcome all forms of contribution:

- 🐛 [Report bugs](https://github.com/Rakesh1002/go2.gg/issues/new?template=bug_report.yml)
- 💡 [Request features](https://github.com/Rakesh1002/go2.gg/issues/new?template=feature_request.yml)
- 📖 Improve documentation
- 🔧 Submit pull requests

Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

### Good First Issues

Looking to contribute? Check out issues labeled [`good first issue`](https://github.com/Rakesh1002/go2.gg/labels/good%20first%20issue) for beginner-friendly tasks.

## 🌟 Community

- **Twitter/X**: [@BuildWithRakesh](https://x.com/BuildWithRakesh) for updates
- **GitHub Discussions**: [Ask questions](https://github.com/Rakesh1002/go2.gg/discussions)
- **GitHub Issues**: [Report bugs](https://github.com/Rakesh1002/go2.gg/issues) or request features

## 🏢 Go2 Cloud vs Self-Hosted

| Feature            | Self-Hosted         | Go2 Cloud              |
| ------------------ | ------------------- | ---------------------- |
| **Hosting**        | Your infrastructure | Managed by Go2         |
| **Updates**        | Manual              | Automatic              |
| **Support**        | Community           | Priority support       |
| **Data Location**  | Your choice         | US/EU regions          |
| **Custom Domains** | Unlimited           | Plan-based             |
| **SLA**            | N/A                 | 99.9% uptime           |
| **Price**          | Free (AGPL)         | Free tier + paid plans |

### When to Self-Host

- You need complete data sovereignty
- You want to modify the source code
- You have specific compliance requirements
- You prefer managing your own infrastructure

### When to Use Go2 Cloud

- You want automatic updates and maintenance
- You need enterprise support and SLAs
- You prefer a managed solution
- You want to get started quickly

[Start with Go2 Cloud →](https://go2.gg/signup)

## 📜 License

Go2 is open source under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

This means:

- ✅ Free to use, modify, and distribute
- ✅ Commercial use allowed
- ✅ Self-hosting allowed
- ⚠️ Modifications must be open-sourced under AGPL
- ⚠️ Network use triggers copyleft

For proprietary/commercial use without AGPL obligations, [contact us](mailto:enterprise@go2.gg) about an enterprise license.


---

<div align="center">

**Built with ❤️ by the Go2 community**

[Website](https://go2.gg) · [Documentation](https://go2.gg/docs) · [Twitter](https://x.com/BuildWithRakesh)

⭐ Star us on GitHub — it helps!

</div>

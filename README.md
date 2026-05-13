# Go2.gg - Modern URL Shortener & Link Management Platform

Go2.gg is a fast, modern URL shortener built on Cloudflare's edge network. It provides comprehensive link management, analytics, and conversion tracking for individuals and businesses.

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp env.example .env.local
cp env.example apps/web/.env.local
cp env.example apps/api/.env

# Start development servers
pnpm dev

# Open in browser
# Web: http://localhost:3000
# API: http://localhost:8787
```

## Features Overview

### Core Features (All Plans)

| Feature | Description |
|---------|-------------|
| **Short Links** | Create branded short links with custom slugs |
| **Custom Domains** | Use your own domain for short links |
| **QR Codes** | Generate dynamic QR codes with custom colors and logos |
| **Analytics** | Track clicks, locations, devices, and referrers |
| **Tags** | Organize links with tags for easy filtering |
| **API Access** | REST API for programmatic link management |
| **UTM Builder** | Automatically append UTM parameters |

### Pro Features ($9/month)

| Feature | Description | How to Use |
|---------|-------------|------------|
| **Password Protection** | Require password to access links | Enable in link settings → Advanced tab |
| **Link Expiration** | Auto-expire links by date or click count | Set expiration date in link settings |
| **Link Cloaking** | Hide destination URL in browser bar | Enable "Rewrite/Cloak" in advanced settings |
| **Geo Targeting** | Redirect users based on country | Add country rules in Advanced tab |
| **Device Targeting** | Different destinations for iOS/Android/Desktop | Configure in Advanced tab |
| **Deep Links** | Open mobile apps directly | Set iOS/Android app URLs in Advanced tab |
| **Folders** | Organize links in folders | Dashboard → Folders |
| **Webhooks** | Get notified on link events | Dashboard → Webhooks |
| **Pixel Tracking** | Add retargeting pixels (Facebook, Google, TikTok) | Dashboard → Pixels, then assign to links |
| **Link in Bio** | Create a bio page with multiple links | Dashboard → Link in Bio |

### Business Features ($49/month)

| Feature | Description | How to Use |
|---------|-------------|------------|
| **A/B Testing** | Split traffic between variants to optimize | Dashboard → A/B Tests, or in link creation |
| **Conversion Tracking** | Track conversions and revenue | Dashboard → Conversions |
| **Team Members** | Invite team members with role-based access | Dashboard → Team |
| **Real-time Analytics** | Live click tracking without delay | Analytics dashboard updates in real-time |
| **Advanced Permissions** | Fine-grained folder and link access | Set in folder settings |

---

## Feature Details

### Link Management

#### Creating Links

1. Go to **Dashboard → Links**
2. Click **Create Link**
3. Enter destination URL
4. Optionally customize:
   - **Short code**: Custom slug (e.g., `go2.gg/my-link`)
   - **Domain**: Select from your custom domains
   - **Tags**: Add for organization
   - **Title/Description**: For your reference

#### Advanced Link Options (Pro+)

In the **Advanced** tab when creating/editing a link:

- **Password Protection**: Set a password visitors must enter
- **Expiration**: Set date or click limit for auto-expiration
- **Link Cloaking**: Display your short URL in the browser bar instead of the destination
- **Geo Targeting**: Add country-specific redirects
- **Device Targeting**: Different URLs for iOS, Android, Desktop
- **Deep Links**: iOS/Android app URLs for direct app opening

#### Tracking Pixels (Pro+)

1. Go to **Dashboard → Pixels**
2. Add your tracking pixels:
   - Facebook Pixel ID
   - Google Ads Tag
   - TikTok Pixel
   - LinkedIn Insight Tag
   - Google Analytics 4
   - Custom scripts
3. When creating links, select which pixels to fire in the **Pixels** tab

### A/B Testing (Business+)

A/B testing allows you to split traffic between different destinations to optimize conversions.

#### Creating an A/B Test

1. Go to **Dashboard → A/B Tests** or create a new link
2. Enable A/B testing in the **Advanced** tab
3. Add variants:
   - **Control**: Your original destination
   - **Variant B**: Alternative destination to test
4. Set traffic split (e.g., 50/50 or 80/20)
5. Start the test

#### Managing Tests

- **Start**: Begin splitting traffic
- **Pause**: Temporarily stop the test (all traffic goes to control)
- **Complete**: End test and optionally pick winner
- **Results**: View click and conversion metrics per variant

### Conversion Tracking (Business+)

Track when users complete goals (purchases, signups, etc.) after clicking your links.

#### Setting Up Conversion Goals

1. Go to **Dashboard → Conversions**
2. Create a goal:
   - **Name**: e.g., "Purchase", "Signup"
   - **Type**: `conversion`, `purchase`, `signup`, `lead`, or `custom`
   - **Value**: Optional revenue value
3. Get your tracking code

#### Tracking Conversions

Add the tracking script to your thank-you/confirmation page:

```html
<script src="https://go2.gg/track.js"></script>
<script>
  go2.track('conversion', {
    goalId: 'your-goal-id',
    linkId: 'optional-link-id',  // From URL param
    value: 99.99,  // Optional: revenue
    currency: 'USD'
  });
</script>
```

Or use the API:

```bash
curl -X POST https://api.go2.gg/api/v1/conversions/track \
  -H "Content-Type: application/json" \
  -d '{
    "goalId": "your-goal-id",
    "clickId": "click-id-from-url",
    "value": 99.99
  }'
```

### Folders (Pro+)

Organize your links into folders for better management.

1. Go to **Dashboard → Folders**
2. Create folders with custom names, colors, and icons
3. Move links to folders from the links list or during link creation
4. Filter links by folder

### Webhooks (Pro+)

Receive real-time notifications when events occur.

#### Setting Up Webhooks

1. Go to **Dashboard → Webhooks**
2. Add webhook URL
3. Select events to listen for:
   - `link.created`
   - `link.clicked`
   - `link.updated`
   - `link.deleted`
   - `conversion.tracked`

#### Webhook Payload

```json
{
  "event": "link.clicked",
  "timestamp": "2026-01-25T12:00:00Z",
  "data": {
    "linkId": "abc123",
    "shortCode": "my-link",
    "destination": "https://example.com",
    "click": {
      "country": "US",
      "city": "San Francisco",
      "device": "mobile",
      "browser": "Chrome",
      "referrer": "https://twitter.com"
    }
  }
}
```

### Link in Bio (Pro+)

Create a customizable bio page to share multiple links.

1. Go to **Dashboard → Link in Bio**
2. Customize your page:
   - Profile photo and name
   - Bio description
   - Theme and colors
   - Custom CSS (optional)
3. Add links with titles and optional thumbnails
4. Share your bio page URL

---

## API Documentation

### Authentication

All API requests require authentication. Include your API key in the header:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.go2.gg/api/v1/links
```

Get your API key from **Dashboard → API Keys**.

### Endpoints

#### Links

```bash
# List links
GET /api/v1/links

# Create link
POST /api/v1/links
{
  "url": "https://example.com",
  "shortCode": "optional-custom",
  "domain": "go2.gg",
  "title": "My Link",
  "tags": ["marketing"],
  "password": "optional",
  "expiresAt": "2026-12-31T23:59:59Z",
  "geoTargets": { "US": "https://us.example.com" },
  "deviceTargets": { "ios": "https://apps.apple.com/..." },
  "rewrite": false
}

# Get link
GET /api/v1/links/:id

# Update link
PATCH /api/v1/links/:id

# Delete link
DELETE /api/v1/links/:id

# Get link analytics
GET /api/v1/links/:id/stats
```

#### A/B Tests (Business+)

```bash
# List tests
GET /api/v1/ab-tests

# Create test
POST /api/v1/ab-tests
{
  "linkId": "link-id",
  "name": "Homepage Test",
  "variants": [
    { "name": "Control", "url": "https://example.com/v1", "weight": 50 },
    { "name": "Variant B", "url": "https://example.com/v2", "weight": 50 }
  ]
}

# Start test
POST /api/v1/ab-tests/:id/start

# Stop test
POST /api/v1/ab-tests/:id/stop

# Complete test
POST /api/v1/ab-tests/:id/complete
{ "winnerVariant": "Variant B" }

# Get results
GET /api/v1/ab-tests/:id/results
```

#### Conversions (Business+)

```bash
# List goals
GET /api/v1/conversions/goals

# Create goal
POST /api/v1/conversions/goals
{
  "name": "Purchase",
  "type": "purchase",
  "defaultValue": 0
}

# Track conversion
POST /api/v1/conversions/track
{
  "goalId": "goal-id",
  "clickId": "click-id",
  "value": 99.99,
  "currency": "USD"
}

# Get conversion stats
GET /api/v1/conversions/stats?goalId=xxx&period=30d
```

#### Folders (Pro+)

```bash
# List folders
GET /api/v1/folders

# Create folder
POST /api/v1/folders
{
  "name": "Marketing",
  "color": "#6366f1",
  "icon": "folder"
}

# Add link to folder
POST /api/v1/folders/:id/links
{ "linkId": "link-id" }
```

#### Pixels (Pro+)

```bash
# List pixels
GET /api/v1/pixels

# Create pixel
POST /api/v1/pixels
{
  "name": "Facebook Pixel",
  "type": "facebook",
  "pixelId": "123456789"
}
```

---

## Pricing

| Plan | Links/Month | Tracked Clicks | Domains | Team | Price |
|------|-------------|----------------|---------|------|-------|
| **Free** | 50 | 2,000 | 1 | 1 | $0 |
| **Pro** | 2,000 | 100,000 | 5 | 1 | $9/mo |
| **Business** | 20,000 | 500,000 | 25 | 10 | $49/mo |
| **Enterprise** | Custom | Custom | Custom | Custom | Contact |

---

## Project Structure

```
├── apps/
│   ├── web/                  # Next.js Frontend
│   │   ├── app/
│   │   │   ├── (auth)/       # Login, register
│   │   │   ├── (dashboard)/  # Protected dashboard
│   │   │   └── (marketing)/  # Landing, pricing
│   │   └── components/
│   └── api/                  # Hono API (Cloudflare Workers)
├── packages/
│   ├── config/               # Site, pricing config
│   ├── db/                   # Database (Drizzle ORM)
│   └── ui/                   # Shared UI components
```

## Deployment

```bash
# Deploy API
cd apps/api && wrangler deploy --env production

# Deploy Web
cd apps/web && pnpm deploy
```

---

Built with Next.js, Hono, Cloudflare Workers, and Drizzle ORM.

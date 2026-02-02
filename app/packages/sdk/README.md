# @go2/sdk

Official TypeScript SDK for the [Go2](https://go2.gg) URL Shortener API.

## Installation

```bash
npm install @go2/sdk
# or
pnpm add @go2/sdk
# or
yarn add @go2/sdk
```

## Quick Start

```typescript
import { Go2 } from '@go2/sdk';

// Initialize the client
const go2 = new Go2({
  apiKey: 'go2_your_api_key',
});

// Create a short link
const link = await go2.links.create({
  destinationUrl: 'https://example.com/very/long/path',
  slug: 'my-link',
});

console.log(link.shortUrl); // https://go2.gg/my-link

// Get analytics
const stats = await go2.links.stats(link.id, { period: '7d' });
console.log(`Total clicks: ${stats.totalClicks}`);
```

## Features

- **Full TypeScript Support** - Complete type definitions for all API endpoints
- **All Resources** - Links, Domains, Webhooks, Galleries (Link-in-Bio), QR Codes
- **Pagination** - Built-in pagination support for list endpoints
- **Error Handling** - Typed errors with detailed information

## API Reference

### Links

```typescript
// List links
const { data, meta } = await go2.links.list({ page: 1, perPage: 20 });

// Create a link
const link = await go2.links.create({
  destinationUrl: 'https://example.com',
  slug: 'custom-slug', // optional
  title: 'My Link', // optional
  utmSource: 'twitter', // optional
});

// Get a link
const link = await go2.links.get('lnk_abc123');

// Update a link
const updated = await go2.links.update('lnk_abc123', {
  title: 'Updated Title',
});

// Delete a link
await go2.links.delete('lnk_abc123');

// Get analytics
const stats = await go2.links.stats('lnk_abc123', { period: '30d' });
```

### Domains

```typescript
// List domains
const { data } = await go2.domains.list();

// Add a domain
const domain = await go2.domains.create({
  domain: 'links.example.com',
});

// Verify domain
const verified = await go2.domains.verify(domain.id);

// Delete domain
await go2.domains.delete(domain.id);
```

### Webhooks

```typescript
// Create a webhook
const webhook = await go2.webhooks.create({
  name: 'Click Tracker',
  url: 'https://your-server.com/webhooks/go2',
  events: ['click', 'link.created'],
});

// The secret is only returned once!
console.log(webhook.secret);

// List webhooks
const { data } = await go2.webhooks.list();

// Send test event
const result = await go2.webhooks.test(webhook.id);

// View delivery history
const deliveries = await go2.webhooks.deliveries(webhook.id);
```

### Galleries (Link-in-Bio)

```typescript
// Create a bio page
const gallery = await go2.galleries.create({
  slug: 'myprofile',
  title: 'John Doe',
  bio: 'Creator & Developer',
  theme: 'gradient',
});

// Add links
await go2.galleries.addItem(gallery.id, {
  type: 'link',
  title: 'My Website',
  url: 'https://example.com',
});

await go2.galleries.addItem(gallery.id, {
  type: 'header',
  title: 'Social',
});

// Publish the page
await go2.galleries.publish(gallery.id, true);
```

### QR Codes

```typescript
// Generate QR code (without saving)
const qr = await go2.qr.generate({
  url: 'https://go2.gg/my-link',
  size: 512,
  foregroundColor: '#000000',
  backgroundColor: '#FFFFFF',
});

// Save a QR code for tracking
const savedQr = await go2.qr.create({
  name: 'Business Card',
  url: 'https://go2.gg/contact',
  size: 512,
});

// Download QR as SVG
const svg = await go2.qr.download(savedQr.id);
```

## Error Handling

```typescript
import { Go2, Go2Error } from '@go2/sdk';

try {
  const link = await go2.links.create({
    destinationUrl: 'invalid-url',
  });
} catch (error) {
  if (error instanceof Go2Error) {
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
    console.error(`Status: ${error.status}`);
  }
}
```

## Configuration

```typescript
const go2 = new Go2({
  apiKey: 'go2_xxx',
  baseUrl: 'https://api.go2.gg', // Custom API URL (optional)
  timeout: 30000, // Request timeout in ms (optional)
});
```

## License

MIT

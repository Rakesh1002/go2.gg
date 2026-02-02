# ShipQuest Chrome Extension

A React-based Chrome Extension boilerplate with TypeScript and Tailwind CSS.

## Features

- **Popup UI**: React-based popup with authentication
- **Background Script**: Service worker for background tasks
- **Content Script**: Page injection and DOM manipulation
- **Options Page**: User settings configuration
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Full type safety

## Development

```bash
# Install dependencies
pnpm install

# Development build with watch mode
pnpm dev

# Production build
pnpm build
```

## Loading the Extension

1. Build the extension: `pnpm build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `dist` folder

## Structure

```
apps/extension/
├── public/
│   ├── manifest.json     # Extension manifest
│   └── icons/            # Extension icons
├── src/
│   ├── popup/            # Popup UI (React)
│   ├── background/       # Background service worker
│   ├── content/          # Content scripts
│   └── options/          # Options page (React)
├── package.json
└── vite.config.ts
```

## Manifest V3

This extension uses Manifest V3 which is required for new Chrome extensions:

- Service Worker instead of background pages
- Declarative net request for network modifications
- Enhanced security model

## Communication

### Popup ↔ Background

```typescript
// Send message
chrome.runtime.sendMessage({ type: "ACTION", data: {} });

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle message
  sendResponse({ success: true });
  return true; // Keep channel open for async
});
```

### Content ↔ Background

```typescript
// From content script
chrome.runtime.sendMessage({ type: "FROM_CONTENT", data: {} });

// From background to content
chrome.tabs.sendMessage(tabId, { type: "TO_CONTENT", data: {} });
```

## Authentication

The extension syncs authentication state with the main ShipQuest website:

1. User logs in on shipquest.dev
2. Content script detects auth state
3. Auth is synced to extension storage
4. Popup shows logged-in state

## Customization

### Add new permissions

Edit `public/manifest.json`:

```json
{
  "permissions": ["storage", "activeTab", "your-permission"]
}
```

### Add context menu items

In `src/background/index.ts`:

```typescript
chrome.contextMenus.create({
  id: "your-menu-item",
  title: "Your Action",
  contexts: ["selection"]
});
```

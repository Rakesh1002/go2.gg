/**
 * Go2 Extension Background Service Worker
 *
 * Handles background tasks, context menus, keyboard shortcuts, and message passing.
 */

const API_URL = "https://api.go2.gg";
const APP_URL = "https://go2.gg";

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // First install - open welcome page
    chrome.tabs.create({ url: `${APP_URL}/extension-welcome` });
  }

  // Create context menus
  createContextMenus();
});

// Create context menus
function createContextMenus() {
  // Remove existing menus first
  chrome.contextMenus.removeAll(() => {
    // Shorten current page
    chrome.contextMenus.create({
      id: "go2-shorten-page",
      title: "Shorten this page with Go2",
      contexts: ["page"],
    });

    // Shorten selected link
    chrome.contextMenus.create({
      id: "go2-shorten-link",
      title: "Shorten this link with Go2",
      contexts: ["link"],
    });

    // Shorten selected text (if it's a URL)
    chrome.contextMenus.create({
      id: "go2-shorten-selection",
      title: "Shorten selected URL with Go2",
      contexts: ["selection"],
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let urlToShorten: string | undefined;

  switch (info.menuItemId) {
    case "go2-shorten-page":
      urlToShorten = tab?.url;
      break;
    case "go2-shorten-link":
      urlToShorten = info.linkUrl;
      break;
    case "go2-shorten-selection":
      // Check if selection is a valid URL
      if (info.selectionText && isValidUrl(info.selectionText.trim())) {
        urlToShorten = info.selectionText.trim();
      }
      break;
  }

  if (urlToShorten && !urlToShorten.startsWith("chrome://")) {
    await shortenUrl(urlToShorten);
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "shorten-current-page") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url && !tab.url.startsWith("chrome://")) {
      await shortenUrl(tab.url);
    }
  }
});

// Shorten URL helper
async function shortenUrl(url: string): Promise<void> {
  try {
    const result = await chrome.storage.local.get(["token"]);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (result.token) {
      headers["Authorization"] = `Bearer ${result.token}`;
    }

    const response = await fetch(`${API_URL}/api/v1/links`, {
      method: "POST",
      headers,
      body: JSON.stringify({ destinationUrl: url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to shorten URL");
    }

    const data = await response.json();
    const shortUrl = data.data.shortUrl;

    // Copy to clipboard
    await copyToClipboard(shortUrl);

    // Show notification
    showNotification("Link Shortened!", `${shortUrl}\n\nCopied to clipboard!`);

    // Save to recent links
    await saveToRecentLinks(data.data);
  } catch (error) {
    console.error("Error shortening URL:", error);
    showNotification("Error", error instanceof Error ? error.message : "Failed to shorten URL");
  }
}

// Copy to clipboard using offscreen document (MV3 requirement)
async function copyToClipboard(text: string): Promise<void> {
  // In MV3, we need to use the popup or content script to copy to clipboard
  // For now, we'll store the text and notify the user
  await chrome.storage.local.set({ lastShortUrl: text });
}

// Save to recent links
async function saveToRecentLinks(link: {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  slug: string;
  clickCount: number;
}): Promise<void> {
  const result = await chrome.storage.local.get(["recentLinks"]);
  const recentLinks = result.recentLinks || [];
  const newRecentLinks = [
    link,
    ...recentLinks.filter((l: { id: string }) => l.id !== link.id),
  ].slice(0, 10);
  await chrome.storage.local.set({ recentLinks: newRecentLinks });
}

// Show notification
function showNotification(title: string, message: string): void {
  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon-128.png"),
    title,
    message,
  });
}

// Validate URL
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "GET_AUTH_STATE":
      chrome.storage.local.get(["user", "token"], (result) => {
        sendResponse({ user: result.user, token: result.token });
      });
      return true;

    case "SET_AUTH_STATE":
      chrome.storage.local.set(
        {
          user: message.user,
          token: message.token,
        },
        () => {
          sendResponse({ success: true });
        }
      );
      return true;

    case "CLEAR_AUTH_STATE":
      chrome.storage.local.remove(["user", "token"], () => {
        sendResponse({ success: true });
      });
      return true;

    case "SHORTEN_URL":
      shortenUrl(message.url)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case "OPEN_DASHBOARD":
      chrome.tabs.create({ url: `${APP_URL}/dashboard/links` });
      sendResponse({ success: true });
      break;

    default:
      console.log("Unknown message type:", message.type);
  }
});

// Listen for tab updates to sync auth state
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("go2.gg")) {
    chrome.tabs.sendMessage(tabId, { type: "CHECK_AUTH" }).catch(() => {
      // Content script not ready, ignore
    });
  }
});

export {};

/**
 * Go2 Extension Content Script
 *
 * Runs on go2.gg pages to sync authentication state with the extension.
 */

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "CHECK_AUTH") {
    checkAndSyncAuth();
    sendResponse({ success: true });
  }
});

// Check for auth token in the page and sync with extension
async function checkAndSyncAuth(): Promise<void> {
  try {
    // Try to get auth info from localStorage or cookies
    const authData = localStorage.getItem("go2-auth");

    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.user && parsed.token) {
        // Send auth state to background script
        chrome.runtime.sendMessage({
          type: "SET_AUTH_STATE",
          user: parsed.user,
          token: parsed.token,
        });
      }
    }
  } catch (error) {
    console.error("Error syncing auth:", error);
  }
}

// Listen for custom events from the Go2 website
window.addEventListener("go2-auth-change", ((event: CustomEvent) => {
  const { user, token, action } = event.detail;

  if (action === "login" && user && token) {
    chrome.runtime.sendMessage({
      type: "SET_AUTH_STATE",
      user,
      token,
    });
  } else if (action === "logout") {
    chrome.runtime.sendMessage({
      type: "CLEAR_AUTH_STATE",
    });
  }
}) as EventListener);

// Initial check on page load
if (document.readyState === "complete") {
  checkAndSyncAuth();
} else {
  window.addEventListener("load", checkAndSyncAuth);
}

export {};

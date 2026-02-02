import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  LogIn,
  LogOut,
  Link2,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  QrCode,
  BarChart2,
} from "lucide-react";
import { cn } from "../lib/utils";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface ShortenedLink {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  slug: string;
  clickCount: number;
}

const API_URL = "https://api.go2.gg";
const APP_URL = "https://go2.gg";

export function Popup() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [shortening, setShortening] = useState(false);
  const [shortenedLink, setShortenedLink] = useState<ShortenedLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [recentLinks, setRecentLinks] = useState<ShortenedLink[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get current tab URL
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url;
      if (url && !url.startsWith("chrome://") && !url.startsWith("chrome-extension://")) {
        setCurrentUrl(url);
      }
    });
  }, []);

  // Load auth state and recent links
  useEffect(() => {
    chrome.storage.local.get(["user", "token", "recentLinks"], (result) => {
      if (result.user) {
        setUser(result.user);
      }
      if (result.recentLinks) {
        setRecentLinks(result.recentLinks.slice(0, 5));
      }
      setLoading(false);
    });
  }, []);

  const handleLogin = () => {
    chrome.tabs.create({ url: `${APP_URL}/login?extension=true` });
  };

  const handleLogout = () => {
    chrome.storage.local.remove(["user", "token"], () => {
      setUser(null);
      setShortenedLink(null);
    });
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: `${APP_URL}/dashboard/links` });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shortenUrl = useCallback(async () => {
    if (!currentUrl) return;

    setShortening(true);
    setError(null);
    setShortenedLink(null);

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
        body: JSON.stringify({
          destinationUrl: currentUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to shorten URL");
      }

      const data = await response.json();
      const link = data.data as ShortenedLink;
      setShortenedLink(link);

      // Save to recent links
      const newRecentLinks = [link, ...recentLinks.filter((l) => l.id !== link.id)].slice(0, 10);
      setRecentLinks(newRecentLinks);
      chrome.storage.local.set({ recentLinks: newRecentLinks });

      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(link.shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (copyErr) {
        console.error("Failed to copy:", copyErr);
      }
    } catch (err) {
      console.error("Error shortening URL:", err);
      setError(err instanceof Error ? err.message : "Failed to shorten URL");
    } finally {
      setShortening(false);
    }
  }, [currentUrl, recentLinks]);

  const openLink = (url: string) => {
    chrome.tabs.create({ url });
  };

  const openAnalytics = (linkId: string) => {
    chrome.tabs.create({ url: `${APP_URL}/dashboard/links/${linkId}` });
  };

  const openQrCode = (linkId: string) => {
    chrome.tabs.create({ url: `${APP_URL}/dashboard/links/${linkId}/qr` });
  };

  if (loading) {
    return (
      <div className="flex h-[400px] w-[360px] items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-[360px] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-blue-600" />
          <span className="font-bold text-gray-900">Go2</span>
        </div>
        <div className="flex items-center gap-1">
          {user && (
            <button
              type="button"
              onClick={openDashboard}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
              title="Open Dashboard"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={openOptions}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* URL Input & Shorten Button */}
        <div className="space-y-3">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="mb-1 text-xs font-medium text-gray-500">Current Page</p>
            <p className="truncate text-sm text-gray-700">{currentUrl || "No URL available"}</p>
          </div>

          {shortenedLink ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="mb-1 text-xs font-medium text-green-700">Short Link</p>
                <div className="flex items-center justify-between">
                  <a
                    href={shortenedLink.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-green-800 hover:underline"
                  >
                    {shortenedLink.shortUrl}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(shortenedLink.shortUrl)}
                    className="rounded p-1 text-green-700 hover:bg-green-100"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openAnalytics(shortenedLink.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <BarChart2 className="h-4 w-4" />
                  Analytics
                </button>
                <button
                  type="button"
                  onClick={() => openQrCode(shortenedLink.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <QrCode className="h-4 w-4" />
                  QR Code
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShortenedLink(null)}
                className="w-full rounded-lg border py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Shorten Another
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={shortenUrl}
                disabled={!currentUrl || shortening}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium text-white transition-colors",
                  currentUrl && !shortening
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "cursor-not-allowed bg-gray-300"
                )}
              >
                {shortening ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Shortening...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    Shorten This Page
                  </>
                )}
              </button>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}
            </>
          )}
        </div>

        {/* Recent Links */}
        {recentLinks.length > 0 && !shortenedLink && (
          <div className="mt-4">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Recent Links
            </h3>
            <div className="space-y-2">
              {recentLinks.slice(0, 3).map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-blue-600">
                      {link.shortUrl.replace("https://", "")}
                    </p>
                    <p className="truncate text-xs text-gray-500">{link.destinationUrl}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">{link.clickCount} clicks</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(link.shortUrl)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Copy link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auth Section */}
        <div className="mt-4 border-t pt-4">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-500">Signed in as </span>
                <span className="font-medium">{user.name || user.email}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-2 text-sm text-gray-500">Sign in to save links to your account</p>
              <button
                type="button"
                onClick={handleLogin}
                className="flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2 text-center text-xs text-gray-400">
        <span>Go2.gg</span>
        <span className="mx-1">•</span>
        <span>v1.0.0</span>
        <span className="mx-1">•</span>
        <button
          type="button"
          onClick={() => openLink(`${APP_URL}/help`)}
          className="hover:text-gray-600"
        >
          Help
        </button>
      </div>
    </div>
  );
}

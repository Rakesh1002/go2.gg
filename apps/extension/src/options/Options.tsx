import { useState, useEffect } from "react";
import { Link2, ExternalLink, Trash2, Settings2 } from "lucide-react";

interface RecentLink {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  slug: string;
  clickCount: number;
}

interface Settings {
  autoShorten: boolean;
  showNotifications: boolean;
  copyToClipboard: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  autoShorten: false,
  showNotifications: true,
  copyToClipboard: true,
};

export function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [recentLinks, setRecentLinks] = useState<RecentLink[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["settings", "recentLinks"], (result) => {
      if (result.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...result.settings });
      }
      if (result.recentLinks) {
        setRecentLinks(result.recentLinks);
      }
    });
  }, []);

  const updateSetting = (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    chrome.storage.local.set({ settings: newSettings }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const clearRecentLinks = () => {
    chrome.storage.local.remove(["recentLinks"], () => {
      setRecentLinks([]);
    });
  };

  const openLink = (url: string) => {
    chrome.tabs.create({ url });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Go2 Settings</h1>
            <p className="text-gray-500">Configure your Go2 extension</p>
          </div>
        </div>

        {/* Settings Card */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-700">Show Notifications</span>
                <p className="text-sm text-gray-500">
                  Display notifications when links are shortened
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.showNotifications}
                onChange={(e) => updateSetting("showNotifications", e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-700">Auto-copy to Clipboard</span>
                <p className="text-sm text-gray-500">
                  Automatically copy shortened links to clipboard
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.copyToClipboard}
                onChange={(e) => updateSetting("copyToClipboard", e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          {saved && (
            <div className="mt-4 rounded-lg bg-green-50 p-2 text-center text-sm text-green-700">
              Settings saved!
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-gray-700">Shorten current page</span>
              <kbd className="rounded bg-gray-200 px-2 py-1 text-sm font-mono text-gray-700">
                Alt + Shift + S
              </kbd>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            You can customize shortcuts in{" "}
            <button
              type="button"
              onClick={() => openLink("chrome://extensions/shortcuts")}
              className="text-blue-600 hover:underline"
            >
              Chrome Extension Shortcuts
            </button>
          </p>
        </div>

        {/* Recent Links */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Links</h2>
            {recentLinks.length > 0 && (
              <button
                type="button"
                onClick={clearRecentLinks}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            )}
          </div>

          {recentLinks.length > 0 ? (
            <div className="space-y-2">
              {recentLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-blue-600">
                      {link.shortUrl.replace("https://", "")}
                    </p>
                    <p className="truncate text-sm text-gray-500">{link.destinationUrl}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <span className="text-sm text-gray-400">{link.clickCount} clicks</span>
                    <button
                      type="button"
                      onClick={() => openLink(link.shortUrl)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Open link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No recent links</p>
          )}
        </div>

        {/* Footer Links */}
        <div className="flex justify-center gap-6 text-sm text-gray-500">
          <button
            type="button"
            onClick={() => openLink("https://go2.gg/help")}
            className="hover:text-gray-700"
          >
            Help
          </button>
          <button
            type="button"
            onClick={() => openLink("https://go2.gg/privacy")}
            className="hover:text-gray-700"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => openLink("https://go2.gg/terms")}
            className="hover:text-gray-700"
          >
            Terms
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Safety interstitial + disabled-link HTML pages
 *
 * Two pages, both lightweight inline HTML (no framework, no client JS deps):
 *
 *   1. renderInterstitial — "you're about to visit X" warning shown for
 *      brand-new links (< 24h old) and any link still in "unknown" threat
 *      state. The redirect URL is presented as plain text, never auto-
 *      followed. A confirm button posts a small fetch to /api/v1/r/:id/go
 *      which sets a session-scoped cookie, then redirects.
 *
 *   2. renderDisabledPage — 410 Gone replacement that explains why a link
 *      was disabled. Includes a "report a different link" button.
 *
 * Both pages are noindex'd, no-cache, and minimal-CSS so they render fast
 * and don't get crawled / cached as part of the shortener's footprint.
 */

const COMMON_HEAD = `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
<meta name="referrer" content="no-referrer">
<style>
  :root {
    --bg: #0b0b0c;
    --fg: #f5f5f5;
    --muted: #a1a1aa;
    --accent: #facc15;
    --danger: #ef4444;
    --border: #27272a;
    --card: #18181b;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    max-width: 560px;
    width: 100%;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 32px;
  }
  h1 {
    font-size: 20px;
    margin: 0 0 8px;
    line-height: 1.3;
  }
  p { color: var(--muted); line-height: 1.5; margin: 0 0 16px; }
  .dest {
    background: #0b0b0c;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    word-break: break-all;
    color: var(--fg);
    margin-bottom: 16px;
  }
  .row { display: flex; gap: 8px; flex-wrap: wrap; }
  .btn {
    flex: 1;
    min-width: 140px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--fg);
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 14px;
    cursor: pointer;
    text-decoration: none;
    text-align: center;
    display: inline-block;
  }
  .btn:hover { background: #27272a; }
  .btn-primary { background: var(--accent); color: #18181b; border-color: var(--accent); font-weight: 600; }
  .btn-primary:hover { background: #eab308; }
  .btn-danger { color: var(--danger); border-color: var(--danger); }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }
  .badge-warn { background: rgba(250,204,21,0.15); color: var(--accent); }
  .badge-danger { background: rgba(239,68,68,0.15); color: var(--danger); }
  small { color: var(--muted); font-size: 12px; display: block; margin-top: 16px; }
  a { color: var(--accent); }
</style>
`.trim();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderInterstitial(opts: {
  shortUrl: string;
  destination: string;
  reason: "new_link" | "unknown_threat" | "user_choice";
}): string {
  const dest = escapeHtml(opts.destination);
  const shortUrl = escapeHtml(opts.shortUrl);
  const reasonCopy: Record<typeof opts.reason, string> = {
    new_link:
      "This short link was created very recently. We add a quick preview step on new links to protect you from phishing.",
    unknown_threat:
      "We haven't been able to verify this destination yet. Confirm you trust it before continuing.",
    user_choice: "You asked to preview links before being redirected.",
  };

  return `<!doctype html>
<html lang="en">
<head>
  ${COMMON_HEAD}
  <title>Continue to destination – go2.gg</title>
</head>
<body>
  <main class="card">
    <span class="badge badge-warn">Preview</span>
    <h1>You're about to visit:</h1>
    <div class="dest">${dest}</div>
    <p>${reasonCopy[opts.reason]}</p>
    <div class="row">
      <a href="${dest}" rel="noopener noreferrer" class="btn btn-primary">Continue</a>
      <a href="https://go2.gg/report-abuse?url=${encodeURIComponent(opts.shortUrl)}" class="btn btn-danger">Report abuse</a>
    </div>
    <small>
      <strong>${shortUrl}</strong> → ${dest}<br>
      Shortened by <a href="https://go2.gg" rel="noopener">go2.gg</a> · We never proxy traffic or modify the destination.
    </small>
  </main>
</body>
</html>`;
}

export function renderDisabledPage(opts: { shortUrl: string; reason: string }): string {
  const shortUrl = escapeHtml(opts.shortUrl);
  const reason = escapeHtml(opts.reason);

  return `<!doctype html>
<html lang="en">
<head>
  ${COMMON_HEAD}
  <title>Link disabled – go2.gg</title>
</head>
<body>
  <main class="card">
    <span class="badge badge-danger">410 Gone</span>
    <h1>This link has been disabled for safety reasons.</h1>
    <p>${reason}</p>
    <p>The link <code>${shortUrl}</code> is no longer reachable through go2.gg.</p>
    <div class="row">
      <a href="https://go2.gg" class="btn">Go to go2.gg</a>
      <a href="https://go2.gg/report-abuse?url=${encodeURIComponent(opts.shortUrl)}" class="btn btn-danger">Report a different link</a>
    </div>
    <small>If you're the owner of this link and believe this is a mistake, contact <a href="mailto:abuse@go2.gg">abuse@go2.gg</a>.</small>
  </main>
</body>
</html>`;
}

export function renderPasswordPage(opts: {
  shortUrl: string;
  linkId: string;
  error?: boolean;
}): string {
  const shortUrl = escapeHtml(opts.shortUrl);
  const action = `/api/v1/links/${encodeURIComponent(opts.linkId)}/verify`;

  return `<!doctype html>
<html lang="en">
<head>
  ${COMMON_HEAD}
  <title>Password required – go2.gg</title>
</head>
<body>
  <main class="card">
    <span class="badge badge-warn">Protected</span>
    <h1>This link is password protected</h1>
    <p>Enter the password to continue to the destination.</p>
    <form method="post" action="${action}">
      <input type="password" name="password" autocomplete="off" autofocus required placeholder="Password"
        style="width:100%;padding:12px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--fg);font-size:15px;margin-bottom:12px" />
      ${opts.error ? `<p style="color:var(--danger);margin:0 0 12px">Incorrect password. Try again.</p>` : ""}
      <button type="submit" class="btn btn-primary" style="width:100%">Continue</button>
    </form>
    <small><strong>${shortUrl}</strong> · Shortened by <a href="https://go2.gg" rel="noopener">go2.gg</a></small>
  </main>
</body>
</html>`;
}

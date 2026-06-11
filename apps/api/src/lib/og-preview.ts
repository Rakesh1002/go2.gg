/**
 * OG preview page for link-preview crawlers.
 *
 * Default behavior needs no code: social scrapers (Facebook, X, LinkedIn,
 * Slack, WhatsApp, iMessage, Discord, Telegram) follow 30x redirects and
 * read the destination page's own OG tags. This module only exists for
 * links with CUSTOM og fields — those overrides live in go2's DB, not on
 * the destination, so a bot must be served them at the short URL itself.
 *
 * The page carries a meta refresh so a misdetected human still lands on the
 * destination. Only clean links are served this page; unverified links hit
 * the safety interstitial before this point.
 */

const PREVIEW_BOT_RE =
  /facebookexternalhit|facebot|twitterbot|slackbot|linkedinbot|whatsapp|telegrambot|discordbot|pinterestbot|redditbot|skypeuripreview|vkshare/i;

export function isLinkPreviewBot(userAgent: string): boolean {
  return PREVIEW_BOT_RE.test(userAgent);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderOgPreviewPage(opts: {
  shortUrl: string;
  destination: string;
  title?: string;
  description?: string;
  image?: string;
}): string {
  const title = escapeHtml(opts.title ?? opts.shortUrl);
  const description = opts.description ? escapeHtml(opts.description) : "";
  const image = opts.image ? escapeHtml(opts.image) : "";
  const url = escapeHtml(opts.shortUrl);
  const destination = escapeHtml(opts.destination);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
${description ? `<meta property="og:description" content="${description}">` : ""}
${image ? `<meta property="og:image" content="${image}">` : ""}
<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${title}">
${description ? `<meta name="twitter:description" content="${description}">` : ""}
${image ? `<meta name="twitter:image" content="${image}">` : ""}
<meta http-equiv="refresh" content="0;url=${destination}">
</head>
<body>
<p>Redirecting to <a href="${destination}">${destination}</a>…</p>
</body>
</html>`;
}

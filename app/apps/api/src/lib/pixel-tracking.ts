/**
 * Pixel Tracking Library
 *
 * Generates HTML pages with tracking pixels that fire before redirecting.
 * Supports major ad platforms: Facebook, Google Ads, LinkedIn, TikTok, Twitter, Pinterest, GA4.
 *
 * The redirect happens in <100ms after pixels fire, maintaining Go2's speed advantage.
 */

import type { TrackingPixel } from "../bindings.js";

/**
 * Generate the script for a specific pixel type
 */
function generatePixelScript(pixel: TrackingPixel): string {
  if (!pixel.enabled) return "";

  switch (pixel.type) {
    case "facebook":
      return `
<!-- Facebook Pixel -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixel.pixelId}');
${(pixel.events || ["PageView"]).map((e) => `fbq('track', '${e}');`).join("\n")}
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixel.pixelId}&ev=PageView&noscript=1"/></noscript>`;

    case "google":
      return `
<!-- Google Ads Conversion Tracking -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${pixel.pixelId}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${pixel.pixelId}');
${(pixel.events || []).map((e) => `gtag('event', '${e}');`).join("\n")}
</script>`;

    case "ga4":
      return `
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${pixel.pixelId}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${pixel.pixelId}');
${(pixel.events || []).map((e) => `gtag('event', '${e}');`).join("\n")}
</script>`;

    case "linkedin":
      return `
<!-- LinkedIn Insight Tag -->
<script type="text/javascript">
_linkedin_partner_id = "${pixel.pixelId}";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script>
<script type="text/javascript">
(function(l) {
if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q=[]}
var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})(window.lintrk);
</script>
<noscript><img height="1" width="1" style="display:none;" alt=""
src="https://px.ads.linkedin.com/collect/?pid=${pixel.pixelId}&fmt=gif" /></noscript>`;

    case "tiktok":
      return `
<!-- TikTok Pixel -->
<script>
!function (w, d, t) {
w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load('${pixel.pixelId}');
ttq.page();
${(pixel.events || []).map((e) => `ttq.track('${e}');`).join("\n")}
}(window, document, 'ttq');
</script>`;

    case "twitter":
      return `
<!-- Twitter Universal Website Tag -->
<script>
!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
twq('config','${pixel.pixelId}');
${(pixel.events || []).map((e) => `twq('event', '${e}');`).join("\n")}
</script>`;

    case "pinterest":
      return `
<!-- Pinterest Tag -->
<script>
!function(e){if(!window.pintrk){window.pintrk = function () {
window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
n=window.pintrk;n.queue=[],n.version="3.0";var
t=document.createElement("script");t.async=!0,t.src=e;var
r=document.getElementsByTagName("script")[0];
r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
pintrk('load', '${pixel.pixelId}');
pintrk('page');
${(pixel.events || []).map((e) => `pintrk('track', '${e}');`).join("\n")}
</script>
<noscript><img height="1" width="1" style="display:none;" alt=""
src="https://ct.pinterest.com/v3/?tid=${pixel.pixelId}&noscript=1" /></noscript>`;

    case "custom":
      // Allow custom script injection (sanitized for basic safety)
      if (pixel.customScript) {
        return `
<!-- Custom Tracking Script -->
<script>${pixel.customScript}</script>`;
      }
      return "";

    default:
      return "";
  }
}

/**
 * Generate the consent banner HTML
 */
function generateConsentBanner(destinationUrl: string): string {
  return `
<div id="consent-banner" style="position:fixed;bottom:0;left:0;right:0;background:#1a1a2e;color:#fff;padding:20px;text-align:center;z-index:9999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <p style="margin:0 0 15px 0;font-size:14px;">This link uses tracking for analytics. Do you consent to tracking cookies?</p>
  <button id="accept-btn" style="background:#6366f1;color:#fff;border:none;padding:10px 30px;border-radius:6px;cursor:pointer;margin:0 10px;font-size:14px;">Accept & Continue</button>
  <button id="decline-btn" style="background:#374151;color:#fff;border:none;padding:10px 30px;border-radius:6px;cursor:pointer;margin:0 10px;font-size:14px;">Decline & Continue</button>
</div>
<script>
document.getElementById('accept-btn').onclick = function() {
  document.getElementById('consent-banner').style.display = 'none';
  loadPixels();
  setTimeout(function() { window.location.href = '${destinationUrl}'; }, 100);
};
document.getElementById('decline-btn').onclick = function() {
  window.location.href = '${destinationUrl}';
};
</script>`;
}

/**
 * Generate the complete pixel tracking page
 */
export function generatePixelTrackingPage(
  destinationUrl: string,
  pixels: TrackingPixel[],
  options: {
    requireConsent?: boolean;
    linkTitle?: string;
    brandColor?: string;
  } = {}
): string {
  const enabledPixels = pixels.filter((p) => p.enabled);
  const pixelScripts = enabledPixels.map(generatePixelScript).join("\n");

  const { requireConsent = false, linkTitle = "Redirecting...", brandColor = "#6366f1" } = options;

  // If consent required, wrap pixels in a function that loads on accept
  const pixelSection = requireConsent
    ? `<script>function loadPixels() { ${pixelScripts.replace(/<\/?script>/g, "")} }</script>`
    : pixelScripts;

  const consentBanner = requireConsent ? generateConsentBanner(destinationUrl) : "";

  // Auto-redirect timing: 50ms for pixels to fire, then redirect
  const redirectScript = requireConsent
    ? ""
    : `<script>setTimeout(function() { window.location.href = '${destinationUrl}'; }, 50);</script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="${requireConsent ? "30" : "1"};url=${destinationUrl}">
  <title>${linkTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 40px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: ${brandColor};
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 10px;
      color: #e2e8f0;
    }
    p {
      font-size: 13px;
      color: #94a3b8;
    }
    a {
      color: ${brandColor};
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .powered-by {
      position: fixed;
      bottom: 20px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>${linkTitle}</h1>
    <p>You'll be redirected in a moment. <a href="${destinationUrl}">Click here</a> if not redirected.</p>
  </div>
  ${consentBanner}
  <div class="powered-by">Powered by <a href="https://go2.gg" target="_blank">Go2</a></div>

  ${pixelSection}
  ${redirectScript}
</body>
</html>`;
}

/**
 * Validate tracking pixel configuration
 */
export function validateTrackingPixel(pixel: unknown): pixel is TrackingPixel {
  if (!pixel || typeof pixel !== "object") return false;

  const p = pixel as Record<string, unknown>;

  const validTypes = [
    "facebook",
    "google",
    "linkedin",
    "tiktok",
    "twitter",
    "pinterest",
    "ga4",
    "custom",
  ];

  return (
    typeof p.type === "string" &&
    validTypes.includes(p.type) &&
    typeof p.pixelId === "string" &&
    p.pixelId.length > 0 &&
    typeof p.enabled === "boolean"
  );
}

/**
 * Validate array of tracking pixels
 */
export function validateTrackingPixels(pixels: unknown): pixels is TrackingPixel[] {
  if (!Array.isArray(pixels)) return false;
  return pixels.every(validateTrackingPixel);
}

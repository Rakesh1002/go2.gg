// Social app webviews break logins and Apple/Google Pay on destination sites, so links tapped
// inside them are handed to the system browser.
const IN_APP_BROWSER = /Instagram|FBAN|FBAV|FB_IAB|musical_ly|BytedanceWebview|Snapchat/i;

export function externalBrowserUrl(url: string, userAgent: string): string | null {
  if (!IN_APP_BROWSER.test(userAgent)) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

  if (/Android/i.test(userAgent)) {
    // Webviews that don't hand intent:// to the OS show ERR_UNKNOWN_URL_SCHEME, so only escape
    // from apps known to support it.
    if (!/Instagram|FBAV|FB_IAB/.test(userAgent)) return null;
    // The URL fragment is dropped: intent URIs use the fragment for their own parameters.
    const scheme = parsed.protocol.slice(0, -1);
    return `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(parsed.href)};end`;
  }
  if (/iPhone|iPad|iPod/i.test(userAgent)) return `x-safari-${parsed.href}`;
  return null;
}

/** Returns false when no escape applies, so the caller lets the link open normally. */
export function openInExternalBrowser(url: string): boolean {
  const target = externalBrowserUrl(url, navigator.userAgent);
  if (!target) return false;

  let leftPage = false;
  const onHide = () => {
    if (document.hidden) leftPage = true;
  };
  document.addEventListener("visibilitychange", onHide);
  window.location.href = target;
  // x-safari-https needs iOS 17+; if nothing took over the screen, open the link in place.
  setTimeout(() => {
    document.removeEventListener("visibilitychange", onHide);
    if (!leftPage) window.location.href = url;
  }, 1500);
  return true;
}

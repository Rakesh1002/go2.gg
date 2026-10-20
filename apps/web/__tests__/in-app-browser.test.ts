import { externalBrowserUrl, openInExternalBrowser } from "@/lib/in-app-browser";
import { afterEach, describe, expect, it, vi } from "vitest";

const UA = {
  iosSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
  iosInstagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0 (iPhone15,2; iOS 17_4; en_US; en; scale=3.00; 1179x2556; 600000000)",
  androidInstagram:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP1A.240305.019; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.105 Mobile Safari/537.36 Instagram 321.0.0.37.118 Android (34/14; 420dpi; 1080x2400; Google/google; Pixel 8; shiba; shiba; en_US; 573283000)",
  iosFacebook:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0.0.0;FBBV/1;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.4;FBSS/3;FBCR/;FBID/phone;FBLC/en_US;FBOP/80]",
  androidTiktok:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.0.0 Mobile Safari/537.36 trill_330000 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/trill app_version/33.0.0 ByteLocale/en Region/US BytedanceWebview/d8a21c6",
};

const DEST = "https://onlyfans.com/creator?ref=ig";

describe("externalBrowserUrl", () => {
  it("leaves real browsers alone", () => {
    expect(externalBrowserUrl(DEST, UA.iosSafari)).toBeNull();
    expect(externalBrowserUrl(DEST, UA.androidChrome)).toBeNull();
  });

  it("hands iOS in-app browsers to Safari", () => {
    expect(externalBrowserUrl(DEST, UA.iosInstagram)).toBe(`x-safari-${DEST}`);
    expect(externalBrowserUrl(DEST, UA.iosFacebook)).toBe(`x-safari-${DEST}`);
    expect(externalBrowserUrl(" HTTPS://onlyfans.com/creator?ref=ig", UA.iosInstagram)).toBe(
      `x-safari-${DEST}`
    );
  });

  it("leaves Android webviews without intent:// support in place", () => {
    expect(externalBrowserUrl(DEST, UA.androidTiktok)).toBeNull();
  });

  it("hands Android in-app browsers to Chrome with a fallback", () => {
    const expected = `intent://onlyfans.com/creator?ref=ig#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(DEST)};end`;
    expect(externalBrowserUrl(DEST, UA.androidInstagram)).toBe(expected);
  });

  it("ignores non-web and malformed URLs", () => {
    expect(externalBrowserUrl("mailto:hi@example.com", UA.iosInstagram)).toBeNull();
    expect(externalBrowserUrl("not a url", UA.androidInstagram)).toBeNull();
  });
});

describe("openInExternalBrowser", () => {
  const hrefs: string[] = [];

  function setup(userAgent: string) {
    hrefs.length = 0;
    vi.useFakeTimers();
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);
    vi.spyOn(window, "location", "get").mockReturnValue({
      set href(value: string) {
        hrefs.push(value);
      },
    } as Location);
  }

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does nothing in a real browser", () => {
    setup(UA.iosSafari);
    expect(openInExternalBrowser(DEST)).toBe(false);
    expect(hrefs).toEqual([]);
  });

  it("falls back to the plain URL when the hand-off didn't leave the page", () => {
    setup(UA.iosInstagram);
    expect(openInExternalBrowser(DEST)).toBe(true);
    expect(hrefs).toEqual([`x-safari-${DEST}`]);
    vi.advanceTimersByTime(1500);
    expect(hrefs).toEqual([`x-safari-${DEST}`, DEST]);
  });

  it("stays put once the system browser took over", () => {
    setup(UA.iosInstagram);
    openInExternalBrowser(DEST);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(1500);
    expect(hrefs).toEqual([`x-safari-${DEST}`]);
  });
});

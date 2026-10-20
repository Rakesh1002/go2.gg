// shortcut: static host list, misses unknown adult hosts; upgrade to a classifier/Safe Browsing check if abuse shows up
const ADULT_HOSTS = [
  "onlyfans.com",
  "fansly.com",
  "fanvue.com",
  "justfor.fans",
  "loyalfans.com",
  "manyvids.com",
  "fancentro.com",
  "clips4sale.com",
  "pornhub.com",
  "xvideos.com",
  "xnxx.com",
  "xhamster.com",
  "redtube.com",
  "youporn.com",
  "chaturbate.com",
  "stripchat.com",
  "bongacams.com",
  "camsoda.com",
  "myfreecams.com",
];

/** Matches the host the URL actually resolves to; the WHATWG parser already strips userinfo and normalizes case, percent-escapes and IDN. */
export function isAdultUrl(url: string): boolean {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/\.+$/, "");
  } catch {
    return false;
  }
  return ADULT_HOSTS.some((adult) => host === adult || host.endsWith(`.${adult}`));
}

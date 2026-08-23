/**
 * Disposable / throwaway signup email domains.
 *
 * Be realistic about what this buys. Of the 13 accounts in the 2026-08-23 spam
 * ring, only two used a disposable domain — and neither `candaba.com` nor
 * `joystill.com` appears on any public disposable-email list, because they are
 * domains the operator registered and controls. Eight of the thirteen used
 * verified Gmail addresses.
 *
 * So this is not a spam defence. It is 40 lines that stop the *lazy* reuse of
 * mailinator-class domains, and it carries the two domains this operator
 * actually used. Ship it because it is nearly free, not because it works.
 *
 * Deliberately a small hardcoded set rather than a 100k-entry npm package:
 * the package would bloat the Worker bundle, and the tail of those lists is
 * full of real small-business domains.
 */

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  // Observed in the 2026-08-23 ring — operator-controlled, on no public list.
  "candaba.com",
  "joystill.com",
  // Common throwaway providers.
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "sharklasers.com",
  "grr.la",
  "10minutemail.com",
  "10minutemail.net",
  "yopmail.com",
  "yopmail.net",
  "temp-mail.org",
  "tempmail.com",
  "tempmailo.com",
  "trashmail.com",
  "trashmail.de",
  "dispostable.com",
  "maildrop.cc",
  "moakt.com",
  "emailondeck.com",
  "getnada.com",
  "mohmal.com",
  "fakeinbox.com",
  "throwawaymail.com",
  "mytemp.email",
  "spamgourmet.com",
  "mailnesia.com",
  "tempr.email",
  "discard.email",
  "inboxbear.com",
  "harakirimail.com",
  "burnermail.io",
  "spam4.me",
  "mailcatch.com",
  "tmpmail.org",
  "byom.de",
  "einrot.com",
  "cuvox.de",
  "dayrep.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
  "armyspy.com",
]);

/** True when the address's domain is a known throwaway provider. */
export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email
    .slice(at + 1)
    .trim()
    .toLowerCase();
  if (!domain) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
  // Catch subdomains of a listed provider (e.g. foo.mailinator.com).
  for (const listed of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${listed}`)) return true;
  }
  return false;
}

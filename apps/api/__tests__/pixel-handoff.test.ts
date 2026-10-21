import { describe, expect, it } from "vitest";
import { signPixelHandoff, verifyPixelHandoff } from "../src/lib/pixel-handoff";

const SECRET = "test-secret-at-least-32-characters-long-xx";
const DEST = "https://example.com/landing?go2_ref=abc:def&a=1";
const DOMAIN = "go2.gg";
const SLUG = "promo";

describe("pixel handoff signing", () => {
  it("round-trips a freshly signed handoff", async () => {
    const now = 1_000_000;
    const { exp, sig } = await signPixelHandoff(DEST, DOMAIN, SLUG, SECRET, now);
    expect(exp).toBeGreaterThan(now);
    expect(await verifyPixelHandoff(DEST, DOMAIN, SLUG, exp, sig, SECRET, now)).toBe("valid");
  });

  it("rejects a tampered dest, domain, or slug (binding holds)", async () => {
    const now = 1_000_000;
    const { exp, sig } = await signPixelHandoff(DEST, DOMAIN, SLUG, SECRET, now);
    expect(
      await verifyPixelHandoff("https://evil.example/", DOMAIN, SLUG, exp, sig, SECRET, now)
    ).toBe("invalid");
    expect(await verifyPixelHandoff(DEST, "evil.gg", SLUG, exp, sig, SECRET, now)).toBe("invalid");
    expect(await verifyPixelHandoff(DEST, DOMAIN, "other-slug", exp, sig, SECRET, now)).toBe(
      "invalid"
    );
  });

  it("rejects a wrong secret and a tampered expiry as invalid (not merely expired)", async () => {
    const now = 1_000_000;
    const { exp, sig } = await signPixelHandoff(DEST, DOMAIN, SLUG, SECRET, now);
    expect(
      await verifyPixelHandoff(
        DEST,
        DOMAIN,
        SLUG,
        exp,
        sig,
        "a-different-secret-32-characters-xx",
        now
      )
    ).toBe("invalid");
    // Moving the expiry invalidates the signature (exp is part of the payload),
    // so it reads as invalid — not as an authentic-but-expired handoff.
    expect(await verifyPixelHandoff(DEST, DOMAIN, SLUG, exp + 1000, sig, SECRET, now)).toBe(
      "invalid"
    );
  });

  it("reports an authentic but lapsed handoff as 'expired' (distinct from forged)", async () => {
    const now = 1_000_000;
    const { exp, sig } = await signPixelHandoff(DEST, DOMAIN, SLUG, SECRET, now);
    // One ms past expiry, but the signature is genuine.
    expect(await verifyPixelHandoff(DEST, DOMAIN, SLUG, exp, sig, SECRET, exp + 1)).toBe("expired");
  });

  it("a FORGED signature with a past expiry is 'invalid', not 'expired' (HMAC is checked first)", async () => {
    // Load-bearing ordering guard: 'expired' makes the caller trust `domain` and
    // redirect there. If expiry were checked before the HMAC, this forged request
    // with a past exp + attacker domain would read 'expired' → open redirect.
    const now = 1_000_000;
    expect(
      await verifyPixelHandoff(
        DEST,
        "evil.example",
        SLUG,
        now - 600_000,
        "0".repeat(64),
        SECRET,
        now
      )
    ).toBe("invalid");
  });
});

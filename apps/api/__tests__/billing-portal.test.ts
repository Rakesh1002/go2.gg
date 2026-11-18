import type { AuthUser } from "@repo/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestD1 } from "./test-d1";

const OWNER = { id: "owner-1", email: "o@x.test", emailVerified: true } as unknown as AuthUser;
// Orgs created before the signup hook switched to randomUUID() have 32-char hex ids.
const LEGACY_ORG_ID = "51230051043e7b64016ef12f872777c4";

const createPortalSession = vi.hoisted(() => vi.fn());

vi.mock("../src/middleware/auth.js", () => ({
  authMiddleware:
    () => async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
      c.set("user", OWNER);
      await next();
    },
}));

vi.mock("stripe", () => ({
  default: class {
    billingPortal = { sessions: { create: createPortalSession } };
  },
}));

const { billing } = await import("../src/routes/billing");

let env: { DB: D1Database; STRIPE_SECRET_KEY: string; APP_URL: string };

beforeEach(async () => {
  createPortalSession.mockReset().mockResolvedValue({ url: "https://billing.stripe.test/s" });
  const db = await createTestD1();
  env = { DB: db.d1, STRIPE_SECRET_KEY: "sk_test", APP_URL: "https://go2.test" };
  db.sqlite
    .prepare("INSERT INTO organizations (id, name, slug, stripe_customer_id) VALUES (?, 'W', 'w', 'cus_1')")
    .run(LEGACY_ORG_ID);
  db.sqlite
    .prepare("INSERT INTO organization_members (id, organization_id, user_id, role) VALUES ('m1', ?, ?, 'owner')")
    .run(LEGACY_ORG_ID, OWNER.id);
});

describe("POST /billing/portal", () => {
  it("opens the portal for an owner whose org id is not a UUID", async () => {
    const res = await billing.request(
      "/portal",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: LEGACY_ORG_ID }),
      },
      env
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ data: { url: "https://billing.stripe.test/s" } });
    expect(createPortalSession).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_1" }));
  });
});

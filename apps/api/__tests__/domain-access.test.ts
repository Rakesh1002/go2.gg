import * as schema from "@repo/db";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it } from "vitest";
import { getDomainAccess } from "../src/lib/domain-access";
import { createTestD1 } from "./test-d1";

const env = { DEFAULT_DOMAIN: "go2.gg" };

describe("getDomainAccess", () => {
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeEach(async () => {
    const { d1, sqlite } = await createTestD1();
    db = drizzle(d1, { schema });
    const seed = sqlite.prepare(
      "INSERT INTO domains (id, user_id, organization_id, domain, verification_status, verification_token) VALUES (?, ?, ?, ?, ?, 'tok')"
    );
    seed.run("d1", "alice", null, "mine.com", "verified");
    seed.run("d2", "alice", null, "mine-pending.com", "pending");
    seed.run("d3", "bob", "org-1", "team.com", "verified");
    seed.run("d4", "mallory", "org-2", "victim.com", "verified");
  });

  it("allows the platform domain without a domains row", async () => {
    expect(await getDomainAccess(db, env, { id: "alice" }, "go2.gg")).toBe("platform");
  });

  it("reports own domains with their verification state", async () => {
    expect(await getDomainAccess(db, env, { id: "alice" }, "mine.com")).toBe("verified");
    expect(await getDomainAccess(db, env, { id: "alice" }, "mine-pending.com")).toBe("unverified");
  });

  it("allows a domain owned by the user's organization", async () => {
    expect(
      await getDomainAccess(db, env, { id: "alice", organizationId: "org-1" }, "team.com")
    ).toBe("verified");
  });

  it("denies another tenant's domain", async () => {
    expect(await getDomainAccess(db, env, { id: "alice" }, "victim.com")).toBeNull();
    expect(
      await getDomainAccess(db, env, { id: "alice", organizationId: "org-1" }, "victim.com")
    ).toBeNull();
  });

  it("does not treat two users without an organization as teammates", async () => {
    expect(await getDomainAccess(db, env, { id: "carol" }, "mine.com")).toBeNull();
  });

  it("denies unknown domains and case/format variants", async () => {
    expect(await getDomainAccess(db, env, { id: "alice" }, "unknown.com")).toBeNull();
    expect(await getDomainAccess(db, env, { id: "alice" }, "VICTIM.com")).toBeNull();
    expect(await getDomainAccess(db, env, { id: "alice" }, "victim.com.")).toBeNull();
  });

  it("uses DEFAULT_DOMAIN as the platform domain", async () => {
    const staging = { DEFAULT_DOMAIN: "staging.go2.gg" };
    expect(await getDomainAccess(db, staging, { id: "alice" }, "staging.go2.gg")).toBe("platform");
    expect(await getDomainAccess(db, staging, { id: "alice" }, "go2.gg")).toBeNull();
  });
});

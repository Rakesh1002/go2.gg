import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveSelectedOrgId } from "@/lib/selected-org";

function mockOrgs(ids: string[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: ids.map((id) => ({ id })) }))
    )
  );
}

describe("resolveSelectedOrgId", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the saved org when the user still belongs to it", async () => {
    vi.mocked(localStorage.getItem).mockReturnValue("org-b");
    mockOrgs(["org-a", "org-b"]);

    expect(await resolveSelectedOrgId()).toBe("org-b");
  });

  it("replaces a saved org the user does not belong to with their first org", async () => {
    vi.mocked(localStorage.getItem).mockReturnValue("someone-elses-org");
    mockOrgs(["org-a"]);

    expect(await resolveSelectedOrgId()).toBe("org-a");
    expect(localStorage.setItem).toHaveBeenCalledWith("selectedOrgId", "org-a");
  });

  it("clears the saved org when the user has no orgs", async () => {
    vi.mocked(localStorage.getItem).mockReturnValue("stale");
    mockOrgs([]);

    expect(await resolveSelectedOrgId()).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith("selectedOrgId");
  });

  it("does not trust the saved org when the org list cannot be loaded", async () => {
    vi.mocked(localStorage.getItem).mockReturnValue("unverified");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    expect(await resolveSelectedOrgId()).toBeNull();
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });
});

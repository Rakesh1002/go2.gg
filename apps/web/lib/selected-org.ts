const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

// The saved id can belong to another account previously signed in on this browser, so only trust it if the user is still a member.
export async function resolveSelectedOrgId(): Promise<string | null> {
  const saved = localStorage.getItem("selectedOrgId");
  try {
    const response = await fetch(`${API_URL}/api/v1/organizations`, { credentials: "include" });
    if (!response.ok) return null;
    const orgs: { id: string }[] = (await response.json()).data ?? [];
    const orgId = orgs.find((org) => org.id === saved)?.id ?? orgs[0]?.id ?? null;
    if (orgId) localStorage.setItem("selectedOrgId", orgId);
    else localStorage.removeItem("selectedOrgId");
    return orgId;
  } catch (error) {
    console.error("Failed to fetch organizations:", error);
    return null;
  }
}

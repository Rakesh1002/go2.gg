const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

// The saved id can belong to another account previously signed in on this browser, so only trust it if the user is still a member.
export async function resolveSelectedOrgId(): Promise<string | null> {
  let orgs: { id: string }[];
  try {
    const response = await fetch(`${API_URL}/api/v1/organizations`, { credentials: "include" });
    if (!response.ok) return null;
    orgs = (await response.json()).data ?? [];
  } catch (error) {
    console.error("Failed to fetch organizations:", error);
    return null;
  }

  const saved = localStorage.getItem("selectedOrgId");
  const orgId = orgs.find((org) => org.id === saved)?.id ?? orgs[0]?.id ?? null;
  try {
    if (orgId) localStorage.setItem("selectedOrgId", orgId);
    else localStorage.removeItem("selectedOrgId");
  } catch (error) {
    console.error("Failed to save selected organization:", error);
  }
  return orgId;
}

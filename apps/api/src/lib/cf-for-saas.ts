/**
 * Cloudflare for SaaS - custom hostname provisioning.
 *
 * When a creator verifies ownership of their own domain we register it as a
 * custom hostname on the go2.gg zone. Cloudflare then issues a DV certificate
 * and (via the zone's wildcard fallback-origin route to the redirect worker)
 * serves the creator's bio page on their domain. We store the returned hostname
 * id on the domains row to poll SSL status and to delete the hostname on removal.
 *
 * Requires a zone-scoped token with SSL-and-Certificates:Edit
 * (env.CLOUDFLARE_SAAS_TOKEN) and the zone id (env.CLOUDFLARE_ZONE_ID).
 */

type SaasEnv = {
  CLOUDFLARE_ZONE_ID?: string;
  CLOUDFLARE_SAAS_TOKEN?: string;
};

export interface CustomHostname {
  id: string;
  hostname: string;
  status: string; // pending | active | ... (hostname validation)
  sslStatus: string; // pending_validation | active | ... (cert status)
  /** DCV / ownership records the customer must add to finish validation. */
  validationRecords: Array<{ type: string; name: string; value: string }>;
  validationErrors: string[];
}

interface CfEnvelope<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  result: T;
}

interface CfCustomHostname {
  id: string;
  hostname: string;
  status: string;
  ssl?: {
    status?: string;
    validation_records?: Array<{
      txt_name?: string;
      txt_value?: string;
      http_url?: string;
      http_body?: string;
    }>;
    validation_errors?: Array<{ message: string }>;
  };
  ownership_verification?: { type?: string; name?: string; value?: string };
}

function creds(env: SaasEnv): { zoneId: string; token: string } {
  const zoneId = env.CLOUDFLARE_ZONE_ID;
  const token = env.CLOUDFLARE_SAAS_TOKEN;
  if (!zoneId || !token) {
    throw new Error("Cloudflare for SaaS is not configured (missing zone id or SSL token)");
  }
  return { zoneId, token };
}

async function cfFetch<T>(
  env: SaasEnv,
  path: string,
  init: RequestInit & { method: string }
): Promise<T> {
  const { zoneId, token } = creds(env);
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const body = (await res.json()) as CfEnvelope<T>;
  if (!res.ok || !body.success) {
    const msg = body.errors?.map((e) => `${e.code}: ${e.message}`).join("; ") || `HTTP ${res.status}`;
    throw new Error(`Cloudflare for SaaS API error (${msg})`);
  }
  return body.result;
}

function normalize(ch: CfCustomHostname): CustomHostname {
  const records: CustomHostname["validationRecords"] = [];
  for (const r of ch.ssl?.validation_records ?? []) {
    if (r.txt_name && r.txt_value) records.push({ type: "TXT", name: r.txt_name, value: r.txt_value });
  }
  const ov = ch.ownership_verification;
  if (ov?.type && ov.name && ov.value) {
    records.push({ type: ov.type.toUpperCase(), name: ov.name, value: ov.value });
  }
  return {
    id: ch.id,
    hostname: ch.hostname,
    status: ch.status,
    sslStatus: ch.ssl?.status ?? "unknown",
    validationRecords: records,
    validationErrors: (ch.ssl?.validation_errors ?? []).map((e) => e.message),
  };
}

/**
 * Register a custom hostname and start DV certificate issuance. Defaults to
 * "http" validation: it completes automatically once the customer's CNAME points
 * at the fallback origin, so there is no extra DNS record for them to publish.
 */
export async function createCustomHostname(
  env: SaasEnv,
  hostname: string,
  method: "txt" | "http" = "http"
): Promise<CustomHostname> {
  const result = await cfFetch<CfCustomHostname>(env, "/custom_hostnames", {
    method: "POST",
    body: JSON.stringify({
      hostname,
      ssl: { method, type: "dv", settings: { min_tls_version: "1.2" } },
    }),
  });
  return normalize(result);
}

/** Fetch current hostname + SSL status (for polling after creation). */
export async function getCustomHostname(env: SaasEnv, id: string): Promise<CustomHostname> {
  const result = await cfFetch<CfCustomHostname>(env, `/custom_hostnames/${id}`, { method: "GET" });
  return normalize(result);
}

/**
 * Find an existing custom hostname by its hostname. Lets provisioning be
 * idempotent: adopt a hostname left behind by a lost response or a failed
 * delete instead of POSTing a duplicate (which Cloudflare rejects).
 */
export async function findCustomHostnameByHostname(
  env: SaasEnv,
  hostname: string
): Promise<CustomHostname | null> {
  const results = await cfFetch<CfCustomHostname[]>(
    env,
    `/custom_hostnames?hostname=${encodeURIComponent(hostname)}`,
    { method: "GET" }
  );
  // Exact match only — the `?hostname=` filter may match by prefix/substring, and
  // adopting someone else's hostname would later let us delete their cert.
  const match = results.find((r) => r.hostname === hostname);
  return match ? normalize(match) : null;
}

/** Delete a custom hostname and its issued certificate. Idempotent on 404. */
export async function deleteCustomHostname(env: SaasEnv, id: string): Promise<void> {
  try {
    await cfFetch<{ id: string }>(env, `/custom_hostnames/${id}`, { method: "DELETE" });
  } catch (err) {
    // Already gone is fine; rethrow anything else.
    if (err instanceof Error && /81057|not found|HTTP 404/i.test(err.message)) return;
    throw err;
  }
}

/**
 * GitHub Integration
 *
 * Manages repository access for boilerplate purchases using GitHub App API.
 *
 * Setup:
 * 1. Create a GitHub App at https://github.com/settings/apps
 * 2. Grant "Repository" > "Administration" (Read/Write) permission
 * 3. Install the app on your organization
 * 4. Add GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_ORG, GITHUB_REPO to env
 */

import type { Env } from "../bindings.js";

interface GitHubInstallationToken {
  token: string;
  expires_at: string;
}

interface GitHubCollaboratorResponse {
  id: number;
  login: string;
  permissions: {
    pull: boolean;
    push: boolean;
    admin: boolean;
  };
}

/**
 * Generate a JWT for GitHub App authentication
 */
async function generateAppJwt(appId: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iat: now - 60, // Issued 60 seconds ago to account for clock drift
    exp: now + 600, // Expires in 10 minutes
    iss: appId,
  };

  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const message = `${encodedHeader}.${encodedPayload}`;

  // Import the private key
  const keyData = privateKey
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, "")
    .replace(/-----END RSA PRIVATE KEY-----/, "")
    .replace(/\n/g, "");

  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Sign the message
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(message)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${message}.${encodedSignature}`;
}

/**
 * Get an installation access token for the GitHub App
 */
async function getInstallationToken(
  appJwt: string,
  installationId: string
): Promise<GitHubInstallationToken> {
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${appJwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get installation token: ${response.status}`);
  }

  return response.json();
}

/**
 * Add a collaborator to a repository
 */
export async function addCollaborator(
  env: Env,
  username: string,
  permission: "pull" | "push" | "admin" = "pull"
): Promise<{ success: boolean; message: string }> {
  const appId = env.GITHUB_APP_ID;
  const privateKey = env.GITHUB_APP_PRIVATE_KEY;
  const installationId = env.GITHUB_INSTALLATION_ID;
  const org = env.GITHUB_ORG;
  const repo = env.GITHUB_REPO;

  if (!appId || !privateKey || !installationId || !org || !repo) {
    return {
      success: false,
      message:
        "GitHub App not configured. Please set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_INSTALLATION_ID, GITHUB_ORG, and GITHUB_REPO.",
    };
  }

  try {
    // Generate JWT and get installation token
    const appJwt = await generateAppJwt(appId, privateKey);
    const { token } = await getInstallationToken(appJwt, installationId);

    // Add collaborator
    const response = await fetch(
      `https://api.github.com/repos/${org}/${repo}/collaborators/${username}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permission }),
      }
    );

    if (response.status === 201) {
      // Invitation sent
      return {
        success: true,
        message: `Invitation sent to ${username}. They need to accept it to gain access.`,
      };
    }

    if (response.status === 204) {
      // Already a collaborator
      return {
        success: true,
        message: `${username} already has access to the repository.`,
      };
    }

    const error = (await response.json()) as { message?: string };
    return {
      success: false,
      message: error.message || `Failed to add collaborator: ${response.status}`,
    };
  } catch (error) {
    console.error("GitHub API error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add collaborator",
    };
  }
}

/**
 * Remove a collaborator from a repository
 */
export async function removeCollaborator(
  env: Env,
  username: string
): Promise<{ success: boolean; message: string }> {
  const appId = env.GITHUB_APP_ID;
  const privateKey = env.GITHUB_APP_PRIVATE_KEY;
  const installationId = env.GITHUB_INSTALLATION_ID;
  const org = env.GITHUB_ORG;
  const repo = env.GITHUB_REPO;

  if (!appId || !privateKey || !installationId || !org || !repo) {
    return {
      success: false,
      message: "GitHub App not configured",
    };
  }

  try {
    const appJwt = await generateAppJwt(appId, privateKey);
    const { token } = await getInstallationToken(appJwt, installationId);

    const response = await fetch(
      `https://api.github.com/repos/${org}/${repo}/collaborators/${username}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (response.status === 204) {
      return {
        success: true,
        message: `${username} removed from repository.`,
      };
    }

    return {
      success: false,
      message: `Failed to remove collaborator: ${response.status}`,
    };
  } catch (error) {
    console.error("GitHub API error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to remove collaborator",
    };
  }
}

/**
 * Check if a user is a collaborator
 */
export async function checkCollaborator(
  env: Env,
  username: string
): Promise<{ isCollaborator: boolean; permission?: string }> {
  const appId = env.GITHUB_APP_ID;
  const privateKey = env.GITHUB_APP_PRIVATE_KEY;
  const installationId = env.GITHUB_INSTALLATION_ID;
  const org = env.GITHUB_ORG;
  const repo = env.GITHUB_REPO;

  if (!appId || !privateKey || !installationId || !org || !repo) {
    return { isCollaborator: false };
  }

  try {
    const appJwt = await generateAppJwt(appId, privateKey);
    const { token } = await getInstallationToken(appJwt, installationId);

    const response = await fetch(
      `https://api.github.com/repos/${org}/${repo}/collaborators/${username}/permission`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (response.ok) {
      const data = (await response.json()) as { permission: string };
      return {
        isCollaborator: true,
        permission: data.permission,
      };
    }

    return { isCollaborator: false };
  } catch {
    return { isCollaborator: false };
  }
}

/**
 * Verify a GitHub username exists
 */
export async function verifyGithubUser(username: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

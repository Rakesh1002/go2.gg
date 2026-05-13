import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Go2Client } from "./client.js";
import type { DocsClient } from "./docs.js";
import type { ToolName } from "./tools.js";

export interface DispatchDeps {
  client: Go2Client;
  docsClient: DocsClient;
}

function jsonResult(value: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
}

function errorResult(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    isError: true,
  };
}

export async function dispatchToolCall(
  deps: DispatchDeps,
  name: string,
  args: Record<string, unknown> | undefined
): Promise<CallToolResult> {
  const { client, docsClient } = deps;
  const a = args ?? {};

  try {
    switch (name as ToolName) {
      case "search_docs": {
        const { query, limit } = a as { query: string; limit?: number };
        return jsonResult(await docsClient.searchDocs(query, limit));
      }
      case "get_doc": {
        const { slug } = a as { slug: string };
        const doc = await docsClient.getDoc(slug);
        if (!doc) return errorResult(`Document not found: ${slug}`);
        return jsonResult(doc);
      }
      case "list_docs": {
        const { section } = a as { section?: string };
        return jsonResult(await docsClient.listDocs(section));
      }
      case "track_agent_link":
        return jsonResult(
          await client.createLink(
            a as Parameters<Go2Client["createLink"]>[0]
          )
        );
      case "get_run_attribution":
        return jsonResult(await client.listAttribution(a as Parameters<Go2Client["listAttribution"]>[0]));
      case "list_agent_runs":
        return jsonResult(await client.listRuns(a as Parameters<Go2Client["listRuns"]>[0]));
      case "create_revocable_link":
        return jsonResult(
          await client.createRevocableLink(a as Parameters<Go2Client["createRevocableLink"]>[0])
        );
      case "create_expiring_link":
        return jsonResult(
          await client.createExpiringLink(a as Parameters<Go2Client["createExpiringLink"]>[0])
        );
      case "revoke_run_links":
        return jsonResult(
          await client.revokeRunLinks(a as Parameters<Go2Client["revokeRunLinks"]>[0])
        );
      case "create_link":
        return jsonResult(await client.createLink(a as Parameters<Go2Client["createLink"]>[0]));
      case "list_links":
        return jsonResult(await client.listLinks(a as Parameters<Go2Client["listLinks"]>[0]));
      case "get_link": {
        const { id } = a as { id: string };
        return jsonResult(await client.getLink(id));
      }
      case "update_link": {
        const { id, ...updates } = a as { id: string } & Parameters<Go2Client["updateLink"]>[1];
        return jsonResult(await client.updateLink(id, updates));
      }
      case "delete_link": {
        const { id } = a as { id: string };
        await client.deleteLink(id);
        return jsonResult({ success: true, id });
      }
      case "get_analytics": {
        const { id, period } = a as { id: string; period?: string };
        return jsonResult(await client.getAnalytics(id, period));
      }
      case "bulk_create_links": {
        const { links } = a as { links: Array<Parameters<Go2Client["createLink"]>[0]> };
        return jsonResult(await client.bulkCreateLinks(links));
      }
      case "create_folder":
        return jsonResult(
          await client.createFolder(a as Parameters<Go2Client["createFolder"]>[0])
        );
      case "list_folders":
        return jsonResult(
          await client.listFolders(a as Parameters<Go2Client["listFolders"]>[0])
        );
      case "get_folder": {
        const { id } = a as { id: string };
        return jsonResult(await client.getFolder(id));
      }
      case "update_folder": {
        const { id, ...updates } = a as { id: string } & Parameters<Go2Client["updateFolder"]>[1];
        return jsonResult(await client.updateFolder(id, updates));
      }
      case "delete_folder": {
        const { id } = a as { id: string };
        await client.deleteFolder(id);
        return jsonResult({ success: true, id });
      }
      case "move_links_to_folder": {
        const { folderId, linkIds } = a as { folderId: string; linkIds: string[] };
        return jsonResult(await client.addLinksToFolder(folderId, linkIds));
      }
      case "remove_links_from_folder": {
        const { folderId, linkIds } = a as { folderId: string; linkIds: string[] };
        return jsonResult(await client.removeLinksFromFolder(folderId, linkIds));
      }
      case "get_folder_analytics": {
        const { folderId, period } = a as {
          folderId: string;
          period?: "7d" | "30d" | "90d";
        };
        return jsonResult(await client.getFolderAnalytics(folderId, period));
      }
      default:
        return errorResult(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return errorResult(err instanceof Error ? err.message : "Unknown error");
  }
}

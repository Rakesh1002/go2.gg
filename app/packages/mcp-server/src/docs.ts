/**
 * Docs Client
 *
 * Fetches documentation from the Go2 API.
 */

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  section?: string;
  order: number;
  content?: string;
}

export interface DocsSearchResult {
  slug: string;
  title: string;
  description: string;
  section?: string;
  content: string;
  score: number;
}

export interface DocsClientOptions {
  baseUrl?: string;
}

export class DocsClient {
  private baseUrl: string;

  constructor(options?: DocsClientOptions) {
    this.baseUrl = options?.baseUrl ?? "https://go2.gg";
  }

  /**
   * List all documentation pages
   */
  async listDocs(section?: string): Promise<DocPage[]> {
    const url = new URL("/api/docs", this.baseUrl);
    if (section) {
      url.searchParams.set("section", section);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch docs: ${response.status}`);
    }

    const result = await response.json();
    return result.docs as DocPage[];
  }

  /**
   * Get a specific documentation page by slug
   */
  async getDoc(slug: string): Promise<DocPage | null> {
    const url = new URL("/api/docs", this.baseUrl);
    url.searchParams.set("slug", slug);
    url.searchParams.set("content", "true");

    const response = await fetch(url.toString());

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch doc: ${response.status}`);
    }

    const result = await response.json();
    return result.doc as DocPage;
  }

  /**
   * Search documentation
   */
  async searchDocs(query: string, limit = 10): Promise<DocsSearchResult[]> {
    const url = new URL("/api/docs-search", this.baseUrl);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to search docs: ${response.status}`);
    }

    const result = await response.json();
    return result.results as DocsSearchResult[];
  }
}

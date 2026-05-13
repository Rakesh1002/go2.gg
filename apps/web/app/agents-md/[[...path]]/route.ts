import { NextResponse } from "next/server";
import { buildPageMarkdown, isMarkdownNegotiablePath } from "@/lib/agentic/agents-md";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await context.params;
  const segments = path ?? [];
  const pathname = segments.length === 0 ? "/" : `/${segments.join("/")}`;

  if (!isMarkdownNegotiablePath(pathname)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const body = buildPageMarkdown(pathname);
  const tokens = body.trim().split(/\s+/).length;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
      "x-markdown-tokens": String(tokens),
      Vary: "Accept",
    },
  });
}

import { NextResponse } from "next/server";
import { buildAgentsMarkdown } from "@/lib/agentic/agents-md";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  return new NextResponse(buildAgentsMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}

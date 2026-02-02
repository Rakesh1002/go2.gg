import type { ReactNode } from "react";
import { DocsSidebar } from "./docs-sidebar";
import { DocsHeader } from "@/components/docs/docs-header";

interface DocsLayoutProps {
  children: ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--docs-bg)]">
      <DocsHeader />

      <div className="flex-1">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8">
          <div className="flex">
            {/* Sidebar */}
            <aside className="hidden md:block w-[240px] lg:w-[260px] shrink-0">
              <div className="sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto py-8 pr-6 lg:pr-8">
                <DocsSidebar />
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 border-l border-border/40 pl-6 lg:pl-10">
              <div className="docs-prose">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

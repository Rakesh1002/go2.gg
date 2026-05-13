import type { Metadata } from "next";
import { siteConfig } from "@repo/config";

export const metadata: Metadata = {
  title: `API Reference | ${siteConfig.name}`,
  description: "Interactive OpenAPI 3.1 reference for the Go2 REST API.",
};

export default function ApiReferencePage() {
  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8 xl:-mx-12">
      <script
        id="api-reference"
        data-url="/openapi.json"
        data-configuration={JSON.stringify({
          theme: "default",
          layout: "modern",
          hideDownloadButton: false,
          metaData: {
            title: `${siteConfig.name} API Reference`,
          },
          authentication: {
            preferredSecurityScheme: "bearerAuth",
          },
        })}
      />
      <script
        async
        src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"
      />
    </div>
  );
}

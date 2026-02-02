import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { FileManager } from "./file-manager";

export const metadata: Metadata = {
  title: "Files",
  description: "Upload and manage your files",
};

async function FilesHeader() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Files</h1>
      <p className="text-muted-foreground">
        Upload and manage your files securely stored on Cloudflare R2
      </p>
    </div>
  );
}

export default async function FilesPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<Skeleton className="h-14 w-64" />}>
        <FilesHeader />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Drag and drop files or click to upload. Maximum 10MB per file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileManager />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Storage Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium">0 MB</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-0 transition-all" />
                </div>
                <p className="text-xs text-muted-foreground">Storage included with your plan</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supported Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Images: JPG, PNG, GIF, WebP</p>
                <p>• Documents: PDF, DOC, DOCX</p>
                <p>• Data: CSV, JSON, XML</p>
                <p>• Archives: ZIP, RAR</p>
                <p>• Any other file type</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Access your files programmatically:</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {`GET /v1/files/:key
PUT /v1/files/:key
DELETE /v1/files/:key`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

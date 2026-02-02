"use client";

import { useState, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  RefreshCw,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ImportFormat = "go2" | "bitly" | "rebrandly" | "short.io" | "dub" | "generic";

interface ParsedLink {
  destinationUrl: string;
  slug?: string;
  domain?: string;
  title?: string;
  description?: string;
  tags?: string[];
  expiresAt?: string;
  clickLimit?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface ImportPreview {
  total: number;
  valid: number;
  invalid: number;
  links: ParsedLink[];
}

interface ImportError {
  row?: number;
  reason: string;
}

interface PreviewResponse {
  dryRun: boolean;
  preview: ImportPreview;
  errors: ImportError[];
  detectedFormat: ImportFormat;
}

interface ImportResult {
  imported: number;
  failed: number;
  links: Array<{ id: string; shortUrl: string; destinationUrl: string }>;
  errors: ImportError[];
}

const FORMAT_INFO: Record<ImportFormat, { label: string; description: string }> = {
  go2: { label: "Go2", description: "Export from Go2.gg" },
  bitly: { label: "Bitly", description: "Export from Bitly" },
  rebrandly: { label: "Rebrandly", description: "Export from Rebrandly" },
  "short.io": { label: "Short.io", description: "Export from Short.io" },
  dub: { label: "Dub", description: "Export from Dub.co" },
  generic: { label: "Generic CSV", description: "Standard CSV with url column" },
};

export function ImportClient() {
  const router = useRouter();
  const fileInputId = useId();
  const formatLabelId = useId();
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "complete">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ImportFormat | "auto">("auto");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setPreview(null);
      setResult(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith(".csv")) {
        toast.error("Please drop a CSV file");
        return;
      }
      setFile(droppedFile);
      setPreview(null);
      setResult(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const runDryRun = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
      const formData = new FormData();
      formData.append("file", file);

      const params = new URLSearchParams();
      params.set("dryRun", "true");
      if (format !== "auto") {
        params.set("format", format);
      }

      const response = await fetch(`${apiUrl}/api/v1/bulk/import?${params}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to preview import");
      }

      const data: PreviewResponse = await response.json();
      setPreview(data);
      setStep("preview");
    } catch (error) {
      console.error("Preview error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to preview import");
    } finally {
      setLoading(false);
    }
  };

  const executeImport = async () => {
    if (!file) return;

    setStep("importing");
    setImportProgress(0);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
      const formData = new FormData();
      formData.append("file", file);

      const params = new URLSearchParams();
      if (format !== "auto" && preview?.detectedFormat) {
        params.set("format", preview.detectedFormat);
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch(`${apiUrl}/api/v1/bulk/import?${params}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to import links");
      }

      const data: ImportResult = await response.json();
      setResult(data);
      setStep("complete");
      toast.success(`Successfully imported ${data.imported} links`);
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to import links");
      setStep("preview");
    }
  };

  const reset = () => {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setResult(null);
    setImportProgress(0);
  };

  const downloadTemplate = () => {
    const csvContent = `destination_url,slug,title,tags
https://example.com/page1,my-link-1,Example Page 1,"tag1,tag2"
https://example.com/page2,my-link-2,Example Page 2,tag3
https://example.com/page3,,Example Page 3,`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "go2-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/links")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Import Links</h1>
          <p className="text-muted-foreground">
            Import links from CSV or migrate from other services
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {["Upload", "Preview", "Import"].map((label, index) => {
          const stepIndex = ["upload", "preview", "importing", "complete"].indexOf(step);
          const isActive = stepIndex >= index;
          const isCurrent = stepIndex === index || (stepIndex === 3 && index === 2);

          return (
            <div key={label} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {stepIndex > index ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn("ml-2 text-sm", isCurrent ? "font-medium" : "text-muted-foreground")}
              >
                {label}
              </span>
              {index < 2 && <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {step === "upload" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>Drag and drop or click to select a CSV file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label
                htmlFor={fileInputId}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
                  file
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id={fileInputId}
                />
                {file ? (
                  <div className="text-center">
                    <FileText className="mx-auto h-10 w-10 text-primary" />
                    <p className="mt-2 font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 font-medium">Click to upload</p>
                    <p className="text-sm text-muted-foreground">or drag and drop your CSV file</p>
                  </div>
                )}
              </label>

              <div className="space-y-2">
                <label htmlFor={formatLabelId} className="text-sm font-medium">
                  Import Format
                </label>
                <Select value={format} onValueChange={(v) => setFormat(v as ImportFormat | "auto")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-detect format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    {Object.entries(FORMAT_INFO).map(([value, info]) => (
                      <SelectItem key={value} value={value}>
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  We&apos;ll try to auto-detect the format, or select manually
                </p>
              </div>

              <Button
                type="button"
                onClick={runDryRun}
                disabled={!file || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Preview Import
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card>
            <CardHeader>
              <CardTitle>Supported Formats</CardTitle>
              <CardDescription>We support imports from these services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {Object.entries(FORMAT_INFO).map(([key, info]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{info.label}</p>
                      <p className="text-sm text-muted-foreground">{info.description}</p>
                    </div>
                    <Badge variant="secondary">{key}</Badge>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "preview" && preview && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{preview.preview.total}</div>
                <p className="text-sm text-muted-foreground">Total Links</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{preview.preview.valid}</div>
                <p className="text-sm text-muted-foreground">Valid</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{preview.preview.invalid}</div>
                <p className="text-sm text-muted-foreground">Invalid</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Badge>
                    {FORMAT_INFO[preview.detectedFormat]?.label || preview.detectedFormat}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Detected Format</p>
              </CardContent>
            </Card>
          </div>

          {/* Errors */}
          {preview.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Warnings</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-disc pl-4 text-sm">
                  {preview.errors.slice(0, 5).map((error) => (
                    <li key={`error-${error.row ?? "general"}-${error.reason.slice(0, 20)}`}>
                      {error.row && `Row ${error.row}: `}
                      {error.reason}
                    </li>
                  ))}
                  {preview.errors.length > 5 && <li>...and {preview.errors.length - 5} more</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Table */}
          <Card>
            <CardHeader>
              <CardTitle>Preview (First 10 Links)</CardTitle>
              <CardDescription>Review the data before importing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destination URL</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Tags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.preview.links.map((link) => (
                      <TableRow key={`${link.destinationUrl}-${link.slug ?? "auto"}`}>
                        <TableCell className="max-w-[300px] truncate">
                          {link.destinationUrl}
                        </TableCell>
                        <TableCell>
                          {link.slug || <span className="text-muted-foreground">auto</span>}
                        </TableCell>
                        <TableCell>{link.title || "-"}</TableCell>
                        <TableCell>
                          {link.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="mr-1">
                              {tag}
                            </Badge>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button type="button" onClick={executeImport} disabled={preview.preview.valid === 0}>
                Import {preview.preview.valid} Links
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "importing" && (
        <Card>
          <CardContent className="py-12">
            <div className="mx-auto max-w-md text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h3 className="mt-4 text-lg font-semibold">Importing Links...</h3>
              <p className="text-muted-foreground">Please wait while we import your links</p>
              <Progress value={importProgress} className="mt-4" />
              <p className="mt-2 text-sm text-muted-foreground">{importProgress}% complete</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "complete" && result && (
        <div className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Import Complete</AlertTitle>
            <AlertDescription>
              Successfully imported {result.imported} links.
              {result.failed > 0 && ` ${result.failed} links failed to import.`}
            </AlertDescription>
          </Alert>

          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600">{result.imported}</div>
                <p className="text-muted-foreground">Links Imported</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-red-600">{result.failed}</div>
                <p className="text-muted-foreground">Failed</p>
              </CardContent>
            </Card>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Errors</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-disc pl-4 text-sm">
                  {result.errors.slice(0, 10).map((error) => (
                    <li key={`result-error-${error.row ?? "general"}-${error.reason.slice(0, 20)}`}>
                      {error.row && `Row ${error.row}: `}
                      {error.reason}
                    </li>
                  ))}
                  {result.errors.length > 10 && <li>...and {result.errors.length - 10} more</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Import More
            </Button>
            <Button type="button" onClick={() => router.push("/dashboard/links")}>
              View Links
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Info Section */}
      {step === "upload" && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Column Mapping</AlertTitle>
          <AlertDescription>
            <p className="mt-1">
              Our import automatically maps these columns: <code>destination_url</code> or{" "}
              <code>url</code> or <code>long_url</code> (required), <code>slug</code> or{" "}
              <code>slashtag</code>, <code>title</code>, <code>tags</code>.
            </p>
            <p className="mt-2">
              For Bitly exports, we map <code>long_url</code> and <code>title</code>. For Rebrandly,
              we map <code>destination</code> and <code>slashtag</code>.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Download,
  Trash2,
  ExternalLink,
  RefreshCw,
  FileIcon,
  ImageIcon,
  FileTextIcon,
  Loader2,
} from "lucide-react";

interface StoredFile {
  key: string;
  size: number;
  uploaded: string;
  etag: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileName(key: string): string {
  const parts = key.split("/");
  const filename = parts[parts.length - 1];
  // Remove UUID prefix if present
  const uuidPattern = /^[a-f0-9-]{36}-/;
  return filename.replace(uuidPattern, "");
}

function getFileIcon(key: string) {
  const ext = key.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
    return ImageIcon;
  }
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext || "")) {
    return FileTextIcon;
  }
  return FileIcon;
}

export function FileManager() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<StoredFile | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/v1/files`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const result = await response.json();
        setFiles(result.data?.files || []);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUploadComplete = useCallback(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDownload = async (file: StoredFile) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/v1/files/${file.key}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = getFileName(file.key);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleDelete = async (file: StoredFile) => {
    setDeleting(file.key);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}/api/v1/files/${file.key}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setFiles((prev) => prev.filter((f) => f.key !== file.key));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setDeleting(null);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <FileUpload onUpload={handleUploadComplete} maxFiles={5} maxSize={10 * 1024 * 1024} />

      <div className="flex items-center justify-between">
        <h3 className="font-medium">Your Files</h3>
        <Button variant="outline" size="sm" onClick={fetchFiles}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
          No files uploaded yet
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => {
                const FileIconComponent = getFileIcon(file.key);
                return (
                  <TableRow key={file.key}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileIconComponent className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{getFileName(file.key)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>{new Date(file.uploaded).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {deleting === file.key ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(file)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm && getFileName(deleteConfirm.key)}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

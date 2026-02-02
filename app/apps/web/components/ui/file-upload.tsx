"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  FileIcon,
  ImageIcon,
  FileTextIcon,
  FileArchiveIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface UploadedFile {
  key: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

interface FileUploadProps {
  onUpload?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: string;
  organizationId?: string;
  className?: string;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  "image/": ImageIcon,
  "text/": FileTextIcon,
  "application/pdf": FileTextIcon,
  "application/zip": FileArchiveIcon,
  "application/x-rar": FileArchiveIcon,
};

function getFileIcon(type: string) {
  for (const [prefix, Icon] of Object.entries(FILE_ICONS)) {
    if (type.startsWith(prefix)) return Icon;
  }
  return FileIcon;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  onUpload,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = "*/*",
  organizationId,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadedFile> => {
      const uploadedFile: UploadedFile = {
        key: "",
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
      };

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

        // Get presigned URL
        const urlResponse = await fetch(`${apiUrl}/api/v1/files/upload-url`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            organizationId,
          }),
        });

        if (!urlResponse.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { data: uploadData } = await urlResponse.json();
        uploadedFile.key = uploadData.key;

        // Upload file
        const uploadResponse = await fetch(`${apiUrl}/api/v1/files/${uploadData.key}`, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Upload failed");
        }

        uploadedFile.status = "success";
        uploadedFile.progress = 100;
      } catch (error) {
        uploadedFile.status = "error";
        uploadedFile.error = error instanceof Error ? error.message : "Upload failed";
      }

      return uploadedFile;
    },
    [organizationId]
  );

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList) return;

      const newFiles = Array.from(fileList).slice(0, maxFiles - files.length);
      const validFiles: File[] = [];

      for (const file of newFiles) {
        if (file.size > maxSize) {
          alert(`${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // Add files to state immediately with uploading status
      const uploadingFiles: UploadedFile[] = validFiles.map((file) => ({
        key: "",
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...uploadingFiles]);

      // Upload files
      const uploadedFiles = await Promise.all(validFiles.map(uploadFile));

      // Update state with results
      setFiles((prev) => {
        const updated = [...prev];
        for (let i = 0; i < uploadedFiles.length; i++) {
          const idx = prev.findIndex(
            (f) => f.name === validFiles[i].name && f.status === "uploading"
          );
          if (idx !== -1) {
            updated[idx] = uploadedFiles[i];
          }
        }
        return updated;
      });

      onUpload?.(uploadedFiles.filter((f) => f.status === "success"));
    },
    [files.length, maxFiles, maxSize, onUpload, uploadFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleRemove = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Drop files here or click to upload</p>
            <p className="text-sm text-muted-foreground">
              Maximum {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Select Files
          </Button>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const FileIconComponent = getFileIcon(file.type);

            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileIconComponent className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  {file.status === "uploading" && (
                    <Progress value={file.progress} className="mt-1 h-1" />
                  )}
                  {file.error && <p className="text-xs text-destructive">{file.error}</p>}
                </div>

                <div className="flex items-center gap-2">
                  {file.status === "uploading" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {file.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {file.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

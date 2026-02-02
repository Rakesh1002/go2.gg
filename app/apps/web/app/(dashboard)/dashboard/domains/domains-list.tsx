"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Globe,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Trash2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useDomains, type Domain } from "@/hooks/use-queries";
import { useDeleteDomain, useVerifyDomain } from "@/hooks/use-mutations";

export function DomainsList() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);

  // Use React Query for data fetching
  const { data: domains = [], isLoading: loading } = useDomains();
  const deleteDomainMutation = useDeleteDomain();
  const verifyDomainMutation = useVerifyDomain();

  async function handleVerifyDomain(id: string) {
    try {
      const result = await verifyDomainMutation.mutateAsync(id);
      if (result.verified) {
        toast.success("Domain verified successfully!");
      } else {
        toast.error(result.message || "Verification pending");
      }
    } catch {
      // Error toast is handled by the mutation hook
    }
  }

  function handleDeleteClick(domain: Domain) {
    setDomainToDelete(domain);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!domainToDelete) return;

    try {
      await deleteDomainMutation.mutateAsync(domainToDelete.id);
      toast.success("Domain removed");
    } catch {
      // Error toast is handled by the mutation hook
    } finally {
      setDomainToDelete(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading domains...</div>;
  }

  if (domains.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No custom domains</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Add your own domain to create branded short links like{" "}
            <span className="font-medium">link.yoursite.com/go</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove this domain?"
        description={`This will remove "${domainToDelete?.domain}" from your account. Any links using this domain will need to be updated.`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
      {domains.map((domain) => (
        <Card key={domain.id}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {domain.domain}
                  <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </a>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {domain.verificationStatus === "verified" ? (
                    <Badge variant="default" className="gap-1 bg-green-500">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : domain.verificationStatus === "failed" ? (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Failed
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {domain.verificationStatus !== "verified" && (
                  <DropdownMenuItem onClick={() => handleVerifyDomain(domain.id)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Verify now
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(domain)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          {domain.verificationStatus !== "verified" && (
            <CardContent className="pt-0">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
                <p className="text-sm font-medium">
                  Add the following DNS records to verify ownership:
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">
                      TXT
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-muted-foreground break-all">
                        {domain.dnsRecords.verification.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm font-mono break-all">
                          {domain.dnsRecords.verification.value}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyToClipboard(domain.dnsRecords.verification.value)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0">
                      CNAME
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-muted-foreground">
                        {domain.dnsRecords.cname.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm font-mono">{domain.dnsRecords.cname.value}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyToClipboard(domain.dnsRecords.cname.value)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVerifyDomain(domain.id)}
                  disabled={verifyDomainMutation.isPending}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${verifyDomainMutation.isPending ? "animate-spin" : ""}`}
                  />
                  Check verification
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

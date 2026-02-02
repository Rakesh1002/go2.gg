"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLinks, type Link } from "@/hooks/use-queries";
import { useDeleteLink } from "@/hooks/use-mutations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/ui/copy-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FilterSelect, ActiveFilters, type FilterCategory } from "@/components/ui/filter-select";
import { AnimatedEmptyState, LinkPreviewCard } from "@/components/ui/animated-empty-state";
import { CreateLinkDialog, LinksToolbar } from "@/components/links";
import {
  CardList,
  CardListItem,
  CardListHeader,
  SelectionToolbar,
} from "@/components/ui/card-list";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Copy,
  ExternalLink,
  BarChart2,
  Pencil,
  Trash2,
  QrCode,
  Link2,
  Lock,
  Clock,
  MousePointer,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Tag,
  Globe,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "cards";

// Filter categories for the FilterSelect
const filterCategories: FilterCategory[] = [
  {
    id: "status",
    label: "Status",
    icon: <Tag className="h-4 w-4" />,
    options: [
      { id: "active", label: "Active" },
      { id: "expired", label: "Expired" },
      { id: "password", label: "Password Protected" },
    ],
    multiSelect: true,
  },
  {
    id: "domain",
    label: "Domain",
    icon: <Globe className="h-4 w-4" />,
    options: [], // Will be populated dynamically
    multiSelect: true,
  },
  {
    id: "date",
    label: "Created",
    icon: <Calendar className="h-4 w-4" />,
    options: [
      { id: "today", label: "Today" },
      { id: "week", label: "This week" },
      { id: "month", label: "This month" },
      { id: "year", label: "This year" },
    ],
    multiSelect: false,
  },
];

// Sample links for empty state animation
const sampleLinks = [
  {
    shortUrl: "go2.gg/launch",
    destinationUrl: "https://yoursite.com/product-launch",
    clicks: 1234,
  },
  { shortUrl: "go2.gg/demo", destinationUrl: "https://calendly.com/yourteam/demo", clicks: 892 },
  {
    shortUrl: "go2.gg/sale",
    destinationUrl: "https://yoursite.com/black-friday-sale",
    clicks: 567,
  },
];

export function LinksTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<Link | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Query params for React Query
  const queryParams = useMemo(
    () => ({
      page: Number(searchParams.get("page") ?? "1"),
      perPage: 20,
      search: searchParams.get("search") ?? undefined,
    }),
    [searchParams]
  );

  // Use React Query for data fetching
  const { data, isLoading: loading } = useLinks(queryParams);
  const deleteLink = useDeleteLink();

  // Extract data from query result
  const links = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, perPage: 20, total: 0, hasMore: false };
  const deletingId = deleteLink.isPending ? linkToDelete?.id : null;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  }

  function handleDeleteClick(link: Link) {
    setLinkToDelete(link);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!linkToDelete) return;

    try {
      await deleteLink.mutateAsync(linkToDelete.id);
      toast.success("Link deleted successfully");
      // React Query will automatically invalidate and refetch related queries
    } catch (error) {
      console.error("Error deleting link:", error);
      // Error toast is handled by the mutation hook
    } finally {
      setLinkToDelete(null);
    }
  }

  if (loading) {
    return <LinksTableSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete this link?"
        description={`This will permanently delete "${linkToDelete?.shortUrl}". This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* Search and filters toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search links..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary" size="icon" className="shrink-0">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex items-center gap-2">
          {/* Filter select */}
          <FilterSelect
            categories={filterCategories}
            selectedFilters={selectedFilters}
            onFiltersChange={setSelectedFilters}
            placeholder="Filter links..."
          />

          {/* View mode toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as ViewMode)}
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="list" aria-label="List view" size="sm">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="cards" aria-label="Card view" size="sm">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Active filters display */}
      <ActiveFilters
        categories={filterCategories}
        selectedFilters={selectedFilters}
        onFiltersChange={setSelectedFilters}
      />

      {/* Empty state */}
      {links.length === 0 ? (
        <>
          <AnimatedEmptyState
            icon={<Link2 className="h-6 w-6" />}
            title="No links yet"
            description="Create your first short link to start tracking clicks and managing your URLs"
            primaryActionLabel="Create Link"
            onPrimaryAction={() => setCreateDialogOpen(true)}
            secondaryActionLabel="Learn more"
            secondaryActionHref="/docs"
            cardContent={sampleLinks.map((link) => (
              <LinkPreviewCard
                key={link.shortUrl}
                shortUrl={link.shortUrl}
                destinationUrl={link.destinationUrl}
                clicks={link.clicks}
              />
            ))}
          />
          <CreateLinkDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
        </>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {links.map((link, index) => (
              <LinkCard
                key={link.id}
                link={link}
                index={index}
                isDeleting={deletingId === link.id}
                onDelete={() => handleDeleteClick(link)}
                router={router}
              />
            ))}
          </div>

          {/* Desktop Card List View */}
          {viewMode === "cards" && (
            <div className="hidden md:block">
              <CardList
                variant="compact"
                selectable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                allIds={links.map((l) => l.id)}
              >
                <CardListHeader showSelectAll totalCount={links.length}>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-medium">{meta.total} links</span>
                  </div>
                </CardListHeader>
                {links.map((link) => (
                  <CardListItem
                    key={link.id}
                    id={link.id}
                    className={cn(deletingId === link.id && "opacity-50")}
                  >
                    <div className="flex items-center gap-4">
                      {/* Favicon / Icon */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Link2 className="h-5 w-5 text-muted-foreground" />
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <a
                            href={link.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-foreground hover:text-primary truncate"
                          >
                            {link.domain}/{link.slug}
                          </a>
                          <CopyButton
                            value={link.shortUrl}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          />
                          {link.hasPassword && (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          {link.expiresAt && (
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {link.title || link.destinationUrl}
                        </p>
                      </div>

                      {/* Click count */}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MousePointer className="h-4 w-4" />
                        <span className="font-medium tabular-nums">
                          {link.clickCount.toLocaleString()}
                        </span>
                      </div>

                      {/* Created date */}
                      <div className="hidden lg:block text-sm text-muted-foreground w-28 text-right">
                        {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                            disabled={deletingId === link.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              navigator.clipboard
                                .writeText(link.shortUrl)
                                .then(() => toast.success("Copied!"))
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/links/${link.id}`)}
                          >
                            <BarChart2 className="mr-2 h-4 w-4" />
                            View analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/links/${link.id}/qr`)}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            QR Code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/links/${link.id}/edit`)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(link)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardListItem>
                ))}
              </CardList>

              {/* Selection toolbar */}
              <SelectionToolbar
                selectedCount={selectedIds.length}
                onClearSelection={() => setSelectedIds([])}
                actions={
                  <>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      Add Tags
                    </Button>
                    <Button variant="destructive" size="sm" className="h-8 gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </>
                }
              />
            </div>
          )}

          {/* Desktop Table View */}
          <div
            className={cn(
              "hidden md:block rounded-xl border overflow-hidden",
              viewMode !== "list" && "md:hidden"
            )}
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[300px]">Short Link</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link, index) => (
                  <TableRow
                    key={link.id}
                    className={cn(
                      "group transition-all duration-200 animate-fade-in-up",
                      deletingId === link.id && "opacity-50 pointer-events-none"
                    )}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <a
                              href={link.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline"
                            >
                              {link.shortUrl}
                            </a>
                            <CopyButton
                              value={link.shortUrl}
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              showToast
                            />
                          </div>
                          {link.title && (
                            <span className="text-sm text-muted-foreground">{link.title}</span>
                          )}
                          <div className="flex gap-1 mt-1">
                            {link.hasPassword && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Lock className="h-2.5 w-2.5" />
                                Protected
                              </Badge>
                            )}
                            {link.expiresAt && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                Expires
                              </Badge>
                            )}
                            {link.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[300px]">
                        <span className="truncate text-muted-foreground">
                          {link.destinationUrl}
                        </span>
                        <a
                          href={link.destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <MousePointer className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-semibold tabular-nums">
                          {link.clickCount.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() =>
                              navigator.clipboard
                                .writeText(link.shortUrl)
                                .then(() => toast.success("Copied!"))
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/links/${link.id}`)}
                          >
                            <BarChart2 className="mr-2 h-4 w-4" />
                            View analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/links/${link.id}/qr`)}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            QR Code
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/links/${link.id}/edit`)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(link)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Floating Toolbar with Pagination and Bulk Actions */}
      <LinksToolbar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        pagination={{
          page: meta.page,
          perPage: meta.perPage,
          total: meta.total,
          hasMore: meta.hasMore,
        }}
        onPageChange={(newPage) => {
          const params = new URLSearchParams(searchParams);
          params.set("page", String(newPage));
          router.push(`?${params.toString()}`);
        }}
        loading={loading}
        onBulkDelete={async (ids) => {
          // Show confirmation and delete
          if (confirm(`Delete ${ids.length} link${ids.length > 1 ? "s" : ""}?`)) {
            try {
              // Delete links sequentially
              for (const id of ids) {
                await deleteLink.mutateAsync(id);
              }
              toast.success(`${ids.length} link${ids.length > 1 ? "s" : ""} deleted`);
              setSelectedIds([]);
            } catch (error) {
              console.error("Failed to delete links:", error);
            }
          }
        }}
        onBulkTag={(ids) => {
          // TODO: Implement tag dialog
          toast.info(`Tag ${ids.length} links - Coming soon`);
        }}
      />
    </div>
  );
}

/** Mobile Link Card */
interface LinkCardProps {
  link: Link;
  index: number;
  isDeleting: boolean;
  onDelete: () => void;
  router: ReturnType<typeof useRouter>;
}

function LinkCard({ link, index, isDeleting, onDelete, router }: LinkCardProps) {
  return (
    <Card
      className={cn(
        "animate-fade-in-up transition-all duration-200",
        isDeleting && "opacity-50 scale-95"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Short URL */}
            <div className="flex items-center gap-2">
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline truncate"
              >
                {link.shortUrl}
              </a>
              <CopyButton value={link.shortUrl} className="h-7 w-7 shrink-0" />
            </div>

            {/* Title */}
            {link.title && <p className="text-sm text-muted-foreground truncate">{link.title}</p>}

            {/* Destination */}
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <a
                href={link.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground truncate"
              >
                {link.destinationUrl}
              </a>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {link.hasPassword && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  Protected
                </Badge>
              )}
              {link.expiresAt && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  Expires
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
              <div className="flex items-center gap-1">
                <MousePointer className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{link.clickCount}</span>
                <span>clicks</span>
              </div>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}</span>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(link.shortUrl).then(() => toast.success("Copied!"))
                }
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/links/${link.id}`)}>
                <BarChart2 className="mr-2 h-4 w-4" />
                View analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/links/${link.id}/qr`)}>
                <QrCode className="mr-2 h-4 w-4" />
                QR Code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/dashboard/links/${link.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

/** Loading skeleton */
function LinksTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-20" />
      </div>

      {/* Mobile skeletons */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={`mobile-skeleton-${i}`} className={`stagger-${i + 1}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-8 w-8" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop skeleton */}
      <div className="hidden md:block rounded-xl border overflow-hidden">
        <div className="p-4 bg-muted/50">
          <div className="grid grid-cols-5 gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12 ml-auto" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`desktop-skeleton-${i}`} className={`p-4 stagger-${i + 1}`}>
              <div className="grid grid-cols-5 gap-4 items-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-full max-w-[200px]" />
                <Skeleton className="h-4 w-12 ml-auto" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

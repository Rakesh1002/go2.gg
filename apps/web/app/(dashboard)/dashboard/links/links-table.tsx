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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/ui/copy-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FilterSelect, ActiveFilters, type FilterCategory } from "@/components/ui/filter-select";
import { AnimatedEmptyState, LinkPreviewCard } from "@/components/ui/animated-empty-state";
import { CreateLinkDialog, LinksToolbar } from "@/components/links";
import { SelectionToolbar } from "@/components/ui/card-list";
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
  LayoutGrid,
  LayoutList,
  Tag,
  Globe,
  Calendar,
} from "lucide-react";
import { FolderPicker } from "@/components/folders/folder-picker";
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

  // Folder filter — read from URL so the picked folder survives nav.
  const folderParam = searchParams.get("folder");
  const folderFilter: string | "none" | null =
    folderParam === "none" ? "none" : folderParam || null;

  // Query params for React Query
  const queryParams = useMemo(
    () => ({
      page: Number(searchParams.get("page") ?? "1"),
      perPage: 20,
      search: searchParams.get("search") ?? undefined,
      folderId: folderFilter ?? undefined,
    }),
    [searchParams, folderFilter]
  );

  function handleFolderChange(value: string | "none" | null) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("folder", value);
    } else {
      params.delete("folder");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  }

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
        <form onSubmit={handleSearch} className="flex max-w-md flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
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
          {/* Folder filter — URL-driven so it survives navigation */}
          <div className="hidden w-[220px] sm:block">
            <FolderPicker
              value={folderFilter}
              onChange={handleFolderChange}
              includeNone
              placeholder="All folders"
            />
          </div>

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
          <div className="space-y-3 md:hidden">
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

          {/* Desktop Tile / Grid View */}
          {viewMode === "cards" && (
            <div className="hidden md:block">
              {/* Header with select-all + count */}
              <div className="mb-4 flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={
                      selectedIds.length > 0 && selectedIds.length === links.length
                    }
                    aria-label="Select all"
                    onCheckedChange={(checked) =>
                      setSelectedIds(checked ? links.map((l) => l.id) : [])
                    }
                  />
                  <span className="font-medium text-muted-foreground text-sm">
                    {meta.total} links
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {links.map((link, index) => {
                  const checked = selectedIds.includes(link.id);
                  return (
                    <Card
                      key={link.id}
                      className={cn(
                        "group relative animate-fade-in-up cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-md",
                        checked && "border-primary ring-1 ring-primary",
                        deletingId === link.id && "opacity-50",
                      )}
                      style={{ animationDelay: `${index * 0.03}s` }}
                      onClick={(e: React.MouseEvent) => {
                        const target = e.target as HTMLElement;
                        if (
                          target.closest(
                            "a, button, [role='checkbox'], [data-no-row-click]",
                          )
                        )
                          return;
                        router.push(`/dashboard/links/${link.id}`);
                      }}
                    >
                      <CardContent className="flex flex-col gap-3 p-5">
                        {/* Top row: checkbox + actions menu */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-3">
                            <Checkbox
                              checked={checked}
                              aria-label={`Select ${link.shortUrl}`}
                              onCheckedChange={(c) =>
                                setSelectedIds(
                                  c
                                    ? [...selectedIds, link.id]
                                    : selectedIds.filter((id) => id !== link.id),
                                )
                              }
                            />
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                              <Link2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
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
                                onClick={() =>
                                  router.push(`/dashboard/links/${link.id}/qr`)
                                }
                              >
                                <QrCode className="mr-2 h-4 w-4" />
                                QR Code
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/links/${link.id}/edit`)
                                }
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

                        {/* Title row: short URL → analytics */}
                        <div className="flex min-w-0 items-center gap-2">
                          <a
                            href={`/dashboard/links/${link.id}`}
                            className="truncate font-semibold text-base text-primary hover:underline"
                          >
                            {link.domain}/{link.slug}
                          </a>
                          <a
                            href={link.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-no-row-click
                            title="Open destination in new tab"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <CopyButton value={link.shortUrl} className="h-6 w-6" />
                        </div>

                        {/* Subtitle: title or destination */}
                        <p className="truncate text-muted-foreground text-sm">
                          {link.title || link.destinationUrl}
                        </p>

                        {/* Badges */}
                        {(link.hasPassword ||
                          link.expiresAt ||
                          (link.tags?.length ?? 0) > 0) && (
                          <div className="flex flex-wrap gap-1.5">
                            {link.hasPassword && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <Lock className="h-2.5 w-2.5" />
                                Protected
                              </Badge>
                            )}
                            {link.expiresAt && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Clock className="h-2.5 w-2.5" />
                                Expires
                              </Badge>
                            )}
                            {link.tags?.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Footer: clicks + age */}
                        <div className="mt-1 flex items-center justify-between border-t pt-3 text-muted-foreground text-sm">
                          <div className="flex items-center gap-1.5">
                            <MousePointer className="h-4 w-4" />
                            <span className="font-semibold text-foreground tabular-nums">
                              {link.clickCount.toLocaleString()}
                            </span>
                            <span>{link.clickCount === 1 ? "click" : "clicks"}</span>
                          </div>
                          <span>
                            {formatDistanceToNow(new Date(link.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

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
              "hidden overflow-hidden rounded-xl border md:block",
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
                      "group animate-fade-in-up transition-all duration-200",
                      deletingId === link.id && "pointer-events-none opacity-50"
                    )}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <a
                              href={`/dashboard/links/${link.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {link.shortUrl}
                            </a>
                            <a
                              href={link.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open destination in new tab"
                              className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <CopyButton
                              value={link.shortUrl}
                              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                              showToast
                            />
                          </div>
                          {link.title && (
                            <span className="text-muted-foreground text-sm">{link.title}</span>
                          )}
                          <div className="mt-1 flex gap-1">
                            {link.hasPassword && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <Lock className="h-2.5 w-2.5" />
                                Protected
                              </Badge>
                            )}
                            {link.expiresAt && (
                              <Badge variant="outline" className="gap-1 text-xs">
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
                      <div className="flex max-w-[300px] items-center gap-2">
                        <span className="truncate text-muted-foreground">
                          {link.destinationUrl}
                        </span>
                        <a
                          href={link.destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
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
                            className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
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
        isDeleting && "scale-95 opacity-50"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            {/* Short URL */}
            <div className="flex items-center gap-2">
              <a
                href={`/dashboard/links/${link.id}`}
                className="truncate font-semibold text-primary hover:underline"
              >
                {link.shortUrl}
              </a>
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open destination in new tab"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <CopyButton value={link.shortUrl} className="h-7 w-7 shrink-0" />
            </div>

            {/* Title */}
            {link.title && <p className="truncate text-muted-foreground text-sm">{link.title}</p>}

            {/* Destination */}
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <a
                href={link.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-muted-foreground text-sm hover:text-foreground"
              >
                {link.destinationUrl}
              </a>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              {link.hasPassword && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Lock className="h-2.5 w-2.5" />
                  Protected
                </Badge>
              )}
              {link.expiresAt && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Clock className="h-2.5 w-2.5" />
                  Expires
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 pt-1 text-muted-foreground text-sm">
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
        <Skeleton className="h-10 max-w-md flex-1" />
        <Skeleton className="h-10 w-20" />
      </div>

      {/* Mobile skeletons */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={`mobile-skeleton-${i}`} className={`stagger-${i + 1}`}>
            <CardContent className="space-y-3 p-4">
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
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <div className="bg-muted/50 p-4">
          <div className="grid grid-cols-5 gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`desktop-skeleton-${i}`} className={`p-4 stagger-${i + 1}`}>
              <div className="grid grid-cols-5 items-center gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-full max-w-[200px]" />
                <Skeleton className="ml-auto h-4 w-12" />
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

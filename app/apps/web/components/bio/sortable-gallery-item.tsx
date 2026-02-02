"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GripVertical,
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link2,
  Type,
  Minus,
  Youtube,
  Image,
} from "lucide-react";

interface GalleryItem {
  id: string;
  type: "link" | "header" | "divider" | "embed" | "image";
  title: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  iconName: string | null;
  position: number;
  isVisible: boolean;
  clickCount: number;
  embedType: string | null;
  embedData: Record<string, unknown> | null;
}

interface SortableGalleryItemProps {
  item: GalleryItem;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}

const ITEM_ICONS: Record<string, typeof Link2> = {
  link: Link2,
  header: Type,
  divider: Minus,
  embed: Youtube,
  image: Image,
};

export function SortableGalleryItem({
  item,
  onToggleVisibility,
  onDelete,
  onEdit,
}: SortableGalleryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const ItemIcon = ITEM_ICONS[item.type] ?? Link2;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-4 p-4 bg-background border-b last:border-b-0",
        isDragging && "opacity-50 bg-muted shadow-lg z-50",
        !item.isVisible && "opacity-50"
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
        <ItemIcon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {item.title || (item.type === "divider" ? "Divider" : "Untitled")}
        </p>
        {item.url && <p className="text-sm text-muted-foreground truncate">{item.url}</p>}
      </div>

      {item.type === "link" && (
        <Badge variant="secondary" className="shrink-0">
          {item.clickCount} clicks
        </Badge>
      )}

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleVisibility(item.id, !item.isVisible)}
        >
          {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(item.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(item.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

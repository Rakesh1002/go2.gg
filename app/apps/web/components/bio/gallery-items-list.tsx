"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent } from "@/components/ui/card";
import { Link2 } from "lucide-react";
import { SortableGalleryItem } from "./sortable-gallery-item";

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

interface GalleryItemsListProps {
  items: GalleryItem[];
  onReorder: (items: Array<{ id: string; position: number }>) => Promise<void>;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function GalleryItemsList({
  items,
  onReorder,
  onToggleVisibility,
  onDelete,
  onEdit,
}: GalleryItemsListProps) {
  const [localItems, setLocalItems] = useState(items);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync local state when items prop changes
  if (items !== localItems && !activeId) {
    setLocalItems(items);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex = localItems.findIndex((item) => item.id === active.id);
        const newIndex = localItems.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(localItems, oldIndex, newIndex);
        setLocalItems(newItems);

        // Call API to persist the new order
        const reorderedItems = newItems.map((item, index) => ({
          id: item.id,
          position: index,
        }));

        await onReorder(reorderedItems);
      }
    },
    [localItems, onReorder]
  );

  const activeItem = activeId ? localItems.find((item) => item.id === activeId) : null;

  if (localItems.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Link2 className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No items yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add links, headers, or embeds to your bio page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="divide-y">
              {localItems.map((item) => (
                <SortableGalleryItem
                  key={item.id}
                  item={item}
                  onToggleVisibility={onToggleVisibility}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeItem ? (
              <div className="rounded-lg border bg-background shadow-lg">
                <SortableGalleryItem
                  item={activeItem}
                  onToggleVisibility={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type KeyboardShortcutListener = {
  id: string;
  key: string | string[];
  enabled?: boolean;
  priority?: number;
  modal?: boolean;
  sheet?: boolean;
};

interface KeyboardShortcutContextType {
  listeners: KeyboardShortcutListener[];
  setListeners: Dispatch<SetStateAction<KeyboardShortcutListener[]>>;
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextType>({
  listeners: [],
  setListeners: () => {},
});

export function KeyboardShortcutProvider({ children }: { children: ReactNode }) {
  const [listeners, setListeners] = useState<KeyboardShortcutListener[]>([]);

  return (
    <KeyboardShortcutContext.Provider value={{ listeners, setListeners }}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
}

/**
 * Hook to register keyboard shortcuts with priority-based conflict resolution.
 *
 * Features:
 * - Priority-based listeners (higher priority wins)
 * - Modal/Sheet awareness (different contexts)
 * - Ignores input/textarea/contentEditable
 * - Meta/Ctrl/Alt key combinations
 *
 * @param key - Single key or array of keys (e.g., "c", ["meta+k", "ctrl+k"])
 * @param callback - Function to call when shortcut is triggered
 * @param options - Configuration options
 *
 * @example
 * // Simple shortcut
 * useKeyboardShortcut("c", () => openCreateDialog());
 *
 * // With modifiers
 * useKeyboardShortcut(["meta+k", "ctrl+k"], () => openCommandPalette());
 *
 * // With options
 * useKeyboardShortcut("Escape", () => closeModal(), { modal: true, priority: 10 });
 */
export function useKeyboardShortcut(
  key: string | string[],
  callback: (e: KeyboardEvent) => void,
  options: Pick<KeyboardShortcutListener, "enabled" | "priority" | "modal" | "sheet"> = {}
) {
  const id = useId();
  const { listeners, setListeners } = useContext(KeyboardShortcutContext);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (options.enabled === false) return;

      const target = e.target as HTMLElement;
      const existingModalBackdrop = document.getElementById("modal-backdrop");
      const existingSheetBackdrop = document.querySelector("[data-sheet-overlay]");

      // Ignore shortcuts if the user is typing in an input or textarea
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Allow Escape key even in inputs
        if (e.key !== "Escape") return;
      }

      // Check modal/sheet context matches
      if (!!existingModalBackdrop !== !!options.modal) return;
      if (!!existingSheetBackdrop !== !!options.sheet) return;

      // Build the pressed key combination
      const pressedKey = [
        ...(e.metaKey ? ["meta"] : []),
        ...(e.ctrlKey ? ["ctrl"] : []),
        ...(e.altKey ? ["alt"] : []),
        ...(e.shiftKey ? ["shift"] : []),
        e.key.toLowerCase(),
      ].join("+");

      // Also check just the key for simple shortcuts
      const simpleKey = e.key.toLowerCase();

      // Ignore shortcut if it doesn't match this listener
      const keys = Array.isArray(key) ? key.map((k) => k.toLowerCase()) : [key.toLowerCase()];
      if (!keys.includes(pressedKey) && !keys.includes(simpleKey)) return;

      // Find enabled listeners that match the key
      const matchingListeners = listeners.filter((l) => {
        if (l.enabled === false) return false;
        if (!!existingModalBackdrop !== !!l.modal) return false;
        if (!!existingSheetBackdrop !== !!l.sheet) return false;

        const listenerKeys = Array.isArray(l.key)
          ? l.key.map((k) => k.toLowerCase())
          : [l.key.toLowerCase()];
        return listenerKeys.includes(pressedKey) || listenerKeys.includes(simpleKey);
      });

      if (!matchingListeners.length) return;

      // Sort by priority (higher wins)
      const sortedListeners = [...matchingListeners].sort(
        (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
      );

      // Only the top priority listener should handle the event
      if (sortedListeners[0].id !== id) return;

      e.preventDefault();
      callback(e);
    },
    [key, listeners, id, callback, options.enabled, options.modal, options.sheet]
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // Register/unregister the listener
  useEffect(() => {
    setListeners((prev) => [
      ...prev.filter((listener) => listener.id !== id),
      { id, key, ...options },
    ]);

    return () => setListeners((prev) => prev.filter((listener) => listener.id !== id));
  }, [id, JSON.stringify(key), options.enabled, options.priority, options.modal, options.sheet]);
}

/**
 * Display component for keyboard shortcuts
 */
export function Kbd({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={`pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ${className ?? ""}`}
    >
      {children}
    </kbd>
  );
}

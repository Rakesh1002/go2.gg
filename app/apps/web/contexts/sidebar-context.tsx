"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = "go2_sidebar_collapsed";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
    setIsInitialized(true);
  }, []);

  // Save state to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    }
  }, [isCollapsed, isInitialized]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCollapsed]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

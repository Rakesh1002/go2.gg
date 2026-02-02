"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Theme {
  id: string;
  name: string;
  description: string;
  preview: {
    bg: string;
    text: string;
    button: string;
  };
}

const THEMES: Theme[] = [
  {
    id: "default",
    name: "Default",
    description: "Clean and minimal",
    preview: { bg: "bg-white", text: "text-gray-900", button: "bg-gray-900" },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-simple design",
    preview: { bg: "bg-gray-50", text: "text-gray-800", button: "bg-gray-200" },
  },
  {
    id: "gradient",
    name: "Gradient",
    description: "Beautiful color gradients",
    preview: {
      bg: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
      text: "text-white",
      button: "bg-white/20",
    },
  },
  {
    id: "dark",
    name: "Dark",
    description: "Dark mode styling",
    preview: { bg: "bg-gray-950", text: "text-white", button: "bg-gray-800" },
  },
  {
    id: "neon",
    name: "Neon",
    description: "Vibrant neon colors",
    preview: {
      bg: "bg-black",
      text: "text-green-400",
      button: "border-2 border-green-400",
    },
  },
  {
    id: "pastel",
    name: "Pastel",
    description: "Soft pastel colors",
    preview: {
      bg: "bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100",
      text: "text-gray-700",
      button: "bg-white/70",
    },
  },
];

interface ThemeSelectorProps {
  selectedTheme: string;
  onSelectTheme: (themeId: string) => void;
}

export function ThemeSelector({ selectedTheme, onSelectTheme }: ThemeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>Choose a theme for your bio page.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelectTheme(theme.id)}
              className={cn(
                "flex flex-col items-start gap-3 p-4 rounded-lg border transition-colors text-left",
                selectedTheme === theme.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                  : "border-muted hover:border-muted-foreground/50"
              )}
            >
              {/* Theme Preview */}
              <div
                className={cn(
                  "w-full h-16 rounded-md flex items-center justify-center",
                  theme.preview.bg
                )}
              >
                <div className={cn("w-3/4 h-4 rounded-full", theme.preview.button)} />
              </div>

              <div>
                <span className="font-medium">{theme.name}</span>
                <p className="text-xs text-muted-foreground">{theme.description}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { THEMES };

"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BIO_THEMES } from "@/lib/bio/themes";

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
          {BIO_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelectTheme(theme.id)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                selectedTheme === theme.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                  : "border-muted hover:border-muted-foreground/50"
              )}
            >
              {/* Theme Preview */}
              <div
                className={cn(
                  "flex h-16 w-full items-center justify-center rounded-md",
                  theme.preview.bg
                )}
              >
                <div className={cn("h-4 w-3/4 rounded-full", theme.preview.button)} />
              </div>

              <div>
                <span className="font-medium">{theme.name}</span>
                <p className="text-muted-foreground text-xs">{theme.description}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Backwards-compat re-export — prefer importing BIO_THEMES from
// "@/lib/bio/themes" directly in new code.
export { BIO_THEMES as THEMES } from "@/lib/bio/themes";

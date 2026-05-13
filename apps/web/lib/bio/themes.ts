// Single source of truth for bio-page themes. Both the dashboard theme
// selector (`components/bio/theme-selector.tsx`) and the public renderer
// (`app/bio/[slug]/bio-page-client.tsx`) read from here so they cannot drift
// (the previous twin-renderer drift left the "pastel" theme broken in prod).

export type BioThemeId =
  | "default"
  | "minimal"
  | "gradient"
  | "dark"
  | "neon"
  | "pastel"
  | "mono"
  | "sunset"
  | "forest"
  | "paper";

export interface BioThemePreview {
  bg: string;
  text: string;
  button: string;
}

export interface BioTheme {
  id: BioThemeId;
  name: string;
  description: string;
  /** Used by the dashboard theme card preview. */
  preview: BioThemePreview;
  /** Used by the public renderer to compose the rendered page. */
  styles: {
    background: string;
    text: string;
    card: string;
    cardHover: string;
    border: string;
  };
}

export const BIO_THEMES: BioTheme[] = [
  {
    id: "default",
    name: "Default",
    description: "Clean and minimal",
    preview: { bg: "bg-white", text: "text-gray-900", button: "bg-gray-900" },
    styles: {
      background: "bg-gray-50",
      text: "text-gray-900",
      card: "bg-white",
      cardHover: "hover:bg-gray-50",
      border: "border-gray-200",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-simple design",
    preview: { bg: "bg-gray-50", text: "text-gray-800", button: "bg-gray-200" },
    styles: {
      background: "bg-white",
      text: "text-gray-900",
      card: "bg-gray-100",
      cardHover: "hover:bg-gray-200",
      border: "border-gray-300",
    },
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
    styles: {
      background: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
      text: "text-white",
      card: "bg-white/20 backdrop-blur-sm",
      cardHover: "hover:bg-white/30",
      border: "border-white/30",
    },
  },
  {
    id: "dark",
    name: "Dark",
    description: "Dark mode styling",
    preview: { bg: "bg-gray-950", text: "text-white", button: "bg-gray-800" },
    styles: {
      background: "bg-gray-900",
      text: "text-white",
      card: "bg-gray-800",
      cardHover: "hover:bg-gray-700",
      border: "border-gray-700",
    },
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
    styles: {
      background: "bg-black",
      text: "text-white",
      card: "bg-gray-900 ring-1 ring-cyan-500/50",
      cardHover: "hover:ring-cyan-400",
      border: "border-cyan-500",
    },
  },
  {
    id: "pastel",
    name: "Pastel",
    description: "Soft pastel gradient",
    preview: {
      bg: "bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100",
      text: "text-gray-700",
      button: "bg-white/70",
    },
    styles: {
      background: "bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100",
      text: "text-gray-700",
      card: "bg-white/70 backdrop-blur-sm",
      cardHover: "hover:bg-white",
      border: "border-white",
    },
  },
  {
    id: "mono",
    name: "Mono",
    description: "Editorial black and white",
    preview: { bg: "bg-white", text: "text-black", button: "bg-black" },
    styles: {
      background: "bg-white",
      text: "text-black",
      card: "bg-white",
      cardHover: "hover:bg-gray-50",
      border: "border-black",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm dusk gradient",
    preview: {
      bg: "bg-gradient-to-b from-orange-300 via-rose-400 to-fuchsia-500",
      text: "text-white",
      button: "bg-white/30",
    },
    styles: {
      background: "bg-gradient-to-b from-orange-300 via-rose-400 to-fuchsia-500",
      text: "text-white",
      card: "bg-white/15 backdrop-blur-md",
      cardHover: "hover:bg-white/25",
      border: "border-white/40",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep green calm",
    preview: { bg: "bg-emerald-950", text: "text-emerald-50", button: "bg-emerald-700" },
    styles: {
      background: "bg-emerald-950",
      text: "text-emerald-50",
      card: "bg-emerald-900",
      cardHover: "hover:bg-emerald-800",
      border: "border-emerald-700",
    },
  },
  {
    id: "paper",
    name: "Paper",
    description: "Cream + serif type",
    preview: { bg: "bg-amber-50", text: "text-stone-900", button: "bg-stone-900" },
    styles: {
      background: "bg-amber-50",
      text: "text-stone-900",
      card: "bg-white",
      cardHover: "hover:bg-amber-100",
      border: "border-stone-300",
    },
  },
];

const DEFAULT_THEME = BIO_THEMES[0];

export function getBioTheme(id: string | null | undefined): BioTheme {
  return BIO_THEMES.find((t) => t.id === id) ?? DEFAULT_THEME;
}

/**
 * `themeConfig` lets a gallery override the preset's CSS values without
 * forking the whole theme. We resolve overrides as inline styles (so we don't
 * have to inject Tailwind classes at runtime).
 */
export interface BioThemeConfig {
  /** Hex color (e.g. "#ff0044") used for buttons and accents. */
  primaryColor?: string;
  /** Hex color for the page background. Beats the preset's bg if set. */
  backgroundColor?: string;
  /** Hex color for body text. */
  textColor?: string;
  /** Font family CSS value (e.g. "'Geist Mono', monospace"). */
  fontFamily?: string;
  /** Button corner shape. */
  buttonStyle?: "rounded" | "pill" | "square";
}

export function buttonRadiusClass(style: BioThemeConfig["buttonStyle"]): string {
  if (style === "pill") return "rounded-full";
  if (style === "square") return "rounded-none";
  return "rounded-xl";
}

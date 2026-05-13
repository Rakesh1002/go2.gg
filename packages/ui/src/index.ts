/**
 * @repo/ui - Shared UI Component Library
 *
 * This package provides:
 * - Primitives: Low-level components built on Radix UI
 * - Components: Higher-level composed components
 * - Patterns: Domain-specific UI patterns (auth, data display, etc.)
 * - Utilities: cn(), formatDate(), formatCurrency(), etc.
 *
 * Usage:
 * ```typescript
 * import { Button, Card, LoginForm, cn } from "@repo/ui";
 * ```
 */

// Utilities
export { cn, formatDate, formatCurrency, truncate } from "./utils.js";

// Primitives
export * from "./primitives/index.js";

// Components
export * from "./components/index.js";

// Patterns
export * from "./patterns/index.js";

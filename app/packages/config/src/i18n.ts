/**
 * i18n Configuration
 *
 * Internationalization configuration for multi-language support.
 * This is designed to be i18n-ready but can be extended with full
 * translation support using libraries like next-intl or react-i18next.
 */

/**
 * Supported locales
 */
export const locales = ["en", "es", "fr", "de", "ja", "zh"] as const;

export type Locale = (typeof locales)[number];

/**
 * Default locale
 */
export const defaultLocale: Locale = "en";

/**
 * Locale names for display
 */
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  zh: "中文",
};

/**
 * Check if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Get locale from Accept-Language header
 */
export function getLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, qValue] = lang.trim().split(";q=");
      return {
        code: code?.split("-")[0]?.toLowerCase() ?? "",
        q: qValue ? parseFloat(qValue) : 1,
      };
    })
    .sort((a, b) => b.q - a.q);

  // Find first matching locale
  for (const lang of languages) {
    if (isValidLocale(lang.code)) {
      return lang.code;
    }
  }

  return defaultLocale;
}

/**
 * Currency configuration by locale
 */
export const localeCurrencies: Record<Locale, string> = {
  en: "USD",
  es: "EUR",
  fr: "EUR",
  de: "EUR",
  ja: "JPY",
  zh: "CNY",
};

/**
 * Date format configuration by locale
 */
export const localeDateFormats: Record<Locale, Intl.DateTimeFormatOptions> = {
  en: { month: "long", day: "numeric", year: "numeric" },
  es: { day: "numeric", month: "long", year: "numeric" },
  fr: { day: "numeric", month: "long", year: "numeric" },
  de: { day: "numeric", month: "long", year: "numeric" },
  ja: { year: "numeric", month: "long", day: "numeric" },
  zh: { year: "numeric", month: "long", day: "numeric" },
};

/**
 * Format a date for a specific locale
 */
export function formatDate(date: Date, locale: Locale = defaultLocale): string {
  return new Intl.DateTimeFormat(locale, localeDateFormats[locale]).format(date);
}

/**
 * Format currency for a specific locale
 */
export function formatCurrency(
  amount: number,
  currency?: string,
  locale: Locale = defaultLocale
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency ?? localeCurrencies[locale],
  }).format(amount);
}

/**
 * Example translation keys (for type-safety)
 * In production, you'd use a proper i18n library
 */
export interface TranslationKeys {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
  };
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    forgotPassword: string;
    resetPassword: string;
  };
  errors: {
    notFound: string;
    unauthorized: string;
    forbidden: string;
    serverError: string;
  };
}

/**
 * English translations (default)
 */
export const en: TranslationKeys = {
  common: {
    loading: "Loading...",
    error: "An error occurred",
    success: "Success!",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    back: "Back",
    next: "Next",
  },
  auth: {
    signIn: "Sign in",
    signUp: "Sign up",
    signOut: "Sign out",
    forgotPassword: "Forgot password?",
    resetPassword: "Reset password",
  },
  errors: {
    notFound: "Page not found",
    unauthorized: "Please sign in to continue",
    forbidden: "You don't have permission to access this resource",
    serverError: "Something went wrong. Please try again later.",
  },
};

/**
 * Get translations for a locale
 * In production, this would load from JSON files or a CMS
 */
export function getTranslations(locale: Locale = defaultLocale): TranslationKeys {
  // For now, just return English
  // In production, you'd load the correct translations
  return en;
}

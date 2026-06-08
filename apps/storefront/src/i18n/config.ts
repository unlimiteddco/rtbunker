export const locales = ['es', 'en', 'fr'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'es'

/** Mapping a códigos ISO usados por Medusa para regiones / traducciones. */
export const localeToMedusaLanguage: Record<Locale, string> = {
  es: 'es',
  en: 'en',
  fr: 'fr',
}

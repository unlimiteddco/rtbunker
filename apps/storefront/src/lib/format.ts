/**
 * Formatea un importe en la moneda dada. Resiliente a inputs no válidos
 * (currency vacío, locale malformado) para no romper el render durante el SSR
 * cuando un calculated_price todavía no llegó.
 */
export function formatMoney(
  amount: number,
  currencyCode: string,
  locale = 'es-ES',
): string {
  const safeCurrency =
    typeof currencyCode === 'string' && currencyCode.length === 3
      ? currencyCode.toUpperCase()
      : 'EUR'
  const safeLocale = typeof locale === 'string' && locale.length >= 2 ? locale : 'es-ES'
  try {
    return new Intl.NumberFormat(safeLocale, {
      style: 'currency',
      currency: safeCurrency,
    }).format(Number.isFinite(amount) ? amount : 0)
  } catch {
    return `${amount?.toFixed?.(2) ?? '0.00'} €`
  }
}

/**
 * Datos bancarios para el pago por transferencia. Única fuente: variables de
 * entorno del backend. Se exponen al storefront vía `GET /store/bank-transfer`
 * y se usan en el email de confirmación de pedido.
 *
 * - BANK_TRANSFER_HOLDER  titular de la cuenta
 * - BANK_TRANSFER_IBAN    IBAN (si está vacío, la transferencia está desactivada)
 * - BANK_TRANSFER_BANK    nombre del banco (opcional)
 * - BANK_TRANSFER_BIC     BIC/SWIFT (opcional)
 */
export type BankTransferDetails = {
  enabled: boolean
  holder: string | null
  iban: string | null
  bank: string | null
  bic: string | null
}

const clean = (v: string | undefined) => {
  const s = v?.trim()
  return s ? s : null
}

export function getBankTransferDetails(): BankTransferDetails {
  const iban = clean(process.env.BANK_TRANSFER_IBAN)
  return {
    enabled: Boolean(iban),
    holder: clean(process.env.BANK_TRANSFER_HOLDER),
    iban,
    bank: clean(process.env.BANK_TRANSFER_BANK),
    bic: clean(process.env.BANK_TRANSFER_BIC),
  }
}

/** Valor de `order.metadata.payment_method` para pedidos por transferencia. */
export const BANK_TRANSFER_METHOD = 'bank_transfer'

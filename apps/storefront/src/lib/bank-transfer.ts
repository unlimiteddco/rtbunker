import { sdk } from '@/lib/medusa'

/**
 * Datos del pago por transferencia bancaria. Única fuente: variables de
 * entorno del backend, expuestas en `GET /store/bank-transfer`.
 */
export interface BankTransferInfo {
  enabled: boolean
  holder: string | null
  iban: string | null
  bank: string | null
  bic: string | null
}

/** Valor de `cart.metadata.payment_method` / `order.metadata.payment_method`. */
export const BANK_TRANSFER_METHOD = 'bank_transfer'

/** Proveedor manual de Medusa usado para transferencia (y pedidos a 0 €). */
export const MANUAL_PAYMENT_PROVIDER = 'pp_system_default'

export async function getBankTransferInfo(): Promise<BankTransferInfo | null> {
  try {
    return await sdk.client.fetch<BankTransferInfo>('/store/bank-transfer', {
      cache: 'no-store',
    })
  } catch {
    return null
  }
}

/** Agrupa el IBAN en bloques de 4 para leerlo mejor. */
export function formatIban(iban: string): string {
  return iban
    .replace(/\s+/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

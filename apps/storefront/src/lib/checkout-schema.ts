import { z } from 'zod'

import { COUNTRIES } from './countries'
import { isValidSpanishId, normalizeSpanishId } from './spanish-id'

const countryCodes = COUNTRIES.map((c) => c.code) as [string, ...string[]]

export const addressSchema = z
  .object({
    email: z.string().email('Email inválido'),
    phone: z.string().optional().or(z.literal('')),
    first_name: z.string().min(1, 'Requerido'),
    last_name: z.string().min(1, 'Requerido'),
    /** DNI / NIE / CIF — obligatorio para factura en España (regla negocio §5.12). */
    dni: z
      .string()
      .min(1, 'Necesitamos tu DNI para la factura')
      .refine((v) => isValidSpanishId(v), 'DNI, NIE o CIF no válido'),
    address_1: z.string().min(3, 'Demasiado corto'),
    address_2: z.string().optional().or(z.literal('')),
    city: z.string().min(1, 'Requerido'),
    postal_code: z.string().min(3, 'Código postal inválido'),
    country_code: z.enum(countryCodes),
  })
  .transform((data) => ({
    ...data,
    dni: normalizeSpanishId(data.dni),
  }))

export type AddressFormValues = z.infer<typeof addressSchema>

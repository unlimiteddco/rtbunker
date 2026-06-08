/** Lista mínima de países que vendemos. Filtrar/ampliar según las regiones de Medusa. */
export const COUNTRIES = [
  { code: 'es', name: 'España' },
  { code: 'pt', name: 'Portugal' },
  { code: 'fr', name: 'Francia' },
  { code: 'it', name: 'Italia' },
  { code: 'de', name: 'Alemania' },
  { code: 'nl', name: 'Países Bajos' },
  { code: 'be', name: 'Bélgica' },
  { code: 'ie', name: 'Irlanda' },
  { code: 'at', name: 'Austria' },
  { code: 'gb', name: 'Reino Unido' },
  { code: 'us', name: 'Estados Unidos' },
] as const

export type CountryCode = (typeof COUNTRIES)[number]['code']

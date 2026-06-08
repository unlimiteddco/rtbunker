import './globals.css'

import type { ReactNode } from 'react'

/**
 * Layout raíz: pass-through. `<html>` y la fuente se montan en /[locale]/layout.tsx
 * para poder setear `lang` dinámicamente.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}

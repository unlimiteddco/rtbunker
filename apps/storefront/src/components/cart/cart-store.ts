'use client'

import { useSyncExternalStore } from 'react'

/**
 * Mini-store global para el drawer del carrito. Sin dependencias externas:
 * un EventTarget nos basta para abrir el drawer desde cualquier componente
 * cliente (PDP, mini-cart, header).
 */
const target = typeof window === 'undefined' ? null : new EventTarget()

let _open = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function openCartDrawer() {
  _open = true
  emit()
}

export function closeCartDrawer() {
  _open = false
  emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot() {
  return _open
}

export function useCartDrawerOpen() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

// touch para silenciar lint si no se usa target en algún build
export const _drawerTarget = target

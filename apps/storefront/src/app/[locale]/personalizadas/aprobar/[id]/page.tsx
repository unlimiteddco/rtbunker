import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

import { ApprovalView } from '@/components/personalizadas/approval-view'
import { sdk } from '@/lib/medusa'

export const metadata: Metadata = {
  title: 'Aprobar mockup · RT Bunker',
  robots: { index: false, follow: false },
}

export const revalidate = 0 // SIEMPRE fresco — la decisión cambia el estado

interface ApprovalPageProps {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{ token?: string }>
}

interface ProofEntry {
  id: string
  url: string
  file_name?: string | null
  version: number
  sent_at: string
  admin_notes?: string | null
  customer_response?: 'approved' | 'changes_requested' | null
  customer_response_at?: string | null
  customer_response_notes?: string | null
}

export interface CustomOrderPublicView {
  id: string
  short_id: string
  customer_name: string | null
  status: string
  shape: string
  material: string
  size_id: string | null
  width_cm: number | null
  height_cm: number | null
  units: number
  unit_price: number
  total_price: number
  customer_notes: string | null
  design_file_url: string | null
  design_file_name: string | null
  proofs: ProofEntry[]
  created_at: string
}

interface FetchResponse {
  custom_order: CustomOrderPublicView
}

export default async function ApprovalPage({
  params,
  searchParams,
}: ApprovalPageProps) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  let order: CustomOrderPublicView | null = null
  try {
    const res = await sdk.client.fetch<FetchResponse>(
      `/store/custom-orders/by-token/${token}`,
      { cache: 'no-store' },
    )
    order = res.custom_order
  } catch {
    notFound()
  }

  if (!order || order.id !== id) {
    notFound()
  }

  return <ApprovalView order={order} token={token} />
}

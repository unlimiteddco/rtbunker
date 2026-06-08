'use client'

import { CheckCircle2, Loader2, MessageSquare, RefreshCw, ThumbsUp } from 'lucide-react'
import { useState } from 'react'

import { Reveal } from '@/components/services/reveal'
import { Button } from '@/components/ui/button'
import { sdk } from '@/lib/medusa'

import type { CustomOrderPublicView } from '@/app/[locale]/personalizadas/aprobar/[id]/page'

// ─── Labels ─────────────────────────────────────────────────────────

const SHAPE_LABELS: Record<string, string> = {
  rect: 'Rectángulo',
  square: 'Cuadrado',
  circle: 'Círculo',
  custom: 'Forma libre',
}

const MATERIAL_LABELS: Record<string, string> = {
  mate: 'Mate',
  brillo: 'Brillo',
  holo: 'Holográfico',
  refl: 'Reflectante',
}

const SIZE_LABELS: Record<string, string> = {
  s: 'Pequeña (5×5 cm)',
  m: 'Mediana (10×10 cm)',
  l: 'Grande (20×20 cm)',
  xl: 'XL (40×40 cm)',
}

function formatSize(o: Pick<CustomOrderPublicView, 'size_id' | 'width_cm' | 'height_cm'>): string {
  if (o.size_id && SIZE_LABELS[o.size_id]) return SIZE_LABELS[o.size_id]!
  if (o.width_cm && o.height_cm) return `${o.width_cm} × ${o.height_cm} cm`
  return '—'
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

// ─── Main view ──────────────────────────────────────────────────────

interface ApprovalViewProps {
  order: CustomOrderPublicView
  token: string
}

export function ApprovalView({ order, token }: ApprovalViewProps) {
  const proofs = order.proofs ?? []
  const latest = proofs[proofs.length - 1] ?? null

  const [optimisticDecision, setOptimisticDecision] = useState<
    'approved' | 'changes_requested' | null
  >(null)

  const decision = optimisticDecision ?? latest?.customer_response ?? null

  return (
    <main className="bg-rt-white min-h-screen">
      {/* Hero compacto carbón */}
      <section className="relative overflow-hidden bg-rt-black text-rt-white">
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-grid-carbon opacity-50" />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-[360px] w-[360px] rounded-full bg-rt-yellow/20 blur-3xl"
        />
        <div className="container-page relative flex flex-col items-center py-10 text-center md:py-14">
          <Reveal as="up">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-rt-yellow font-[family-name:var(--font-heading)]">
              Pedido personalizado #{order.short_id}
            </p>
          </Reveal>
          <Reveal as="up" delay={120}>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(40px,7vw,88px)] uppercase leading-[0.94] tracking-[-0.02em]">
              {decision === 'approved' ? (
                <>
                  Mockup <span className="text-rt-yellow">aprobado</span>
                </>
              ) : decision === 'changes_requested' ? (
                <>
                  Tus cambios <span className="text-rt-yellow">en camino</span>
                </>
              ) : (
                <>
                  Revisa tu <span className="text-rt-yellow">mockup</span>
                </>
              )}
            </h1>
          </Reveal>
          <Reveal as="up" delay={240}>
            <p className="mt-4 max-w-[560px] text-balance text-[15px] leading-[1.6] text-rt-ink-300 md:text-[16px]">
              {decision === 'approved'
                ? 'Pasamos a fabricar tu pedido. Te avisaremos cuando salga del taller.'
                : decision === 'changes_requested'
                  ? 'Estamos preparando la siguiente versión. Recibirás un email en cuanto esté lista.'
                  : 'Mira la previsualización y dinos si te encaja o si quieres que ajustemos algo.'}
            </p>
          </Reveal>
        </div>
      </section>

      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1.4fr_1fr] lg:gap-12 lg:py-16">
        {/* Mockup viewer */}
        <Reveal as="up">
          <ProofViewer order={order} latest={latest} />
        </Reveal>

        {/* Decision panel */}
        <Reveal as="up" delay={120}>
          <div className="flex flex-col gap-6">
            <OrderSummary order={order} />
            {latest ? (
              decision === 'approved' ? (
                <DecisionConfirmation
                  kind="approved"
                  proof={latest}
                  responseAt={
                    optimisticDecision ? new Date().toISOString() : latest.customer_response_at
                  }
                  responseNotes={latest.customer_response_notes}
                />
              ) : decision === 'changes_requested' ? (
                <DecisionConfirmation
                  kind="changes_requested"
                  proof={latest}
                  responseAt={
                    optimisticDecision ? new Date().toISOString() : latest.customer_response_at
                  }
                  responseNotes={latest.customer_response_notes}
                />
              ) : (
                <ResponseForm
                  token={token}
                  orderId={order.id}
                  onResponded={setOptimisticDecision}
                />
              )
            ) : (
              <div className="rounded-[20px] border border-rt-ink-100 bg-rt-white-2 p-6 text-center">
                <p className="text-[14px] text-rt-ink-500">
                  Aún no hay mockup que aprobar. Te avisaremos por email cuando esté listo.
                </p>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </main>
  )
}

// ─── Proof viewer + history ─────────────────────────────────────────

function ProofViewer({
  order,
  latest,
}: {
  order: CustomOrderPublicView
  latest:
    | {
        url: string
        version: number
        sent_at: string
        admin_notes?: string | null
      }
    | null
}) {
  if (!latest) {
    return (
      <div className="aspect-square rounded-[24px] border border-dashed border-rt-ink-100 bg-rt-white-2" />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <a
        href={latest.url}
        target="_blank"
        rel="noreferrer"
        className="group relative block overflow-hidden rounded-[24px] border border-rt-ink-100 bg-rt-white-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={latest.url}
          alt={`Mockup v${latest.version}`}
          className="block w-full transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-rt-yellow px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-rt-black font-[family-name:var(--font-heading)]">
          Versión v{latest.version}
        </span>
      </a>
      {latest.admin_notes ? (
        <div className="rounded-[16px] border border-rt-yellow-soft bg-rt-yellow-soft/30 p-4">
          <p className="rt-eyebrow text-rt-yellow-deep">Mensaje del equipo</p>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-[1.6] text-rt-black">
            {latest.admin_notes}
          </p>
        </div>
      ) : null}
      {order.proofs.length > 1 ? (
        <details className="rounded-[16px] border border-rt-ink-100 bg-rt-white-2 p-4 text-[13px]">
          <summary className="cursor-pointer rt-eyebrow text-rt-ink-500">
            Versiones anteriores ({order.proofs.length - 1})
          </summary>
          <ul className="mt-3 space-y-2 text-rt-ink-500">
            {order.proofs
              .slice(0, -1)
              .reverse()
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span>
                    v{p.version} · {new Date(p.sent_at).toLocaleDateString('es-ES')}
                  </span>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-rt-black hover:text-rt-yellow-deep"
                  >
                    Ver →
                  </a>
                </li>
              ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}

// ─── Order summary card ─────────────────────────────────────────────

function OrderSummary({ order }: { order: CustomOrderPublicView }) {
  const rows = [
    { label: 'Forma', value: SHAPE_LABELS[order.shape] ?? order.shape },
    { label: 'Material', value: MATERIAL_LABELS[order.material] ?? order.material },
    { label: 'Tamaño', value: formatSize(order) },
    { label: 'Unidades', value: `${order.units}` },
    { label: 'Precio unitario', value: formatMoney(order.unit_price) },
  ]

  return (
    <div className="rounded-[20px] border border-rt-ink-100 bg-rt-white-2 p-6">
      <p className="rt-eyebrow text-rt-ink-500">Tu pedido</p>
      <dl className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 text-[14px]">
            <dt className="text-rt-ink-500">{r.label}</dt>
            <dd className="font-bold text-rt-black">{r.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center justify-between border-t border-rt-ink-100 pt-4">
        <span className="font-[family-name:var(--font-heading)] text-[12px] font-bold uppercase tracking-[0.18em] text-rt-black">
          Total
        </span>
        <span className="font-[family-name:var(--font-display)] text-[28px] uppercase leading-none tracking-[-0.02em] text-rt-black">
          {formatMoney(order.total_price)}
        </span>
      </div>
    </div>
  )
}

// ─── Approval form (estado: esperando respuesta) ────────────────────

function ResponseForm({
  token,
  orderId,
  onResponded,
}: {
  token: string
  orderId: string
  onResponded: (decision: 'approved' | 'changes_requested') => void
}) {
  const [mode, setMode] = useState<'idle' | 'requesting' | 'submitting'>('idle')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit(decision: 'approved' | 'changes_requested') {
    setError(null)
    setMode('submitting')
    try {
      await sdk.client.fetch(`/store/custom-orders/by-token/${token}/response`, {
        method: 'POST',
        body: {
          decision,
          notes: notes.trim() || undefined,
        },
      })
      onResponded(decision)
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'No hemos podido registrar tu respuesta. Vuelve a probar.'
      setError(message)
      setMode(decision === 'changes_requested' ? 'requesting' : 'idle')
    }
    // intencional: no reseteo a 'idle' en éxito; onResponded muestra otra vista
    void orderId
  }

  if (mode === 'requesting') {
    return (
      <div className="rounded-[20px] border border-rt-ink-100 bg-rt-white p-6">
        <p className="rt-eyebrow text-rt-yellow-deep">Pedir cambios</p>
        <p className="mt-2 text-[14px] leading-[1.6] text-rt-ink-500">
          Cuéntanos qué quieres ajustar (colores, tamaño, posición del logo, lo que sea).
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Por ejemplo: el azul de fondo más oscuro, y el logo un 10% más pequeño."
          className="mt-3 w-full rounded-[12px] border border-rt-ink-100 bg-rt-white-2 px-4 py-3 text-[14px] leading-[1.5] text-rt-black placeholder:text-rt-ink-300 focus:border-rt-yellow focus:outline-none focus:ring-2 focus:ring-rt-yellow/30"
        />
        {error ? <p className="mt-2 text-[13px] text-rt-danger">{error}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => submit('changes_requested')}
            disabled={mode === 'submitting' || notes.trim().length < 3}
          >
            {mode === 'submitting' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            Enviar cambios
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => {
              setMode('idle')
              setError(null)
            }}
            disabled={mode === 'submitting'}
          >
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[20px] border border-rt-ink-100 bg-rt-white p-6">
      <p className="rt-eyebrow text-rt-yellow-deep">Tu respuesta</p>
      <h3 className="mt-2 font-[family-name:var(--font-heading)] text-[22px] font-bold leading-[1.15] text-rt-black">
        ¿Te encaja este mockup?
      </h3>
      <p className="mt-2 text-[14px] leading-[1.6] text-rt-ink-500">
        Si lo aprobamos pasamos a fabricarlo. Si necesitas un cambio, mándanos las notas y
        preparamos otra versión.
      </p>
      {error ? <p className="mt-3 text-[13px] text-rt-danger">{error}</p> : null}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => submit('approved')}
          disabled={mode === 'submitting'}
          className="flex-1"
        >
          {mode === 'submitting' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ThumbsUp className="h-4 w-4" />
          )}
          Aprobar mockup
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => setMode('requesting')}
          disabled={mode === 'submitting'}
          className="flex-1"
        >
          <RefreshCw className="h-4 w-4" />
          Pedir cambios
        </Button>
      </div>
    </div>
  )
}

// ─── Confirmation panels ────────────────────────────────────────────

function DecisionConfirmation({
  kind,
  proof,
  responseAt,
  responseNotes,
}: {
  kind: 'approved' | 'changes_requested'
  proof: { version: number }
  responseAt?: string | null
  responseNotes?: string | null
}) {
  const isApproved = kind === 'approved'
  const Icon = isApproved ? CheckCircle2 : RefreshCw

  return (
    <div
      className={`rounded-[20px] border p-6 ${
        isApproved
          ? 'border-rt-yellow-soft bg-rt-yellow-soft/40'
          : 'border-rt-ink-100 bg-rt-white-2'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
            isApproved ? 'bg-rt-yellow text-rt-black' : 'bg-rt-black text-rt-yellow'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="rt-eyebrow text-rt-black">
            {isApproved ? 'Mockup aprobado' : 'Cambios enviados'}
          </p>
          <p className="mt-2 text-[14px] leading-[1.6] text-rt-ink-700">
            {isApproved
              ? `Pasamos a producir la v${proof.version}. Te avisamos cuando salga del taller.`
              : `Estamos trabajando en la próxima versión. Recibirás un email en cuanto esté lista.`}
          </p>
          {responseAt ? (
            <p className="mt-2 text-[12px] text-rt-ink-500">
              Respondiste el{' '}
              {new Date(responseAt).toLocaleString('es-ES', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          ) : null}
          {responseNotes ? (
            <div className="mt-3 rounded-[12px] border border-rt-ink-100 bg-rt-white p-3">
              <p className="text-[12px] uppercase tracking-[0.16em] text-rt-ink-500 font-[family-name:var(--font-heading)] font-bold">
                Tus notas
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[14px] leading-[1.6] text-rt-black">
                {responseNotes}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

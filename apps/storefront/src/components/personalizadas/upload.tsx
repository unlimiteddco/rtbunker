'use client'

import { CheckCircle2, RotateCcw, Trash2, Upload as UploadIcon } from 'lucide-react'
import { useRef, useState } from 'react'

import { ACCEPTED_FILE_TYPES, ACCEPTED_LABELS } from './pricing'

export interface UploadedFile {
  /** Blob real para mandar al backend. */
  raw: File
  name: string
  ext: string
  size: string
  preview: string | null
  dims: string | null
}

interface UploadProps {
  file: UploadedFile | null
  onFile: (file: UploadedFile) => void
  onClear: () => void
}

/**
 * Drop-zone / preview de archivo. Sólo gestiona estado local — al pulsar
 * "Añadir al pedido" en el sidebar de resumen, el componente padre envía
 * el archivo al backend (fase posterior cuando exista el endpoint).
 */
export function Upload({ file, onFile, onClear }: UploadProps) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handle(f: File) {
    const ext = (f.name.split('.').pop() ?? '').toUpperCase()
    const kb = f.size / 1024
    const sizeStr = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`
    const info: UploadedFile = {
      raw: f,
      name: f.name,
      ext,
      size: sizeStr,
      preview: null,
      dims: null,
    }
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f)
      info.preview = url
      const img = new window.Image()
      img.onload = () =>
        onFile({ ...info, preview: url, dims: `${img.naturalWidth} × ${img.naturalHeight} px` })
      img.src = url
    }
    onFile(info)
  }

  if (file) {
    return (
      <div className="flex items-center gap-4 rounded-[20px] border border-rt-ink-100 bg-rt-white p-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-rt-black">
          {file.preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.preview}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="font-[family-name:var(--font-heading)] text-[11px] font-bold tracking-[0.12em] text-rt-yellow">
              {file.ext}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-[family-name:var(--font-heading)] text-[16px] font-bold text-rt-black">
            {file.name}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] font-medium text-rt-ink-500">
            <span>{file.ext}</span>
            <span aria-hidden>·</span>
            <span>{file.size}</span>
            {file.dims ? (
              <>
                <span aria-hidden>·</span>
                <span>{file.dims}</span>
              </>
            ) : null}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-rt-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Archivo válido — verás una prueba antes de pagar.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            title="Reemplazar archivo"
            aria-label="Reemplazar archivo"
            className="rounded-[12px] border-[1.5px] border-rt-black p-2.5 text-rt-black transition-colors hover:bg-rt-black hover:text-rt-white"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClear}
            title="Eliminar archivo"
            aria-label="Eliminar archivo"
            className="rounded-[12px] border-[1.5px] border-rt-danger p-2.5 text-rt-danger transition-colors hover:bg-rt-danger hover:text-rt-white"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={ACCEPTED_FILE_TYPES.join(',')}
          onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
        />
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        const f = e.dataTransfer.files?.[0]
        if (f) handle(f)
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      className={`cursor-pointer rounded-[20px] border-2 border-dashed p-9 text-center transition-all duration-200 ${
        drag ? 'border-rt-yellow bg-rt-yellow-soft' : 'border-rt-ink-300 bg-rt-white hover:bg-rt-white-2'
      }`}
    >
      <span className="mb-3.5 inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-rt-yellow text-rt-black">
        <UploadIcon className="h-7 w-7" strokeWidth={2} />
      </span>
      <h3 className="font-[family-name:var(--font-heading)] text-[22px] font-extrabold tracking-[-0.005em] text-rt-black">
        Sube tu diseño
      </h3>
      <p className="mx-auto mt-2 max-w-[460px] text-[14px] leading-[1.55] text-rt-ink-500">
        Arrastra tu archivo aquí o haz click para buscar. Aceptamos PNG, JPG, SVG, PDF, AI y EPS.
        Resolución mínima 300 dpi para fotos.
      </p>
      <div className="mt-3.5 inline-flex flex-wrap justify-center gap-2.5">
        {ACCEPTED_LABELS.map((ext) => (
          <span
            key={ext}
            className="rounded-full border border-rt-ink-100 px-2.5 py-1 font-[family-name:var(--font-heading)] text-[11px] font-bold tracking-[0.14em] text-rt-ink-500"
          >
            {ext}
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={ACCEPTED_FILE_TYPES.join(',')}
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
      />
    </div>
  )
}

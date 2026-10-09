import { Plus, Trash } from '@medusajs/icons'
import { Button, IconButton, Input, Label, Switch, Text, Textarea } from '@medusajs/ui'

import {
  CUSTOM_CHOICES_MAX,
  emptyChoiceDraft,
  parseOptions,
  type CustomChoiceDraft,
} from '../lib/custom-choices'

interface ChoicesEditorProps {
  value: CustomChoiceDraft[]
  onChange: (next: CustomChoiceDraft[]) => void
  disabled?: boolean
}

/**
 * Editor de "opciones a elegir" de un producto: cada bloque es una pregunta
 * (p. ej. «Fuente») con los valores entre los que elige el cliente. Lo usan
 * el widget del producto y el formulario "Publicar producto".
 */
export function ChoicesEditor({ value, onChange, disabled }: ChoicesEditorProps) {
  const update = (index: number, patch: Partial<CustomChoiceDraft>) =>
    onChange(value.map((d, i) => (i === index ? { ...d, ...patch } : d)))

  return (
    <div className="flex flex-col gap-y-4">
      {value.map((draft, i) => {
        const count = parseOptions(draft.optionsText).length
        return (
          <div
            key={i}
            className="border-ui-border-base bg-ui-bg-subtle flex flex-col gap-y-4 rounded-lg border p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-1 flex-col gap-y-2">
                <Label htmlFor={`choice-label-${i}`}>Qué elige el cliente *</Label>
                <Input
                  id={`choice-label-${i}`}
                  placeholder="Ej: Fuente"
                  value={draft.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  disabled={disabled}
                />
              </div>
              <IconButton
                size="small"
                variant="transparent"
                type="button"
                className="mt-7"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                disabled={disabled}
                aria-label={`Quitar la opción ${draft.label || i + 1}`}
              >
                <Trash />
              </IconButton>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor={`choice-options-${i}`}>Valores entre los que elige *</Label>
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                Uno por línea. {count > 0 ? `Ahora hay ${count}.` : ''}
              </Text>
              <Textarea
                id={`choice-options-${i}`}
                rows={4}
                placeholder={'Ej:\nClásica\nRedonda\nManuscrita'}
                value={draft.optionsText}
                onChange={(e) => update(i, { optionsText: e.target.value })}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <Text size="small" leading="compact" weight="plus">
                  Obligatorio para comprar
                </Text>
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  Si lo quitas, el cliente puede dejarlo sin elegir.
                </Text>
              </div>
              <Switch
                checked={draft.required}
                onCheckedChange={(v) => update(i, { required: v })}
                disabled={disabled}
              />
            </div>
          </div>
        )
      })}

      {value.length < CUSTOM_CHOICES_MAX ? (
        <div>
          <Button
            size="small"
            variant="secondary"
            type="button"
            onClick={() => onChange([...value, emptyChoiceDraft()])}
            disabled={disabled}
          >
            <Plus />
            Añadir opción a elegir
          </Button>
        </div>
      ) : null}
    </div>
  )
}

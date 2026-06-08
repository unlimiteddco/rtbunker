import { AbstractNotificationProviderService, MedusaError } from '@medusajs/framework/utils'
import type {
  Logger,
  NotificationTypes,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from '@medusajs/framework/types'
import { Resend, type CreateEmailOptions } from 'resend'

type InjectedDependencies = {
  logger: Logger
}

interface ResendOptions {
  apiKey: string
  from: string
  replyTo?: string
  channels: string[]
  /**
   * Si está definido, TODOS los emails salientes se redirigen a esta
   * dirección y el subject se marca con `[DEV → original@email]`.
   * Pensado para localhost/staging — quitar en producción.
   */
  devRedirectTo?: string
}

/**
 * Provider de notificación que usa Resend para enviar emails.
 *
 * El contrato `notification.send(...)` recibe `ProviderSendNotificationDTO`
 * con `to`, `template`, `data`, `attachments`. La plantilla se interpreta
 * de dos formas:
 *
 *   1) Si `data.html` o `data.text` están presentes, se usan tal cual y
 *      `template` se trata como el subject (útil para los workflows propios).
 *   2) En caso contrario se podría integrar con react-email aquí.
 */
class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = 'notification-resend'

  protected readonly logger_: Logger
  protected readonly options_: ResendOptions
  protected readonly client_: Resend

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super()

    this.logger_ = logger
    this.options_ = options

    if (!options.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Resend notification provider: missing apiKey',
      )
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Resend notification provider: missing `from` address',
      )
    }

    this.client_ = new Resend(options.apiKey)
  }

  static override validateOptions(options: Record<string, unknown>): void {
    if (!options.apiKey) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'apiKey is required for Resend')
    }
    if (!options.from) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, '`from` is required for Resend')
    }
  }

  override async send(
    notification: ProviderSendNotificationDTO,
  ): Promise<ProviderSendNotificationResultsDTO> {
    if (notification.channel && notification.channel !== 'email') {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Resend solo soporta el canal email, recibido: ${notification.channel}`,
      )
    }

    const data = (notification.data ?? {}) as {
      subject?: string
      html?: string
      text?: string
      attachments?: CreateEmailOptions['attachments']
    }

    if (!data.html && !data.text) {
      this.logger_.warn(
        `[resend] notificación a ${notification.to} sin html/text — se ignora (template=${notification.template})`,
      )
      return { id: 'noop' }
    }

    // Dev redirect: si está activo, envía siempre a la dirección puente
    // y deja el destinatario real en el subject para no perderlo.
    const originalTo = notification.to
    const effectiveTo = this.options_.devRedirectTo ?? originalTo
    const subjectPrefix =
      this.options_.devRedirectTo && this.options_.devRedirectTo !== originalTo
        ? `[DEV → ${originalTo}] `
        : ''

    try {
      const payload = {
        from: this.options_.from,
        to: effectiveTo,
        subject: `${subjectPrefix}${data.subject ?? notification.template ?? ''}`,
        html: data.html ?? '',
        text: data.text ?? '',
        ...(this.options_.replyTo ? { replyTo: this.options_.replyTo } : {}),
        ...(data.attachments ? { attachments: data.attachments } : {}),
      } as CreateEmailOptions

      if (this.options_.devRedirectTo && this.options_.devRedirectTo !== originalTo) {
        this.logger_.info(
          `[resend] dev-redirect: ${originalTo} → ${effectiveTo} (template=${notification.template})`,
        )
      }

      const { data: result, error } = await this.client_.emails.send(payload)

      if (error) {
        this.logger_.error(`[resend] error enviando a ${notification.to}: ${error.message}`)
        throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, error.message)
      }

      return { id: result?.id ?? 'unknown' }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown'
      this.logger_.error(`[resend] excepción enviando email: ${message}`)
      throw err
    }
  }
}

export default ResendNotificationProviderService

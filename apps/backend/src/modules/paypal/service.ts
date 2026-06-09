import { AbstractPaymentProvider, MedusaError, PaymentSessionStatus } from '@medusajs/framework/utils'
import type { Logger } from '@medusajs/framework/types'
import type {
  CreatePaymentProviderSession,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  ProviderWebhookPayload,
  UpdatePaymentProviderSession,
  WebhookActionResult,
} from '@medusajs/types'
import {
  CheckoutPaymentIntent,
  Client,
  Environment,
  OrderStatus,
  OrdersController,
  PaymentsController,
} from '@paypal/paypal-server-sdk'

/**
 * Provider de pago PayPal para Medusa 2.x.
 *
 * Portado del ejemplo oficial de Medusa (medusajs/examples/paypal-integration)
 * al SDK oficial `@paypal/paypal-server-sdk` (v2). El provider crea una "Order"
 * de PayPal en `initiatePayment`, el storefront la aprueba con los
 * `<PayPalButtons>`, y `authorizePayment` la captura (o autoriza) al completar
 * el carrito en Medusa.
 *
 * `provider_id` resultante en Medusa = `pp_paypal_paypal`.
 *
 * El webhook de PayPal lo enruta Medusa a `getWebhookActionAndData` vía
 * `/hooks/payment/paypal_paypal` — no se crea ninguna ruta manual.
 */

type Options = {
  /** Client ID de la app REST de PayPal. */
  client_id: string
  /** Client secret de la app REST de PayPal. */
  client_secret: string
  /** Entorno PayPal: `sandbox` para pruebas, `live` para producción. */
  environment?: 'sandbox' | 'live'
  /** Si es `true`, captura el pago automáticamente tras la autorización. */
  autoCapture?: boolean
  /** ID del webhook configurado en el dashboard de PayPal (verificación de firma). */
  webhook_id?: string
}

type InjectedDependencies = {
  logger: Logger
}

/** Estructura mínima de los datos persistidos en la `data` de la sesión. */
type PaypalSessionData = {
  id: string
  status?: string
}

/** Tipo del evento de webhook de PayPal que nos interesa procesar. */
type PaypalWebhookEvent = {
  event_type?: string
  resource?: {
    id?: string
    status?: string
    amount?: { value?: string; currency_code?: string }
    custom_id?: string
    supplementary_data?: { related_ids?: { order_id?: string } }
  }
}

const PAYPAL_API_BASE = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com',
} as const

class PaypalProviderService extends AbstractPaymentProvider<Options> {
  static override identifier = 'paypal'

  protected readonly options_: Options
  protected readonly logger_: Logger
  protected readonly client_: Client
  protected readonly orders_: OrdersController
  protected readonly payments_: PaymentsController

  static override validateOptions(options: Record<string, unknown>): void {
    if (!options.client_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'PayPal: `client_id` es obligatorio en las opciones del provider.',
      )
    }
    if (!options.client_secret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'PayPal: `client_secret` es obligatorio en las opciones del provider.',
      )
    }
  }

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options)

    this.options_ = options
    this.logger_ = container.logger

    this.client_ = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: options.client_id,
        oAuthClientSecret: options.client_secret,
      },
      environment: options.environment === 'live' ? Environment.Production : Environment.Sandbox,
    })

    this.orders_ = new OrdersController(this.client_)
    this.payments_ = new PaymentsController(this.client_)
  }

  /**
   * Crea una Order en PayPal con el importe del carrito. El `id` devuelto por
   * PayPal se guarda en `data` y el storefront lo usa en `createOrder`.
   */
  async initiatePayment(
    context: CreatePaymentProviderSession,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { amount, currency_code } = context

    try {
      const { result } = await this.orders_.createOrder({
        body: {
          intent: this.options_.autoCapture
            ? CheckoutPaymentIntent.Capture
            : CheckoutPaymentIntent.Authorize,
          purchaseUnits: [
            {
              amount: {
                currencyCode: currency_code.toUpperCase(),
                value: this.formatAmount(amount),
              },
            },
          ],
        },
      })

      return {
        data: {
          id: result.id,
          status: result.status,
        },
      }
    } catch (error) {
      return this.buildError('No se pudo iniciar el pago con PayPal.', error)
    }
  }

  /**
   * Autoriza la sesión. Si `autoCapture` está activo (o ya está capturada),
   * marca el pago como `captured`; en caso contrario, `authorized`.
   */
  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    _context: Record<string, unknown>,
  ): Promise<PaymentProviderError | { status: PaymentSessionStatus; data: Record<string, unknown> }> {
    const status = await this.getPaymentStatus(paymentSessionData)
    return { status, data: paymentSessionData }
  }

  /**
   * Captura el pago en PayPal. Si la Order ya está capturada (intent=CAPTURE),
   * devuelve los datos tal cual sin re-capturar.
   */
  async capturePayment(
    paymentData: Record<string, unknown>,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse['data']> {
    const { id } = this.getSessionData(paymentData)

    try {
      const { result } = await this.orders_.getOrder({ id })

      if (result.status === OrderStatus.Completed) {
        return { ...paymentData, id, status: result.status }
      }

      const { result: captured } = await this.orders_.captureOrder({ id })
      return { ...paymentData, id, status: captured.status }
    } catch (error) {
      return this.buildError('No se pudo capturar el pago con PayPal.', error)
    }
  }

  /**
   * Reembolsa una captura. PayPal reembolsa por `captureId` (el id de la
   * captura, no de la Order), así que lo resolvemos desde la Order.
   */
  async refundPayment(
    paymentData: Record<string, unknown>,
    refundAmount: number,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse['data']> {
    const { id } = this.getSessionData(paymentData)

    try {
      const { result } = await this.orders_.getOrder({ id })
      const capture = result.purchaseUnits?.[0]?.payments?.captures?.[0]
      const captureId = capture?.id

      if (!captureId) {
        return this.buildError(
          'No se encontró una captura para reembolsar en la Order de PayPal.',
          new Error('missing_capture_id'),
        )
      }

      const currencyCode =
        capture?.amount?.currencyCode ??
        result.purchaseUnits?.[0]?.amount?.currencyCode ??
        'EUR'

      const { result: refund } = await this.payments_.refundCapturedPayment({
        captureId,
        body: {
          amount: {
            value: this.formatAmount(refundAmount),
            currencyCode,
          },
        },
      })

      return { ...paymentData, id, refund_id: refund.id, status: refund.status }
    } catch (error) {
      return this.buildError('No se pudo reembolsar el pago con PayPal.', error)
    }
  }

  /**
   * Cancela / anula el pago. Una Order de PayPal aprobada pero no capturada
   * no se puede cancelar vía API (expira sola), así que devolvemos los datos.
   */
  async cancelPayment(
    paymentData: Record<string, unknown>,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse['data']> {
    return paymentData
  }

  /**
   * Se invoca al borrar una sesión no autorizada. PayPal no expone borrado de
   * Orders; expiran solas, así que devolvemos los datos sin tocar nada.
   */
  async deletePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse['data']> {
    return paymentSessionData
  }

  /** Recupera el estado de la Order desde PayPal y lo mapea al de Medusa. */
  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentSessionStatus> {
    const data = paymentSessionData as Partial<PaypalSessionData>
    if (!data.id) {
      return PaymentSessionStatus.PENDING
    }

    try {
      const { result } = await this.orders_.getOrder({ id: data.id })
      return this.mapStatus(result.status)
    } catch {
      return PaymentSessionStatus.ERROR
    }
  }

  /** Recupera los datos de la Order desde PayPal. */
  async retrievePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse['data']> {
    const { id } = this.getSessionData(paymentSessionData)

    try {
      const { result } = await this.orders_.getOrder({ id })
      return { ...paymentSessionData, id, status: result.status }
    } catch (error) {
      return this.buildError('No se pudo recuperar el pago de PayPal.', error)
    }
  }

  /** Actualiza la sesión. PayPal no permite mutar el importe de una Order ya
   * creada de forma fiable, así que recreamos la Order con el nuevo importe. */
  async updatePayment(
    context: UpdatePaymentProviderSession,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    return this.initiatePayment({
      amount: context.amount,
      currency_code: context.currency_code,
      context: context.context,
    })
  }

  /**
   * Procesa los webhooks de PayPal enrutados por Medusa. Verifica la firma
   * (si hay `webhook_id`) y mapea el evento a una acción de Medusa.
   */
  async getWebhookActionAndData(
    payload: ProviderWebhookPayload['payload'],
  ): Promise<WebhookActionResult> {
    const event = payload.data as PaypalWebhookEvent

    const verified = await this.verifyWebhookSignature(payload)
    if (!verified) {
      this.logger_.warn('PayPal: webhook con firma no válida, ignorado.')
      return { action: 'not_supported' }
    }

    const resource = event.resource
    const sessionId = resource?.custom_id
    const orderId = resource?.supplementary_data?.related_ids?.order_id ?? resource?.id

    // Medusa necesita session_id + amount para autorizar/capturar.
    if (!sessionId) {
      return { action: 'not_supported' }
    }

    const amount = Number(resource?.amount?.value ?? 0)

    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        return {
          action: 'authorized',
          data: { session_id: sessionId, amount },
        }
      case 'PAYMENT.CAPTURE.COMPLETED':
      case 'CHECKOUT.ORDER.COMPLETED':
        return {
          action: 'captured',
          data: { session_id: sessionId, amount },
        }
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        return {
          action: 'failed',
          data: { session_id: sessionId, amount },
        }
      default:
        this.logger_.debug(
          `PayPal: evento de webhook no manejado (${event.event_type ?? 'desconocido'}, order ${orderId ?? 'n/a'}).`,
        )
        return { action: 'not_supported' }
    }
  }

  /**
   * Verifica la firma del webhook con la API REST de PayPal
   * (`/v1/notifications/verify-webhook-signature`). Requiere `webhook_id` en
   * las opciones; si no está configurado, se omite la verificación (dev).
   */
  protected async verifyWebhookSignature(
    payload: ProviderWebhookPayload['payload'],
  ): Promise<boolean> {
    if (!this.options_.webhook_id) {
      // Sin webhook_id no podemos verificar; en dev lo dejamos pasar.
      return true
    }

    const headers = (payload.headers ?? {}) as Record<string, string | undefined>
    const transmissionId = headers['paypal-transmission-id']
    const transmissionTime = headers['paypal-transmission-time']
    const certUrl = headers['paypal-cert-url']
    const authAlgo = headers['paypal-auth-algo']
    const transmissionSig = headers['paypal-transmission-sig']

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      return false
    }

    try {
      const accessToken = await this.getAccessToken()
      const base =
        this.options_.environment === 'live' ? PAYPAL_API_BASE.live : PAYPAL_API_BASE.sandbox

      const response = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          transmission_id: transmissionId,
          transmission_time: transmissionTime,
          cert_url: certUrl,
          auth_algo: authAlgo,
          transmission_sig: transmissionSig,
          webhook_id: this.options_.webhook_id,
          webhook_event: payload.data,
        }),
      })

      if (!response.ok) {
        return false
      }

      const result = (await response.json()) as { verification_status?: string }
      return result.verification_status === 'SUCCESS'
    } catch (error) {
      this.logger_.error(
        `PayPal: error verificando la firma del webhook: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
      return false
    }
  }

  /** Obtiene un access token OAuth2 para llamadas REST directas (verify-webhook). */
  protected async getAccessToken(): Promise<string> {
    const base =
      this.options_.environment === 'live' ? PAYPAL_API_BASE.live : PAYPAL_API_BASE.sandbox
    const credentials = Buffer.from(
      `${this.options_.client_id}:${this.options_.client_secret}`,
    ).toString('base64')

    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        'PayPal: no se pudo obtener el access token.',
      )
    }

    const result = (await response.json()) as { access_token: string }
    return result.access_token
  }

  /** Mapea el `OrderStatus` de PayPal al `PaymentSessionStatus` de Medusa. */
  protected mapStatus(status: OrderStatus | string | undefined): PaymentSessionStatus {
    switch (status) {
      case OrderStatus.Completed:
        return PaymentSessionStatus.CAPTURED
      case OrderStatus.Approved:
        // Aprobada por el comprador: lista para autorizar/capturar.
        return this.options_.autoCapture
          ? PaymentSessionStatus.CAPTURED
          : PaymentSessionStatus.AUTHORIZED
      case OrderStatus.Saved:
        return PaymentSessionStatus.AUTHORIZED
      case OrderStatus.Voided:
        return PaymentSessionStatus.CANCELED
      case OrderStatus.PayerActionRequired:
        return PaymentSessionStatus.REQUIRES_MORE
      case OrderStatus.Created:
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  /** Normaliza el importe (euros decimales) al string que espera PayPal. */
  protected formatAmount(amount: unknown): string {
    return Number(amount).toFixed(2)
  }

  /** Extrae y valida el `id` de PayPal de la `data` de la sesión/pago. */
  protected getSessionData(data: Record<string, unknown>): PaypalSessionData {
    const id = (data as Partial<PaypalSessionData>).id
    if (!id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'PayPal: falta el `id` de la Order en los datos del pago.',
      )
    }
    return { id }
  }

  /** Construye un objeto de error con el formato que espera Medusa. */
  protected buildError(message: string, error: unknown): PaymentProviderError {
    const detail = error instanceof Error ? error.message : String(error)
    this.logger_.error(`${message} ${detail}`)
    return {
      error: message,
      code: 'unknown',
      detail,
    }
  }
}

export default PaypalProviderService

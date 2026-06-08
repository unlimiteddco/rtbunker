import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError, Modules } from '@medusajs/framework/utils'

interface MulterRequest extends MedusaRequest {
  file?: Express.Multer.File
}

/**
 * POST /store/custom-orders/upload
 * Recibe el archivo de diseño del cliente (multipart, field `file`)
 * y lo sube vía FileModule (R2 en prod, local en dev). Devuelve la URL
 * pública para que el storefront la pase en `/store/custom-orders/cart`.
 *
 * Acepta hasta 20 MB. Extensiones recomendadas (no se valida hoy):
 *   PNG, JPG, SVG, PDF, AI, EPS.
 */
export async function POST(req: MulterRequest, res: MedusaResponse) {
  if (!req.file) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'No se ha recibido archivo.')
  }

  const fileService: any = req.scope.resolve(Modules.FILE)

  const [uploaded] = await fileService.createFiles([
    {
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      content: req.file.buffer.toString('binary'),
    },
  ])

  return res.json({
    url: uploaded.url,
    name: req.file.originalname,
    size: req.file.size,
  })
}

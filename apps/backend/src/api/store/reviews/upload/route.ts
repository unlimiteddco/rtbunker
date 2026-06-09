import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import { MedusaError, Modules } from '@medusajs/framework/utils'

interface MulterRequest extends MedusaRequest {
  file?: Express.Multer.File
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

/**
 * POST /store/reviews/upload
 * Recibe una foto de la reseña del cliente (multipart, field `file`) y la
 * sube vía FileModule (R2 en prod, local en dev). Devuelve la URL pública
 * para que el storefront la pase en `images[]` del POST /store/reviews.
 *
 * Acepta JPEG, PNG y WebP hasta 8 MB (el límite de tamaño lo aplica multer
 * en el middleware; aquí validamos el tipo).
 */
export async function POST(req: MulterRequest, res: MedusaResponse) {
  if (!req.file) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'No se ha recibido archivo.')
  }

  if (!ALLOWED_MIME.includes(req.file.mimetype)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Formato no admitido. Sube una imagen JPG, PNG o WebP.',
    )
  }

  const fileService: any = req.scope.resolve(Modules.FILE)

  // Sanitiza el nombre (evita caracteres raros en la key de R2) y lo prefija
  // para agrupar las fotos de reseñas.
  const sanitized = req.file.originalname.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  const prefixedFilename = `reviews__${sanitized || 'imagen'}`

  const [uploaded] = await fileService.createFiles([
    {
      filename: prefixedFilename,
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

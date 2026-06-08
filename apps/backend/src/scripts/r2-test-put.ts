import type { ExecArgs } from '@medusajs/framework/types'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

/**
 * Verifica que un PUT real funciona contra R2 (la operación que rompía
 * con SignatureDoesNotMatch antes del patch de requestChecksumCalculation).
 */
export default async function r2TestPut({ container }: ExecArgs) {
  const logger: any = container.resolve('logger')

  const client = new S3Client({
    endpoint: process.env.R2_ENDPOINT!,
    region: 'auto',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })

  // Simulamos un PNG binario con ACL + metadata, como hace el provider de Medusa
  const key = `r2-test-${Date.now()}.png`
  const fakePng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    ...Array(1000).fill(0xff), // padding
  ])
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        Body: fakePng,
        ContentType: 'image/png',
        ACL: 'public-read',
        CacheControl: 'public, max-age=31536000',
        Metadata: { 'x-amz-meta-original-filename': 'test-realistic.png' },
      }),
    )
    logger.info(`[r2-test-put] ✅ PUT OK · key=${key}`)
  } catch (e: any) {
    logger.error(`[r2-test-put] ❌ FAIL · ${e.name} · ${e.message}`)
  }
}

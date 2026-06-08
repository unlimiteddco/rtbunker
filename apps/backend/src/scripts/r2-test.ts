import type { ExecArgs } from '@medusajs/framework/types'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

/**
 * Test rápido de credenciales R2. Lista 1 objeto del bucket.
 * Usar: `npx medusa exec ./src/scripts/r2-test.ts`
 */
export default async function r2Test({ container }: ExecArgs) {
  const logger: any = container.resolve('logger')
  const cfg = {
    endpoint: process.env.R2_ENDPOINT!,
    accessKey: process.env.R2_ACCESS_KEY_ID!,
    secret: process.env.R2_SECRET_ACCESS_KEY!,
    bucket: process.env.R2_BUCKET!,
  }

  logger.info(`[r2-test] endpoint=${cfg.endpoint} bucket=${cfg.bucket}`)
  logger.info(`[r2-test] accessKey=${cfg.accessKey?.slice(0, 8)}...`)

  const client = new S3Client({
    endpoint: cfg.endpoint,
    region: 'auto',
    credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secret },
    forcePathStyle: true,
  })

  try {
    const r = await client.send(new ListObjectsV2Command({ Bucket: cfg.bucket, MaxKeys: 1 }))
    logger.info(`[r2-test] ✅ OK · respuesta: ${r.KeyCount} objetos`)
  } catch (e: any) {
    logger.error(`[r2-test] ❌ FAIL · ${e.name} · ${e.message}`)
    if (e.$metadata) {
      logger.error(`[r2-test] http status: ${e.$metadata.httpStatusCode}`)
    }
  }
}

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import logger from '../utils/logger';

export interface StoredObjectMetadata {
  key: string;
  bucket: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  uploadedAt: string;
  storageUrl: string;
  metadata?: Record<string, string>;
}

export class ObjectStoreService {
  private baseDir: string;
  private defaultBucket: string;
  private s3Client?: S3Client;
  private memoryStore: Map<string, { buffer: Buffer; metadata: StoredObjectMetadata }> = new Map();

  constructor(baseDir?: string, defaultBucket?: string) {
    this.defaultBucket = defaultBucket || process.env.R2_BUCKET || 'consulting-doc';
    this.baseDir = baseDir || path.resolve(process.cwd(), 'storage', 'objects');
    this.ensureDirectory(this.baseDir);
    this.initializeR2Client();
  }

  private initializeR2Client(): void {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey && (accountId || process.env.R2_ENDPOINT)) {
      const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey
        }
      });
      logger.info('Cloudflare R2 Object Storage client initialized', {
        endpoint,
        bucket: this.defaultBucket
      });
    } else {
      logger.info('Cloudflare R2 credentials not set; using local filesystem / memory store');
    }
  }

  public isR2Configured(): boolean {
    return Boolean(this.s3Client);
  }

  public getR2Client(): S3Client | undefined {
    return this.s3Client;
  }

  private ensureDirectory(dir: string): void {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      logger.warn('ObjectStore filesystem directory creation warning, using memory fallback', {
        dir,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  public async putObject(
    fileBuffer: Buffer,
    filename: string,
    contentType = 'application/octet-stream',
    bucket?: string,
    customMetadata?: Record<string, string>
  ): Promise<StoredObjectMetadata> {
    const targetBucket = bucket || this.defaultBucket;
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const timestamp = Date.now();
    const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const objectKey = `${targetBucket}/${timestamp}_${hash.slice(0, 12)}_${safeFilename}`;

    const metadata: StoredObjectMetadata = {
      key: objectKey,
      bucket: targetBucket,
      filename: safeFilename,
      contentType,
      sizeBytes: fileBuffer.length,
      sha256: hash,
      uploadedAt: new Date().toISOString(),
      storageUrl: `/api/documents/storage/${encodeURIComponent(objectKey)}`,
      metadata: customMetadata
    };

    // Upload to Cloudflare R2 if configured
    if (this.s3Client) {
      try {
        const metadataHeader: Record<string, string> = {
          filename: encodeURIComponent(safeFilename),
          sha256: hash,
          uploadedat: metadata.uploadedAt
        };

        if (customMetadata) {
          for (const [k, v] of Object.entries(customMetadata)) {
            metadataHeader[k.toLowerCase()] = encodeURIComponent(v);
          }
        }

        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: targetBucket,
            Key: objectKey,
            Body: fileBuffer,
            ContentType: contentType,
            Metadata: metadataHeader
          })
        );

        logger.info('Object uploaded directly to Cloudflare R2', {
          bucket: targetBucket,
          key: objectKey,
          sizeBytes: fileBuffer.length
        });
      } catch (r2Err) {
        logger.error('Failed to upload object to Cloudflare R2; caching locally', {
          key: objectKey,
          error: r2Err instanceof Error ? r2Err.message : String(r2Err)
        });
      }
    }

    // Local / In-memory redundancy cache
    try {
      const bucketDir = path.join(this.baseDir, targetBucket);
      this.ensureDirectory(bucketDir);
      const filePath = path.join(this.baseDir, objectKey);
      this.ensureDirectory(path.dirname(filePath));
      fs.writeFileSync(filePath, fileBuffer);
    } catch (err) {
      logger.warn('Failed to write object to disk cache, saving to in-memory store', {
        key: objectKey,
        error: err instanceof Error ? err.message : String(err)
      });
    }

    this.memoryStore.set(objectKey, { buffer: fileBuffer, metadata });
    logger.info('Object stored successfully in Object Store', {
      key: objectKey,
      sizeBytes: fileBuffer.length,
      bucket: targetBucket
    });

    return metadata;
  }

  public async getObject(key: string): Promise<{ buffer: Buffer; metadata: StoredObjectMetadata } | null> {
    const targetBucket = key.split('/')[0] || this.defaultBucket;

    // Check Cloudflare R2 first if configured
    if (this.s3Client) {
      try {
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: targetBucket,
            Key: key
          })
        );

        if (response.Body) {
          const chunks: Buffer[] = [];
          for await (const chunk of response.Body as AsyncIterable<Uint8Array | Buffer>) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const buffer = Buffer.concat(chunks);
          const r2Metadata = response.Metadata || {};
          const meta: StoredObjectMetadata = {
            key,
            bucket: targetBucket,
            filename: r2Metadata.filename ? decodeURIComponent(r2Metadata.filename) : path.basename(key),
            contentType: response.ContentType || 'application/octet-stream',
            sizeBytes: response.ContentLength || buffer.length,
            sha256: r2Metadata.sha256 || crypto.createHash('sha256').update(buffer).digest('hex'),
            uploadedAt: r2Metadata.uploadedat || response.LastModified?.toISOString() || new Date().toISOString(),
            storageUrl: `/api/documents/storage/${encodeURIComponent(key)}`
          };

          return { buffer, metadata: meta };
        }
      } catch (r2Err) {
        logger.warn('Cloudflare R2 fetch encountered error, falling back to local store', {
          key,
          error: r2Err instanceof Error ? r2Err.message : String(r2Err)
        });
      }
    }

    // In-memory lookup
    const mem = this.memoryStore.get(key);
    if (mem) {
      return mem;
    }

    // Disk lookup
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) {
      try {
        const buffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha256').update(buffer).digest('hex');
        const stat = fs.statSync(filePath);
        const metadata: StoredObjectMetadata = {
          key,
          bucket: targetBucket,
          filename: path.basename(key),
          contentType: 'application/octet-stream',
          sizeBytes: stat.size,
          sha256: hash,
          uploadedAt: stat.birthtime.toISOString(),
          storageUrl: `/api/documents/storage/${encodeURIComponent(key)}`
        };
        return { buffer, metadata };
      } catch (err) {
        logger.error('Failed to read object from disk', { key }, err);
      }
    }

    return null;
  }

  public async deleteObject(key: string): Promise<boolean> {
    const targetBucket = key.split('/')[0] || this.defaultBucket;
    this.memoryStore.delete(key);

    if (this.s3Client) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: targetBucket,
            Key: key
          })
        );
        logger.info('Deleted object from Cloudflare R2', { bucket: targetBucket, key });
      } catch (r2Err) {
        logger.warn('Failed to delete object from Cloudflare R2', {
          key,
          error: r2Err instanceof Error ? r2Err.message : String(r2Err)
        });
      }
    }

    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        logger.info('Object deleted from local storage cache', { key });
      } catch (err) {
        logger.error('Failed to delete object from disk', { key }, err);
      }
    }
    return true;
  }

  public async listObjects(bucket?: string): Promise<StoredObjectMetadata[]> {
    const targetBucket = bucket || this.defaultBucket;

    if (this.s3Client) {
      try {
        const response = await this.s3Client.send(
          new ListObjectsV2Command({
            Bucket: targetBucket
          })
        );

        if (response.Contents && response.Contents.length > 0) {
          return response.Contents.map((item) => ({
            key: item.Key || '',
            bucket: targetBucket,
            filename: path.basename(item.Key || ''),
            contentType: 'application/octet-stream',
            sizeBytes: item.Size || 0,
            sha256: '',
            uploadedAt: item.LastModified?.toISOString() || new Date().toISOString(),
            storageUrl: `/api/documents/storage/${encodeURIComponent(item.Key || '')}`
          }));
        }
      } catch (r2Err) {
        logger.warn('Failed to list objects from Cloudflare R2', {
          bucket: targetBucket,
          error: r2Err instanceof Error ? r2Err.message : String(r2Err)
        });
      }
    }

    const results: StoredObjectMetadata[] = [];
    for (const [_, val] of this.memoryStore.entries()) {
      if (val.metadata.bucket === targetBucket) {
        results.push(val.metadata);
      }
    }

    return results;
  }
}

export const objectStore = new ObjectStoreService();

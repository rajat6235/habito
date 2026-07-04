import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';

export interface UploadedFile {
  key: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  fileName: string;
}

interface StorageProvider {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
}

// ── Local Provider ────────────────────────────────────────────────

class LocalStorageProvider implements StorageProvider {
  private readonly basePath: string;
  private readonly baseUrl: string;

  constructor(basePath: string, baseUrl: string) {
    this.basePath = basePath;
    this.baseUrl = baseUrl;
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const fullPath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return `${this.baseUrl}/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key);
    await fs.unlink(fullPath).catch(() => {});
  }

  async getSignedUrl(key: string, _expiresInSeconds: number): Promise<string> {
    return `${this.baseUrl}/uploads/${key}`;
  }
}

// ── S3 / R2 Provider (stub — import AWS SDK when needed) ──────────

class S3StorageProvider implements StorageProvider {
  async upload(_key: string, _buffer: Buffer, _mimeType: string): Promise<string> {
    throw new Error('S3 provider not yet configured. Set STORAGE_PROVIDER=local for development.');
  }

  async delete(_key: string): Promise<void> {
    throw new Error('S3 provider not yet configured.');
  }

  async getSignedUrl(_key: string, _expiresInSeconds: number): Promise<string> {
    throw new Error('S3 provider not yet configured.');
  }
}

// ── Service ───────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export class StorageService {
  private readonly provider: StorageProvider;

  constructor() {
    if (env.STORAGE_PROVIDER === 'local') {
      this.provider = new LocalStorageProvider(env.STORAGE_LOCAL_PATH, env.APP_URL);
    } else {
      this.provider = new S3StorageProvider();
    }
  }

  async upload(params: {
    userId: string;
    entityType: string;
    entityId: string;
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  }): Promise<UploadedFile> {
    if (!ALLOWED_MIME_TYPES.has(params.mimeType)) {
      throw new AppError({
        message: `File type ${params.mimeType} is not allowed`,
        code: ErrorCode.UNSUPPORTED_FILE_TYPE,
        statusCode: 400,
      });
    }

    if (params.buffer.length > MAX_FILE_SIZE) {
      throw new AppError({
        message: 'File size exceeds 10 MB limit',
        code: ErrorCode.FILE_TOO_LARGE,
        statusCode: 400,
      });
    }

    const ext = path.extname(params.originalName);
    const key = `${params.userId}/${params.entityType}/${params.entityId}/${Date.now()}${ext}`;

    try {
      const url = await this.provider.upload(key, params.buffer, params.mimeType);
      return {
        key,
        url,
        mimeType: params.mimeType,
        sizeBytes: params.buffer.length,
        fileName: params.originalName,
      };
    } catch {
      throw AppError.internal('File upload failed', ErrorCode.UPLOAD_FAILED);
    }
  }

  async delete(key: string): Promise<void> {
    await this.provider.delete(key);
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.provider.getSignedUrl(key, expiresInSeconds);
  }
}

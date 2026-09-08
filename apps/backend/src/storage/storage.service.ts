import { Inject, Injectable } from '@nestjs/common';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

export const S3_CLIENT = 'S3_CLIENT';

// Only the surface StorageService actually calls — kept minimal so a test
// double can implement it without pulling in the real AWS SDK types.
export interface S3ClientLike {
  send(command: unknown): Promise<unknown>;
}

@Injectable()
export class StorageService {
  private readonly bucket = process.env.MINIO_BUCKET ?? 'neo-products';

  constructor(@Inject(S3_CLIENT) private readonly client: S3ClientLike) {}

  async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  async uploadImage(imageBase64: string, sellerId: string, filename: string): Promise<string> {
    const raw = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const buffer = Buffer.from(raw, 'base64');
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${sellerId}/${Date.now()}-${safeName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
      }),
    );

    const base = (process.env.MINIO_PUBLIC_URL ?? process.env.MINIO_ENDPOINT ?? 'http://localhost:9000').replace(/\/$/, '');
    return `${base}/${this.bucket}/${key}`;
  }
}

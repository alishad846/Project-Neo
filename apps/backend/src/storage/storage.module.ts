import { Module, OnModuleInit } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { StorageService, S3_CLIENT } from './storage.service';

@Module({
  providers: [
    {
      provide: S3_CLIENT,
      useFactory: () =>
        new S3Client({
          endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
          region: 'us-east-1',
          forcePathStyle: true,
          credentials: {
            accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'neo',
            secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'neominio',
          },
        }),
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule implements OnModuleInit {
  constructor(private readonly storage: StorageService) {}

  async onModuleInit() {
    await this.storage.ensureBucket();
  }
}

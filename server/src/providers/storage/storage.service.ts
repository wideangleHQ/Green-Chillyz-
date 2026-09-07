import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('storage.accountId');
    this.bucketName = this.configService.get<string>('storage.bucketName') || '';
    this.publicUrl = this.configService.get<string>('storage.publicUrl') || '';

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: accountId
        ? `https://${accountId}.r2.cloudflarestorage.com`
        : undefined,
      credentials: {
        accessKeyId:
          this.configService.get<string>('storage.accessKeyId') || '',
        secretAccessKey:
          this.configService.get<string>('storage.secretAccessKey') || '',
      },
    });
  }

  async upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    this.logger.log(`File uploaded: ${key}`);
    return this.getPublicUrl(key);
  }

  async delete(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
    this.logger.log(`File deleted: ${key}`);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}

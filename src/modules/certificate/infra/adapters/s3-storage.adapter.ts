import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { FileStoragePort } from '../../domain/ports';

export class S3StorageAdapter implements FileStoragePort {
  constructor(
    private readonly s3Client: S3Client,
    private readonly bucket: string,
    private readonly endpoint?: string,
  ) {}

  async upload(key: string, content: Buffer, contentType: string): Promise<string> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: content,
        ContentType: contentType,
      }),
    );

    if (this.endpoint) {
      return `${this.endpoint}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new Error(`Empty response body for S3 key: ${key}`);
    }

    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  async delete(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}

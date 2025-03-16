import { S3Client, PutObjectCommand, GetObjectCommand, GetObjectCommandOutput, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Logger } from './logger';
import { Readable } from 'stream';

export class S3 {
  private client: S3Client;
  private logger: Logger;
  private bucket: string;

  constructor() {
    this.client = new S3Client({});
    this.logger = new Logger('s3-util');
    this.bucket = 'housef2-transaction-files';
  }

  async getSignedUploadUrl(params: {
    key: string;
    contentType: string;
    expiresIn: number;
  }): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
        ContentType: params.contentType,
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: params.expiresIn
      });

      return url;
    } catch (error) {
      this.logger.error('Error generating signed URL', { error, params });
      throw error;
    }
  }

  async getFileContent(bucket: string, key: string): Promise<string> {
    try {
        const command: GetObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const response: GetObjectCommandOutput = await this.client.send(command);
      const stream: Readable = response.Body as Readable;
      
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      });
    } catch (error) {
      this.logger.error('Error getting file content', { error, bucket, key });
      throw error;
    }
  }

  /**
   * Delete an object from S3
   * @param params - The delete object parameters
   */
  async deleteObject(params: {
    Bucket: string;
    Key: string;
  }): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: params.Bucket,
        Key: params.Key
      });

      await this.client.send(command);
      this.logger.info('Object deleted from S3', { bucket: params.Bucket, key: params.Key });
    } catch (error) {
      this.logger.error('Error deleting object from S3', { error, params });
      throw error;
    }
  }
} 
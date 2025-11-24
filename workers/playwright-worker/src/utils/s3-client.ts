import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

import { config } from '../config';
import { logger } from '../logger';

/**
 * S3 client for downloading files from MinIO/S3
 */
export class S3FileClient {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const s3Endpoint = config.s3Endpoint;
    const s3Region = config.s3Region;
    const s3AccessKey = config.s3AccessKeyId;
    const s3SecretKey = config.s3SecretAccessKey;
    this.bucket = config.s3Bucket;

    this.client = new S3Client({
      endpoint: s3Endpoint,
      region: s3Region,
      credentials: {
        accessKeyId: s3AccessKey,
        secretAccessKey: s3SecretKey,
      },
      forcePathStyle: true, // Required for MinIO
    });

    logger.info('S3 client initialized', {
      endpoint: s3Endpoint,
      bucket: this.bucket,
    });
  }

  /**
   * Download a file from S3 to local disk
   */
  async downloadFile(key: string, localPath: string, bucket?: string): Promise<void> {
    const targetBucket = bucket || this.bucket;

    try {
      logger.debug(`Downloading ${key} from S3 bucket ${targetBucket}`);

      const command = new GetObjectCommand({
        Bucket: targetBucket,
        Key: key,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new Error('No body in S3 response');
      }

      // Stream the file to disk
      const stream = response.Body as Readable;
      const writeStream = createWriteStream(localPath);

      await pipeline(stream, writeStream);

      logger.info(`File downloaded successfully`, {
        key,
        localPath,
        size: response.ContentLength,
      });
    } catch (error) {
      logger.error(`Failed to download file from S3`, {
        key,
        bucket: targetBucket,
        error,
      });
      throw error;
    }
  }

  /**
   * Check if a file exists in S3
   */
  async fileExists(key: string, bucket?: string): Promise<boolean> {
    const targetBucket = bucket || this.bucket;

    try {
      const command = new GetObjectCommand({
        Bucket: targetBucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if ((error as { name: string }).name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }
}

// Singleton instance
let s3ClientInstance: S3FileClient | null = null;

export function getS3Client(): S3FileClient {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3FileClient();
  }
  return s3ClientInstance;
}

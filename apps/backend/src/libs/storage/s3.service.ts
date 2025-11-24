import { Readable } from 'stream';

import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { getStorageConfig, StorageConfig } from './storage.config';

export interface UploadResult {
  key: string;
  bucket: string;
  url: string;
  size?: number;
}

export interface DownloadResult {
  stream: Readable;
  contentType?: string;
  contentLength?: number;
}

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private config: StorageConfig;

  constructor() {
    this.config = getStorageConfig();
    this.s3Client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      forcePathStyle: this.config.forcePathStyle,
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  /**
   * Ensure the default bucket exists, create if not
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.config.bucket })
      );
      this.logger.log(`Bucket ${this.config.bucket} exists`);
    } catch (error) {
      if ((error as { name: string }).name === 'NotFound') {
        this.logger.log(`Creating bucket ${this.config.bucket}`);
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.config.bucket })
        );
        this.logger.log(`Bucket ${this.config.bucket} created`);
      } else {
        this.logger.error('Error checking bucket', error);
      }
    }
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    key: string,
    body: Buffer | Readable | string,
    contentType?: string,
    bucket?: string
  ): Promise<UploadResult> {
    const targetBucket = bucket || this.config.bucket;

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: targetBucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        },
      });

      await upload.done();

      this.logger.log(`File uploaded: ${key} to bucket ${targetBucket}`);

      return {
        key,
        bucket: targetBucket,
        url: `${this.config.endpoint}/${targetBucket}/${key}`,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}`, error);
      throw error;
    }
  }

  /**
   * Download a file from S3
   */
  async downloadFile(
    key: string,
    bucket?: string
  ): Promise<DownloadResult> {
    const targetBucket = bucket || this.config.bucket;

    try {
      const command = new GetObjectCommand({
        Bucket: targetBucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('No body in S3 response');
      }

      return {
        stream: response.Body as Readable,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
      };
    } catch (error) {
      this.logger.error(`Failed to download file ${key}`, error);
      throw error;
    }
  }

  /**
   * Get a presigned URL for downloading a file
   */
  async getPresignedUrl(
    key: string,
    expiresIn: number = 3600,
    bucket?: string
  ): Promise<string> {
    const targetBucket = bucket || this.config.bucket;

    try {
      const command = new GetObjectCommand({
        Bucket: targetBucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for ${key}`, error);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string, bucket?: string): Promise<void> {
    const targetBucket = bucket || this.config.bucket;

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: targetBucket,
          Key: key,
        })
      );

      this.logger.log(`File deleted: ${key} from bucket ${targetBucket}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}`, error);
      throw error;
    }
  }

  /**
   * List files in a bucket with optional prefix
   */
  async listFiles(
    prefix?: string,
    bucket?: string
  ): Promise<string[]> {
    const targetBucket = bucket || this.config.bucket;

    try {
      const command = new ListObjectsV2Command({
        Bucket: targetBucket,
        Prefix: prefix,
      });

      const response = await this.s3Client.send(command);
      return response.Contents?.map((obj) => obj.Key || '') || [];
    } catch (error) {
      this.logger.error('Failed to list files', error);
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string, bucket?: string): Promise<boolean> {
    const targetBucket = bucket || this.config.bucket;

    try {
      await this.s3Client.send(
        new GetObjectCommand({
          Bucket: targetBucket,
          Key: key,
        })
      );
      return true;
    } catch (error) {
      if ((error as { name: string }).name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get the S3 client for advanced operations
   */
  getClient(): S3Client {
    return this.s3Client;
  }

  /**
   * Get the storage configuration
   */
  getConfig(): StorageConfig {
    return this.config;
  }
}

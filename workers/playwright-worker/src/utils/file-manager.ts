import { createWriteStream, promises as fs } from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import { pipeline } from 'stream/promises';

import { config } from '../config';
import { logger } from '../logger';

import { getS3Client } from './s3-client';

export interface DownloadOptions {
  maxSize?: number;
  timeout?: number;
}

/**
 * File manager for handling temporary files
 */
export class FileManager {
  private tempDir: string;
  private s3Client = getS3Client();

  constructor() {
    this.tempDir = config.tempDir;
  }

  /**
   * Initialize temp directory
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.debug(`Temp directory initialized: ${this.tempDir}`);
    } catch (error) {
      logger.error('Failed to create temp directory', error);
      throw error;
    }
  }

  /**
   * Create a unique temp directory for a job
   */
  async createJobTempDir(jobId: string): Promise<string> {
    const jobDir = path.join(this.tempDir, `job-${jobId}`);
    await fs.mkdir(jobDir, { recursive: true });
    logger.debug(`Created job temp directory: ${jobDir}`);
    return jobDir;
  }

  /**
   * Download file from S3
   */
  async downloadFromS3(
    s3Key: string,
    localPath: string,
    bucket?: string
  ): Promise<string> {
    try {
      logger.info(`Downloading from S3: ${s3Key}`);
      await this.s3Client.downloadFile(s3Key, localPath, bucket);
      
      // Validate file was downloaded
      const stats = await fs.stat(localPath);
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      logger.info(`File downloaded from S3`, {
        s3Key,
        localPath,
        size: stats.size,
      });

      return localPath;
    } catch (error) {
      logger.error('Failed to download from S3', { s3Key, error });
      throw error;
    }
  }

  /**
   * Download file from URL
   */
  async downloadFromUrl(
    url: string,
    localPath: string,
    options: DownloadOptions = {}
  ): Promise<string> {
    const maxSize = options.maxSize || config.maxFileSize;
    const timeout = options.timeout || config.uploadTimeout;

    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      const request = client.get(url, { timeout }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        const contentLength = parseInt(response.headers['content-length'] || '0', 10);
        if (contentLength > maxSize) {
          reject(new Error(`File too large: ${contentLength} bytes (max: ${maxSize})`));
          return;
        }

        const writeStream = createWriteStream(localPath);
        let downloadedSize = 0;

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (downloadedSize > maxSize) {
            writeStream.destroy();
            reject(new Error(`File size exceeded limit during download`));
          }
        });

        pipeline(response, writeStream)
          .then(() => {
            logger.info(`File downloaded from URL`, {
              url,
              localPath,
              size: downloadedSize,
            });
            resolve(localPath);
          })
          .catch(reject);
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }

  /**
   * Validate file exists and check size
   */
  async validateFile(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      
      if (!stats.isFile()) {
        logger.warn(`Path is not a file: ${filePath}`);
        return false;
      }

      if (stats.size === 0) {
        logger.warn(`File is empty: ${filePath}`);
        return false;
      }

      if (stats.size > config.maxFileSize) {
        logger.warn(`File too large: ${stats.size} bytes (max: ${config.maxFileSize})`);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('File validation failed', { filePath, error });
      return false;
    }
  }

  /**
   * Cleanup a single file
   */
  async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.debug(`File deleted: ${filePath}`);
    } catch (error) {
      // Ignore errors if file doesn't exist
      if ((error as { code?: string }).code !== 'ENOENT') {
        logger.warn('Failed to delete file', { filePath, error });
      }
    }
  }

  /**
   * Cleanup entire job directory
   */
  async cleanupJobDir(jobDir: string): Promise<void> {
    try {
      await fs.rm(jobDir, { recursive: true, force: true });
      logger.debug(`Job directory deleted: ${jobDir}`);
    } catch (error) {
      logger.warn('Failed to delete job directory', { jobDir, error });
    }
  }

  /**
   * Get temp directory path
   */
  getTempDir(): string {
    return this.tempDir;
  }

  /**
   * Generate a safe filename from S3 key or URL
   */
  getSafeFilename(source: string): string {
    const basename = path.basename(source);
    // Remove any potentially dangerous characters
    return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}

// Singleton instance
let fileManagerInstance: FileManager | null = null;

export function getFileManager(): FileManager {
  if (!fileManagerInstance) {
    fileManagerInstance = new FileManager();
  }
  return fileManagerInstance;
}

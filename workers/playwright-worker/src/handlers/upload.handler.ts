import * as path from 'path';

import { Page } from 'playwright';

import { logger } from '../logger';
import { JobResult, UploadJobData } from '../types';
import { getFileManager } from '../utils/file-manager';

/**
 * Handle file upload to browser forms
 */
export async function handleUpload(
  page: Page,
  data: UploadJobData
): Promise<JobResult> {
  const startTime = Date.now();
  const fileManager = getFileManager();
  let jobDir: string | null = null;
  const uploadedFiles: string[] = [];

  try {
    logger.info(`Uploading file(s) to ${data.selector} on ${data.url}`, {
      fileSource: data.fileSource,
      fileCount: data.files?.length || 1,
    });

    // Navigate to URL if not already there
    if (page.url() !== data.url) {
      await page.goto(data.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    }

    // Wait for file input to be available
    await page.waitForSelector(data.selector, {
      state: 'attached',
      timeout: 10000,
    });

    // Create temp directory for this job
    jobDir = await fileManager.createJobTempDir(data.taskId || Date.now().toString());

    // Download files based on source
    const localFilePaths: string[] = [];

    if (data.files && data.files.length > 0) {
      // Handle multiple files
      for (const file of data.files) {
        const localPath = await downloadFile(file, jobDir, fileManager);
        localFilePaths.push(localPath);
        uploadedFiles.push(file.s3Key || file.fileUrl || file.filePath || 'unknown');
      }
    } else {
      // Handle single file (legacy support)
      const file = {
        fileSource: data.fileSource,
        s3Key: data.s3Key,
        s3Bucket: data.s3Bucket,
        fileUrl: data.fileUrl,
        filePath: data.filePath,
      };
      const localPath = await downloadFile(file, jobDir, fileManager);
      localFilePaths.push(localPath);
      uploadedFiles.push(data.s3Key || data.fileUrl || data.filePath || 'unknown');
    }

    // Validate all files
    for (const filePath of localFilePaths) {
      const isValid = await fileManager.validateFile(filePath);
      if (!isValid) {
        throw new Error(`File validation failed: ${filePath}`);
      }
    }

    logger.debug('Files ready for upload', {
      count: localFilePaths.length,
      paths: localFilePaths,
    });

    // Upload files to browser
    await page.setInputFiles(data.selector, localFilePaths);

    logger.info('Files uploaded to browser', {
      selector: data.selector,
      fileCount: localFilePaths.length,
    });

    // Wait for upload to complete if requested
    if (data.waitForUpload) {
      const timeout = data.uploadTimeout || 10000;
      await page.waitForTimeout(timeout);
      logger.debug('Waited for upload completion', { timeout });
    }

    // Verify upload (check if input has files)
    const fileCount = await page.evaluate(`
      (function(selector) {
        const input = document.querySelector(selector);
        return input && input.files ? input.files.length : 0;
      })('${data.selector.replace(/'/g, "\\'")}')
    `);

    logger.info('Upload successful', {
      selector: data.selector,
      filesUploaded: fileCount,
      verified: fileCount === localFilePaths.length,
    });

    return {
      success: true,
      data: {
        url: page.url(),
        selector: data.selector,
        filesUploaded: uploadedFiles,
        fileCount: fileCount,
        verified: fileCount === localFilePaths.length,
      },
      duration: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('Upload failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  } finally {
    // Cleanup temp files
    if (jobDir) {
      await fileManager.cleanupJobDir(jobDir);
      logger.debug('Temp files cleaned up', { jobDir });
    }
  }
}

/**
 * Download a file based on source type
 */
async function downloadFile(
  file: {
    fileSource?: string;
    s3Key?: string;
    s3Bucket?: string;
    fileUrl?: string;
    filePath?: string;
  },
  jobDir: string,
  fileManager: ReturnType<typeof getFileManager>
): Promise<string> {
  const fileSource = file.fileSource || 's3';

  switch (fileSource) {
    case 's3': {
      if (!file.s3Key) {
        throw new Error('s3Key is required for S3 file source');
      }
      const filename = fileManager.getSafeFilename(file.s3Key);
      const localPath = path.join(jobDir, filename);
      await fileManager.downloadFromS3(file.s3Key, localPath, file.s3Bucket);
      return localPath;
    }

    case 'url': {
      if (!file.fileUrl) {
        throw new Error('fileUrl is required for URL file source');
      }
      const filename = fileManager.getSafeFilename(file.fileUrl);
      const localPath = path.join(jobDir, filename);
      await fileManager.downloadFromUrl(file.fileUrl, localPath);
      return localPath;
    }

    case 'local': {
      if (!file.filePath) {
        throw new Error('filePath is required for local file source');
      }
      // For local files, just validate they exist
      const isValid = await fileManager.validateFile(file.filePath);
      if (!isValid) {
        throw new Error(`Local file not found or invalid: ${file.filePath}`);
      }
      return file.filePath;
    }

    default:
      throw new Error(`Unknown file source: ${fileSource}`);
  }
}

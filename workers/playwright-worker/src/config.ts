import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2', 10),
  },
  browser: {
    headless: process.env.BROWSER_HEADLESS !== 'false',
    timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  healthCheck: {
    port: parseInt(process.env.HEALTH_CHECK_PORT || '3001', 10),
  },
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // S3/MinIO configuration
  s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  s3Bucket: process.env.S3_BUCKET || 'aiflowo-uploads',
  s3Region: process.env.S3_REGION || 'us-east-1',

  // File upload configuration
  tempDir: process.env.TEMP_DIR || '/tmp/playwright-uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10), // 100MB default
  uploadTimeout: parseInt(process.env.UPLOAD_TIMEOUT || '30000', 10),
};

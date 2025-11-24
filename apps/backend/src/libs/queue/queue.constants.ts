/**
 * Queue names used across the application
 */
export enum QueueName {
  TASK = 'task',
  BROWSER = 'browser',
  MEDIA = 'media',
  EMAIL = 'email',
}

/**
 * Job types for each queue
 */
export enum TaskJobType {
  EXECUTE_TASK = 'execute_task',
  GENERATE_PLAN = 'generate_plan',
  UPDATE_STATUS = 'update_status',
}

export enum BrowserJobType {
  NAVIGATE = 'navigate',
  SCREENSHOT = 'screenshot',
  FILL_FORM = 'fill_form',
  CLICK = 'click',
  SEARCH = 'search',
  TYPE = 'type',
  WAIT = 'wait',
  UPLOAD = 'upload',
}

export enum MediaJobType {
  PROCESS_IMAGE = 'process_image',
  PROCESS_VIDEO = 'process_video',
  COMPRESS = 'compress',
  UPLOAD_S3 = 'upload_s3',
}

export enum EmailJobType {
  SEND_EMAIL = 'send_email',
  SEND_MAGIC_LINK = 'send_magic_link',
  SEND_NOTIFICATION = 'send_notification',
}

/**
 * Default job options
 */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: {
    age: 24 * 3600, // 24 hours
    count: 1000,
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // 7 days
  },
};

/**
 * Queue configuration
 */
export const QUEUE_CONFIG = {
  [QueueName.TASK]: {
    defaultJobOptions: {
      ...DEFAULT_JOB_OPTIONS,
      attempts: 5, // More retries for critical tasks
      priority: 10,
    },
  },
  [QueueName.BROWSER]: {
    defaultJobOptions: {
      ...DEFAULT_JOB_OPTIONS,
      attempts: 3,
      timeout: 60000, // 1 minute timeout
    },
  },
  [QueueName.MEDIA]: {
    defaultJobOptions: {
      ...DEFAULT_JOB_OPTIONS,
      attempts: 3,
      timeout: 120000, // 2 minutes for media processing
    },
  },
  [QueueName.EMAIL]: {
    defaultJobOptions: {
      ...DEFAULT_JOB_OPTIONS,
      attempts: 5, // Important to deliver emails
      backoff: {
        type: 'exponential' as const,
        delay: 5000,
      },
    },
  },
};

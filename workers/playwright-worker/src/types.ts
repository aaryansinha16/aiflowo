/**
 * Job types that the Playwright worker can handle
 */
export enum BrowserJobType {
  NAVIGATE = 'navigate',
  SCREENSHOT = 'screenshot',
  FILL_FORM = 'fill_form',
  CLICK = 'click',
  SEARCH = 'search',
  TYPE = 'type',
  WAIT = 'wait',
  UPLOAD = 'upload',
  FILL_FORM_AUTO = 'fill_form_auto',
}

/**
 * Base job data interface
 */
export interface BaseJobData {
  type: BrowserJobType;
  taskId?: string;
  url?: string;
}

/**
 * Navigate job data
 */
export interface NavigateJobData extends BaseJobData {
  type: BrowserJobType.NAVIGATE;
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
}

/**
 * Screenshot job data
 */
export interface ScreenshotJobData extends BaseJobData {
  type: BrowserJobType.SCREENSHOT;
  url: string;
  fullPage?: boolean;
  selector?: string;
}

/**
 * Click job data
 */
export interface ClickJobData extends BaseJobData {
  type: BrowserJobType.CLICK;
  url: string;
  selector: string;
  waitForNavigation?: boolean;
}

/**
 * Fill form job data
 */
export interface FillFormJobData extends BaseJobData {
  type: BrowserJobType.FILL_FORM;
  url: string;
  fields: Array<{
    selector: string;
    value: string;
    type?: 'text' | 'select' | 'checkbox' | 'radio';
  }>;
  submitSelector?: string;
}

/**
 * Search job data
 */
export interface SearchJobData extends BaseJobData {
  type: BrowserJobType.SEARCH;
  url: string;
  searchSelector: string;
  searchTerm: string;
  submitSelector?: string;
}

/**
 * Type job data - for human-like typing
 */
export interface TypeJobData extends BaseJobData {
  type: BrowserJobType.TYPE;
  url: string;
  selector: string;
  text: string;
  delay?: number; // Delay between keystrokes in ms (default: 0)
  clearFirst?: boolean; // Clear existing text before typing
  pressKey?: 'Enter' | 'Tab' | 'Escape' | 'ArrowDown' | 'ArrowUp'; // Press special key after typing
}

/**
 * Wait job data - for waiting on dynamic content
 */
export interface WaitJobData extends BaseJobData {
  type: BrowserJobType.WAIT;
  url: string;
  waitType: 'selector' | 'text' | 'state' | 'networkidle' | 'timeout' | 'function';
  selector?: string; // Required for 'selector' and 'state' waitTypes
  text?: string; // Required for 'text' waitType
  state?: 'visible' | 'hidden' | 'attached' | 'detached'; // For 'state' waitType
  timeout?: number; // Timeout in ms (default: 30000)
  customFunction?: string; // JavaScript function for 'function' waitType
}

/**
 * Upload job data - for file uploads
 */
export interface UploadJobData extends BaseJobData {
  type: BrowserJobType.UPLOAD;
  url: string;
  selector: string; // File input selector
  fileSource?: 's3' | 'url' | 'local'; // Source of the file (default: 's3')

  // Single file upload (legacy)
  s3Key?: string; // S3 object key
  s3Bucket?: string; // S3 bucket name (optional, uses default)
  fileUrl?: string; // Direct URL to download
  filePath?: string; // Local file path

  // Multiple file upload
  files?: Array<{
    fileSource?: 's3' | 'url' | 'local';
    s3Key?: string;
    s3Bucket?: string;
    fileUrl?: string;
    filePath?: string;
  }>;

  waitForUpload?: boolean; // Wait after upload (default: false)
  uploadTimeout?: number; // Timeout for upload wait in ms
}

/**
 * Automatic form filling with AI-powered field mapping
 */
export interface FillFormAutoJobData extends BaseJobData {
  type: BrowserJobType.FILL_FORM_AUTO;
  url: string;

  // Form structure (from DOM analysis)
  formStructure?: {
    url: string;
    title: string;
    fields: Array<{
      selector: string;
      type: string;
      label: string;
      name?: string;
      required: boolean;
      options?: string[];
    }>;
  };

  // Field mappings (from AI)
  mappings?: Array<{
    selector: string;
    value: any;
    confidence: number;
    fieldType: string;
    source?: string;
  }>;
}

/**
 * Union type of all job data
 */
export type BrowserJob =
  | NavigateJobData
  | ScreenshotJobData
  | ClickJobData
  | FillFormJobData
  | SearchJobData
  | TypeJobData
  | WaitJobData
  | UploadJobData
  | FillFormAutoJobData;

/**
 * Job result interface
 */
export interface JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  screenshot?: string; // Base64 encoded screenshot
  duration?: number; // Execution time in ms
}

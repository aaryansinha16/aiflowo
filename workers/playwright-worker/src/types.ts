/**
 * Job types that the Playwright worker can handle
 */
export enum BrowserJobType {
  NAVIGATE = 'navigate',
  SCREENSHOT = 'screenshot',
  FILL_FORM = 'fill_form',
  CLICK = 'click',
  SEARCH = 'search',
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
 * Union type of all job data
 */
export type BrowserJob =
  | NavigateJobData
  | ScreenshotJobData
  | ClickJobData
  | FillFormJobData
  | SearchJobData;

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

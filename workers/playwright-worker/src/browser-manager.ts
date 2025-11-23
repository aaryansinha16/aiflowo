import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { config } from './config';
import { logger } from './logger';

/**
 * Singleton class to manage Playwright browser lifecycle
 */
export class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private isInitializing = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  /**
   * Initialize browser with proper configuration
   */
  async initialize(): Promise<void> {
    if (this.browser) {
      logger.debug('Browser already initialized');
      return;
    }

    if (this.isInitializing) {
      logger.debug('Browser initialization in progress, waiting...');
      await this.waitForInitialization();
      return;
    }

    try {
      this.isInitializing = true;
      logger.info('Initializing Playwright browser', {
        headless: config.browser.headless,
      });

      this.browser = await chromium.launch({
        headless: config.browser.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
        timeout: config.browser.timeout,
      });

      logger.info('Browser initialized successfully', {
        version: this.browser.version(),
      });

      // Handle browser disconnection
      this.browser.on('disconnected', () => {
        logger.warn('Browser disconnected unexpectedly');
        this.browser = null;
      });
    } catch (error) {
      logger.error('Failed to initialize browser', error);
      this.browser = null;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Wait for browser initialization to complete
   */
  private async waitForInitialization(): Promise<void> {
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 100; // 100ms
    let waited = 0;

    while (this.isInitializing && waited < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    if (this.isInitializing) {
      throw new Error('Browser initialization timeout');
    }

    if (!this.browser) {
      throw new Error('Browser failed to initialize');
    }
  }

  /**
   * Create a new browser context (isolated session)
   */
  async createContext(options?: {
    userAgent?: string;
    viewport?: { width: number; height: number };
    ignoreHTTPSErrors?: boolean;
  }): Promise<BrowserContext> {
    if (!this.browser) {
      await this.initialize();
    }

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    logger.debug('Creating new browser context', options);

    const context = await this.browser.newContext({
      userAgent: options?.userAgent,
      viewport: options?.viewport || { width: 1920, height: 1080 },
      ignoreHTTPSErrors: options?.ignoreHTTPSErrors ?? true,
    });

    return context;
  }

  /**
   * Create a new page in the default context
   */
  async createPage(): Promise<Page> {
    const context = await this.createContext();
    const page = await context.newPage();
    
    // Set default timeout
    page.setDefaultTimeout(config.browser.timeout);
    
    logger.debug('Created new page');
    return page;
  }

  /**
   * Close browser context
   */
  async closeContext(context: BrowserContext): Promise<void> {
    try {
      await context.close();
      logger.debug('Browser context closed');
    } catch (error) {
      logger.error('Error closing browser context', error);
    }
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (!this.browser) {
      logger.debug('No browser to close');
      return;
    }

    try {
      logger.info('Closing browser');
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed successfully');
    } catch (error) {
      logger.error('Error closing browser', error);
      this.browser = null;
    }
  }

  /**
   * Get browser status
   */
  isConnected(): boolean {
    return this.browser !== null && this.browser.isConnected();
  }

  /**
   * Restart browser (close and reinitialize)
   */
  async restart(): Promise<void> {
    logger.info('Restarting browser');
    await this.close();
    await this.initialize();
  }
}

// Export singleton instance
export const browserManager = BrowserManager.getInstance();

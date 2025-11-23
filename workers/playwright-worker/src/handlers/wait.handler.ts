import { Page } from 'playwright';

import { logger } from '../logger';
import { JobResult, WaitJobData } from '../types';

/**
 * Handle various waiting scenarios for dynamic content and page states
 */
export async function handleWait(
  page: Page,
  data: WaitJobData
): Promise<JobResult> {
  const startTime = Date.now();

  try {
    logger.info(`Waiting for ${data.waitType} on ${data.url}`, {
      waitType: data.waitType,
      timeout: data.timeout,
    });

    // Navigate to URL if not already there
    if (page.url() !== data.url) {
      await page.goto(data.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    }

    const timeout = data.timeout || 30000;
    let result: Record<string, unknown> = {};

    switch (data.waitType) {
      case 'selector':
        if (!data.selector) {
          throw new Error('Selector is required for waitType: selector');
        }
        await page.waitForSelector(data.selector, {
          state: data.state || 'visible',
          timeout,
        });
        result = {
          selector: data.selector,
          state: data.state || 'visible',
        };
        logger.debug('Selector found', result);
        break;

      case 'text':
        if (!data.text) {
          throw new Error('Text is required for waitType: text');
        }
        // Wait for text to appear in the page
        await page.waitForFunction(
          `(searchText) => document.body.innerText.includes(searchText)`,
          data.text,
          { timeout }
        );
        result = {
          text: data.text,
          found: true,
        };
        logger.debug('Text found', result);
        break;

      case 'state':
        if (!data.selector) {
          throw new Error('Selector is required for waitType: state');
        }
        await page.waitForSelector(data.selector, {
          state: data.state || 'visible',
          timeout,
        });
        result = {
          selector: data.selector,
          state: data.state || 'visible',
        };
        logger.debug('Element state achieved', result);
        break;

      case 'networkidle':
        await page.waitForLoadState('networkidle', { timeout });
        result = {
          loadState: 'networkidle',
        };
        logger.debug('Network idle achieved');
        break;

      case 'timeout': {
        // Simple timeout wait
        const waitMs = data.timeout || 1000;
        await page.waitForTimeout(waitMs);
        result = {
          waited: waitMs,
        };
        logger.debug('Timeout wait completed', { ms: waitMs });
        break;
      }

      case 'function':
        if (!data.customFunction) {
          throw new Error('customFunction is required for waitType: function');
        }
        // Wait for custom JavaScript function to return true
        await page.waitForFunction(data.customFunction, null, { timeout });
        result = {
          customFunction: 'executed',
        };
        logger.debug('Custom function condition met');
        break;

      default:
        throw new Error(`Unknown waitType: ${data.waitType}`);
    }

    logger.info('Wait successful', {
      waitType: data.waitType,
      duration: Date.now() - startTime,
    });

    return {
      success: true,
      data: {
        url: page.url(),
        waitType: data.waitType,
        ...result,
      },
      duration: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('Wait failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

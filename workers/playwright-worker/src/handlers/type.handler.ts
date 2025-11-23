import { Page } from 'playwright';

import { logger } from '../logger';
import { JobResult, TypeJobData } from '../types';

/**
 * Handle typing text into an input field with human-like behavior
 */
export async function handleType(
  page: Page,
  data: TypeJobData
): Promise<JobResult> {
  const startTime = Date.now();

  try {
    logger.info(`Typing into ${data.selector} on ${data.url}`, {
      textLength: data.text.length,
      delay: data.delay,
    });

    // Navigate to URL if not already there
    if (page.url() !== data.url) {
      await page.goto(data.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    }

    // Wait for element to be visible
    await page.waitForSelector(data.selector, {
      state: 'visible',
      timeout: 10000,
    });

    // Clear existing text if requested
    if (data.clearFirst) {
      await page.fill(data.selector, '');
      logger.debug('Cleared existing text');
    }

    // Type with delay (human-like)
    if (data.delay && data.delay > 0) {
      await page.type(data.selector, data.text, { delay: data.delay });
      logger.debug('Typed with delay', { delay: data.delay });
    } else {
      // Fast typing without delay
      await page.type(data.selector, data.text);
      logger.debug('Typed without delay');
    }

    // Press special key if requested
    if (data.pressKey) {
      await page.press(data.selector, data.pressKey);
      logger.debug('Pressed key', { key: data.pressKey });
    }

    // Get the final value for verification
    const finalValue = await page.inputValue(data.selector);

    logger.info('Typing successful', {
      selector: data.selector,
      expectedLength: data.text.length,
      actualLength: finalValue.length,
    });

    return {
      success: true,
      data: {
        url: page.url(),
        selector: data.selector,
        textLength: data.text.length,
        finalValue: finalValue,
        verified: finalValue === data.text,
      },
      duration: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('Typing failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

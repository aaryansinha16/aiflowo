import { Page } from 'playwright';
import { ClickJobData, JobResult } from '../types';
import { logger } from '../logger';

export async function handleClick(
  page: Page,
  data: ClickJobData
): Promise<JobResult> {
  const startTime = Date.now();

  try {
    logger.info(`Clicking element ${data.selector} on ${data.url}`);

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

    // Click the element
    if (data.waitForNavigation) {
      await Promise.all([
        page.waitForNavigation({ timeout: 30000 }),
        page.click(data.selector),
      ]);
    } else {
      await page.click(data.selector);
    }

    logger.info('Click successful', {
      selector: data.selector,
      url: page.url(),
    });

    return {
      success: true,
      data: {
        url: page.url(),
        selector: data.selector,
      },
      duration: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('Click failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

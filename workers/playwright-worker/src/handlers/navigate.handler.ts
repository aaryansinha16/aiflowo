import { Page } from 'playwright';
import { NavigateJobData, JobResult } from '../types';
import { logger } from '../logger';

export async function handleNavigate(
  page: Page,
  data: NavigateJobData
): Promise<JobResult> {
  const startTime = Date.now();

  try {
    logger.info(`Navigating to ${data.url}`);

    await page.goto(data.url, {
      waitUntil: data.waitUntil || 'domcontentloaded',
      timeout: 30000,
    });

    const title = await page.title();
    const url = page.url();

    logger.info(`Navigation successful: ${title}`);

    return {
      success: true,
      data: {
        url,
        title,
      },
      duration: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('Navigation failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

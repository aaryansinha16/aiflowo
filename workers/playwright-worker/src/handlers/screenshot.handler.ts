import { Page } from 'playwright';
import { ScreenshotJobData, JobResult } from '../types';
import { logger } from '../logger';

export async function handleScreenshot(
  page: Page,
  data: ScreenshotJobData
): Promise<JobResult> {
  const startTime = Date.now();

  try {
    logger.info(`Taking screenshot of ${data.url}`);

    // Navigate to URL if not already there
    if (page.url() !== data.url) {
      await page.goto(data.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    }

    // Take screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: data.fullPage ?? false,
      type: 'png',
    });

    const screenshotBase64 = screenshotBuffer.toString('base64');

    logger.info('Screenshot captured successfully', {
      size: screenshotBuffer.length,
    });

    return {
      success: true,
      data: {
        url: page.url(),
        screenshotSize: screenshotBuffer.length,
      },
      screenshot: screenshotBase64,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('Screenshot failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

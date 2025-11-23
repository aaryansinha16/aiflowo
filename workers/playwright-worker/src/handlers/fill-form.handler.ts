import { Page } from 'playwright';

import { logger } from '../logger';
import { FillFormJobData, JobResult } from '../types';

export async function handleFillForm(
  page: Page,
  data: FillFormJobData
): Promise<JobResult> {
  const startTime = Date.now();

  try {
    logger.info(`Filling form on ${data.url}`, {
      fieldCount: data.fields.length,
    });

    // Navigate to URL if not already there
    if (page.url() !== data.url) {
      await page.goto(data.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    }

    // Fill each field
    for (const field of data.fields) {
      try {
        await page.waitForSelector(field.selector, {
          state: 'visible',
          timeout: 10000,
        });

        switch (field.type) {
          case 'select':
            await page.selectOption(field.selector, field.value);
            break;
          case 'checkbox':
          case 'radio':
            await page.check(field.selector);
            break;
          case 'text':
          default:
            await page.fill(field.selector, field.value);
            break;
        }

        logger.debug(`Filled field: ${field.selector}`);
      } catch (error) {
        logger.warn(`Failed to fill field ${field.selector}`, error);
        // Continue with other fields
      }
    }

    // Submit form if submit selector provided
    if (data.submitSelector) {
      await page.waitForSelector(data.submitSelector, {
        state: 'visible',
        timeout: 10000,
      });
      await page.click(data.submitSelector);
      
      // Wait for navigation or a short delay
      try {
        await page.waitForNavigation({ timeout: 5000 });
      } catch {
        // No navigation occurred, that's okay
        await page.waitForTimeout(1000);
      }
    }

    logger.info('Form filled successfully');

    return {
      success: true,
      data: {
        url: page.url(),
        fieldsProcessed: data.fields.length,
      },
      duration: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('Form filling failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

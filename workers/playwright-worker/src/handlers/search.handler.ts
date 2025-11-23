import { Page } from 'playwright';

import { logger } from '../logger';
import { SearchJobData, JobResult } from '../types';

export async function handleSearch(
  page: Page,
  data: SearchJobData
): Promise<JobResult> {
  const startTime = Date.now();

  try {
    logger.info(`Searching for "${data.searchTerm}" on ${data.url}`);

    // Navigate to URL if not already there
    if (page.url() !== data.url) {
      await page.goto(data.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    }

    // Wait for search input
    await page.waitForSelector(data.searchSelector, {
      state: 'visible',
      timeout: 10000,
    });

    // Fill search term
    await page.fill(data.searchSelector, data.searchTerm);

    // Submit search
    if (data.submitSelector) {
      await page.click(data.submitSelector);
      await page.waitForNavigation({ timeout: 30000 });
    } else {
      // Try pressing Enter
      await page.press(data.searchSelector, 'Enter');
      try {
        await page.waitForNavigation({ timeout: 30000 });
      } catch {
        // Navigation may not occur for some searches
        await page.waitForTimeout(2000);
      }
    }

    logger.info('Search executed successfully');

    return {
      success: true,
      data: {
        url: page.url(),
        searchTerm: data.searchTerm,
      },
      duration: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('Search failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

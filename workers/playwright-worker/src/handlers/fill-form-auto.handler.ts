import { randomBytes } from 'crypto';

import { Page } from 'playwright';

import { logger } from '../logger';
import { FillFormAutoJobData, JobResult } from '../types';
import { domAnalyzer } from '../utils/dom-analyzer';
import { getS3Client } from '../utils/s3-client';

/**
 * Field mapping from backend
 */
interface FieldMapping {
  selector: string;
  value: string | number | boolean;
  confidence: number;
  fieldType: string;
  source?: string;
}

/**
 * Handle automatic form filling with AI-powered field mapping
 */
export async function handleFillFormAuto(
  page: Page,
  data: FillFormAutoJobData
): Promise<JobResult> {
  const startTime = Date.now();

  logger.info('Starting automatic form fill', {
    url: data.url,
    hasFormStructure: !!data.formStructure,
    hasMappings: !!data.mappings,
  });

  try {
    // Step 1: Navigate to the URL (if not already there)
    if (page.url() !== data.url) {
      await page.goto(data.url, { waitUntil: 'networkidle' });
      logger.info('Navigated to URL', { url: data.url });
    }

    // Step 2: Analyze DOM if not provided
    let formStructure = data.formStructure;
    if (!formStructure) {
      logger.info('Analyzing form structure from DOM');
      formStructure = await domAnalyzer.analyzeForm(page);
      logger.info('Form structure analyzed', {
        fieldCount: formStructure.fields.length,
      });
    }

    // Step 3: Use provided mappings or return structure for mapping
    if (!data.mappings) {
      // Return form structure to backend for AI mapping
      logger.info('Returning form structure for AI mapping');
      return {
        success: true,
        data: {
          url: data.url,
          formStructure,
          needsMapping: true,
        },
        duration: Date.now() - startTime,
      };
    }

    // Step 4: Fill the form with provided mappings
    logger.info('Filling form fields', { mappingCount: data.mappings.length });
    
    const results = await fillFormFields(page, data.mappings, formStructure.fields);

    // Take final screenshot and upload to S3
    const screenshot = await page.screenshot({ fullPage: true });
    const screenshotKey = `screenshots/form-${Date.now()}-${randomBytes(8).toString('hex')}.png`;
    const screenshotUrl = await getS3Client().uploadFile(screenshotKey, screenshot, 'image/png');
    logger.info('Screenshot uploaded to S3', { url: screenshotUrl });

    // Step 5: Capture browser session for later restoration
    logger.info('Capturing browser session');
    const cookies = await page.context().cookies();
    const localStorage = await page.evaluate(() => {
      /* eslint-disable no-undef */
      const items: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          items[key] = window.localStorage.getItem(key) || '';
        }
      }
      return items;
      /* eslint-enable no-undef */
    });
    const sessionStorage = await page.evaluate(() => {
      /* eslint-disable no-undef */
      const items: Record<string, string> = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          items[key] = window.sessionStorage.getItem(key) || '';
        }
      }
      return items;
      /* eslint-enable no-undef */
    });

    // OPTIONAL: Pause to let user see the filled form (for debugging)
    if (process.env.DEBUG_PAUSE === 'true') {
      logger.info('⏸️  Browser paused - form is filled. Press Ctrl+C when done reviewing.');
      await page.waitForTimeout(300000); // Wait 5 minutes
    }

    logger.info('Form fill complete', {
      fieldsFilled: results.filled,
      fieldsFailed: results.failed,
      verified: false,
      duration: Date.now() - startTime,
    });

    // Step 6: Verify fields
    const verification = await verifyFormFilled(page, data.mappings);

    const duration = Date.now() - startTime;

    logger.info('Form fill complete', {
      fieldsFilled: results.filled,
      fieldsFailed: results.failed,
      verified: verification.allFilled,
      duration,
    });

    return {
      success: true,
      data: {
        url: data.url,
        fieldsFilled: results.filled,
        fieldsFailed: results.failed,
        failedFields: results.failedFields,
        screenshot: screenshotUrl, // S3 URL instead of base64
        verification,
        // Session data for restoration
        session: {
          cookies,
          localStorage,
          sessionStorage,
          url: data.url,
          expiresAt: Date.now() + 3600000, // 1 hour expiry
          fieldMappings: data.mappings, // Include mappings for re-filling
        },
      },
      duration,
    };
  } catch (error) {
    logger.error('Form fill failed', error);
    
    // Take screenshot on error and upload to S3
    let errorScreenshot: string | undefined;
    try {
      const screenshot = await page.screenshot({ fullPage: true });
      const screenshotKey = `screenshots/error-${Date.now()}-${randomBytes(8).toString('hex')}.png`;
      errorScreenshot = await getS3Client().uploadFile(screenshotKey, screenshot, 'image/png');
      logger.info('Error screenshot uploaded to S3', { url: errorScreenshot });
    } catch (screenshotError) {
      logger.error('Failed to capture error screenshot', screenshotError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        url: data.url,
        screenshot: errorScreenshot,
      },
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Fill form fields based on mappings
 */
async function fillFormFields(
  page: Page,
  mappings: FieldMapping[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formFields: any[]
): Promise<{
  filled: number;
  failed: number;
  failedFields: Array<{ selector: string; error: string }>;
}> {
  let filled = 0;
  let failed = 0;
  const failedFields: Array<{ selector: string; error: string }> = [];

  for (const mapping of mappings) {
    try {
      // Find the field definition
      const field = formFields.find((f) => f.selector === mapping.selector);
      
      if (!field) {
        logger.warn('Field not found in form structure', {
          selector: mapping.selector,
        });
        continue;
      }

      // Wait for field to be visible (skip for radio buttons which need special handling)
      if (mapping.fieldType !== 'radio') {
        await page.waitForSelector(mapping.selector, { timeout: 5000 });
      }

      // Fill based on field type
      switch (mapping.fieldType) {
        case 'text':
        case 'email':
        case 'tel':
        case 'number':
        case 'url':
        case 'password':
          await page.fill(mapping.selector, String(mapping.value));
          break;

        case 'textarea':
          await page.fill(mapping.selector, String(mapping.value));
          break;

        case 'date':
        case 'datetime-local':
        case 'time':
        case 'week':
        case 'month':
          // Handle date/time format conversion if needed
          await page.fill(mapping.selector, String(mapping.value));
          break;

        case 'select':
          // Select by label or value
          await page.selectOption(mapping.selector, String(mapping.value));
          break;

        case 'radio': {
          // For radio buttons, we need to find all radios with this name and select by label
          const radioName = mapping.selector.match(/name="([^"]+)"/)?.[1];
          if (radioName) {
            // Get all radio options for this group
            const radios = await page.locator(`input[type="radio"][name="${radioName}"]`).all();
            
            // Try to find by value
            let found = false;
            for (const radio of radios) {
              const value = await radio.getAttribute('value');
              const mappingValueStr = String(mapping.value).toLowerCase();
              if (value === mapping.value || value?.toLowerCase() === mappingValueStr) {
                await radio.check();
                found = true;
                break;
              }
            }
            
            // If not found by value, try first radio
            if (!found && radios.length > 0) {
              await radios[0].check();
            }
          } else {
            // Try direct selector
            await page.locator(mapping.selector).check();
          }
          break;
        }

        case 'checkbox':
          if (mapping.value === true || mapping.value === 'true' || mapping.value === 'yes' || mapping.value === '1') {
            // Check if already checked to avoid errors
            const isChecked = await page.isChecked(mapping.selector);
            if (!isChecked) {
              await page.check(mapping.selector);
            }
          } else {
            const isChecked = await page.isChecked(mapping.selector);
            if (isChecked) {
              await page.uncheck(mapping.selector);
            }
          }
          break;

        case 'file':
          // mapping.value should be a local file path (already downloaded from S3)
          await page.setInputFiles(mapping.selector, String(mapping.value));
          break;

        default:
          logger.warn('Unknown field type', {
            selector: mapping.selector,
            type: mapping.fieldType,
          });
      }

      filled++;
      logger.debug('Field filled successfully', {
        selector: mapping.selector,
        type: mapping.fieldType,
      });
    } catch (error) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      failedFields.push({
        selector: mapping.selector,
        error: errorMessage,
      });
      logger.error('Failed to fill field', {
        selector: mapping.selector,
        error: errorMessage,
      });
    }
  }

  return { filled, failed, failedFields };
}

/**
 * Verify that form fields were filled correctly
 */
async function verifyFormFilled(
  page: Page,
  mappings: FieldMapping[]
): Promise<{
  allFilled: boolean;
  filledCount: number;
  totalCount: number;
  emptyFields: string[];
}> {
  let filledCount = 0;
  const emptyFields: string[] = [];

  for (const mapping of mappings) {
    try {
      // Skip file inputs (can't verify easily)
      if (mapping.fieldType === 'file') {
        filledCount++;
        continue;
      }

      // Check if field has a value
      const hasValue = await page.evaluate(`
        (function(selector) {
          const element = document.querySelector(selector);
          if (!element) return false;
          
          if (element.type === 'checkbox' || element.type === 'radio') {
            return element.checked;
          }
          
          return element.value && element.value.trim() !== '';
        })('${mapping.selector.replace(/'/g, "\\'")}')
      `);

      if (hasValue) {
        filledCount++;
      } else {
        emptyFields.push(mapping.selector);
      }
    } catch (error) {
      logger.warn('Failed to verify field', {
        selector: mapping.selector,
        error,
      });
      emptyFields.push(mapping.selector);
    }
  }

  return {
    allFilled: emptyFields.length === 0,
    filledCount,
    totalCount: mappings.length,
    emptyFields,
  };
}

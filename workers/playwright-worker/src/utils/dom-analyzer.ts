import { Page } from 'playwright';

import { logger } from '../logger';

/**
 * Represents a single form field extracted from the DOM
 */
export interface FormField {
  selector: string; // CSS selector to locate the field
  type:
    | 'text'
    | 'email'
    | 'tel'
    | 'number'
    | 'date'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'file'
    | 'textarea'
    | 'password'
    | 'url';
  label: string; // Associated label text
  name?: string; // name attribute
  id?: string; // id attribute
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  accept?: string; // For file inputs
  pattern?: string; // For validation
  minLength?: number;
  maxLength?: number;
  min?: number; // For number/date inputs
  max?: number; // For number/date inputs
  value?: string; // Current value
  checked?: boolean; // For checkbox/radio
  attributes: Record<string, string>; // All other attributes
}

/**
 * Represents the complete structure of a form
 */
export interface FormStructure {
  url: string;
  title: string; // Page title
  formSelector?: string; // Selector for the form element (if found)
  fields: FormField[];
  submitButton?: {
    selector: string;
    text: string;
  };
  fieldCount: number;
}

/**
 * DOM Analyzer Utility
 * Extracts form field information from a webpage
 */
export class DOMAnalyzer {
  /**
   * Analyze the current page for form fields
   */
  async analyzeForm(page: Page): Promise<FormStructure> {
    logger.info('Starting DOM analysis for form fields');

    try {
      const url = page.url();
      const title = await page.title();

      // Extract all form fields
      const fields = await this.extractFormFields(page);

      // Find submit button
      const submitButton = await this.findSubmitButton(page);

      // Find form element selector (if exists)
      const formSelector = await this.findFormSelector(page);

      logger.info('DOM analysis complete', {
        url,
        fieldCount: fields.length,
        hasSubmitButton: !!submitButton,
      });

      return {
        url,
        title,
        formSelector,
        fields,
        submitButton,
        fieldCount: fields.length,
      };
    } catch (error) {
      logger.error('DOM analysis failed', error);
      throw error;
    }
  }

  /**
   * Extract all form fields from the page
   */
  private async extractFormFields(page: Page): Promise<FormField[]> {
    // Execute script in browser context to extract field information
    const fields = await page.evaluate(() => {
      /* eslint-disable no-undef, @typescript-eslint/no-explicit-any */
      const extractedFields: any[] = [];

      // Helper function to get label for an input
       
      function getLabelForElement(element: any): string {
        // Try label[for="id"]
        if (element.id) {
          const label = document.querySelector(`label[for="${element.id}"]`);
          if (label?.textContent) {
            return label.textContent.trim();
          }
        }

        // Try parent label
        const parentLabel = element.closest('label');
        if (parentLabel?.textContent) {
          return parentLabel.textContent.trim();
        }

        // Try aria-label
        if (element.hasAttribute('aria-label')) {
          return element.getAttribute('aria-label') || '';
        }

        // Try aria-labelledby
        if (element.hasAttribute('aria-labelledby')) {
          const labelId = element.getAttribute('aria-labelledby');
          if (labelId) {
            const labelElement = document.getElementById(labelId);
            if (labelElement?.textContent) {
              return labelElement.textContent.trim();
            }
          }
        }

        // Try placeholder
        if (element.hasAttribute('placeholder')) {
          return element.getAttribute('placeholder') || '';
        }

        // Try previous sibling text
        let prev = element.previousElementSibling;
        if (prev && prev.textContent) {
          return prev.textContent.trim();
        }

        // Try name attribute as fallback
        if (element.hasAttribute('name')) {
          return element.getAttribute('name') || '';
        }

        return '';
      }

      // Helper to generate unique selector
       
      function getUniqueSelector(element: any): string {
        if (element.id) {
          return `#${element.id}`;
        }

        if (element.name) {
          const tagName = element.tagName.toLowerCase();
          return `${tagName}[name="${element.name}"]`;
        }

        // Generate path-based selector
        const path: string[] = [];
        let current: Element | null = element;

        while (current && current !== document.body) {
          let selector = current.tagName.toLowerCase();

          // Add class if available
          if (current.className && typeof current.className === 'string') {
            const classes = current.className.trim().split(/\s+/).filter(Boolean);
            if (classes.length > 0) {
              selector += '.' + classes.join('.');
            }
          }

          path.unshift(selector);
          current = current.parentElement;
        }

        return path.join(' > ');
      }

      // Helper to get all attributes
       
      function getAttributes(element: any): Record<string, string> {
        const attrs: Record<string, string> = {};
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          attrs[attr.name] = attr.value;
        }
        return attrs;
      }

      // Extract text inputs (including date/time types)
      const textInputs = document.querySelectorAll(
        'input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input[type="date"], input[type="datetime-local"], input[type="time"], input[type="week"], input[type="month"], input[type="url"], input[type="password"], input:not([type])'
      );
       
      textInputs.forEach((input: any) => {
        const element = input;
        const type = element.type || 'text';

        extractedFields.push({
          selector: getUniqueSelector(element),
          type: type as FormField['type'],
          label: getLabelForElement(element),
          name: element.name || undefined,
          id: element.id || undefined,
          placeholder: element.placeholder || undefined,
          required: element.required,
          pattern: element.pattern || undefined,
          minLength: element.minLength > 0 ? element.minLength : undefined,
          maxLength: element.maxLength > 0 ? element.maxLength : undefined,
          min: element.min || undefined,
          max: element.max || undefined,
          value: element.value || undefined,
          attributes: getAttributes(element),
        });
      });

      // Extract textareas
      const textareas = document.querySelectorAll('textarea');
       
      textareas.forEach((textarea: any) => {
        extractedFields.push({
          selector: getUniqueSelector(textarea),
          type: 'textarea',
          label: getLabelForElement(textarea),
          name: textarea.name || undefined,
          id: textarea.id || undefined,
          placeholder: textarea.placeholder || undefined,
          required: textarea.required,
          minLength: textarea.minLength > 0 ? textarea.minLength : undefined,
          maxLength: textarea.maxLength > 0 ? textarea.maxLength : undefined,
          value: textarea.value || undefined,
          attributes: getAttributes(textarea),
        });
      });

      // Extract select dropdowns
      const selects = document.querySelectorAll('select');
       
      selects.forEach((select: any) => {
         
        const options = Array.from(select.options).map((opt: any) => opt.text);

        extractedFields.push({
          selector: getUniqueSelector(select),
          type: 'select',
          label: getLabelForElement(select),
          name: select.name || undefined,
          id: select.id || undefined,
          required: select.required,
          options,
          value: select.value || undefined,
          attributes: getAttributes(select),
        });
      });

      // Extract checkboxes
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
       
      checkboxes.forEach((checkbox: any) => {
        const element = checkbox;

        extractedFields.push({
          selector: getUniqueSelector(element),
          type: 'checkbox',
          label: getLabelForElement(element),
          name: element.name || undefined,
          id: element.id || undefined,
          required: element.required,
          checked: element.checked,
          value: element.value || undefined,
          attributes: getAttributes(element),
        });
      });

      // Extract radio buttons
      const radios = document.querySelectorAll('input[type="radio"]');
       
      const radioGroups = new Map<string, any[]>();

      // Group radios by name
       
      radios.forEach((radio: any) => {
        const element = radio;
        const name = element.name || element.id || 'unnamed';

        if (!radioGroups.has(name)) {
          radioGroups.set(name, []);
        }
        radioGroups.get(name)?.push(element);
      });

      // Add one field per radio group
      radioGroups.forEach((group, name) => {
        const options = group.map((radio) => getLabelForElement(radio) || radio.value);
        const firstRadio = group[0];
        const checkedRadio = group.find((r) => r.checked);

        extractedFields.push({
          selector: `input[type="radio"][name="${name}"]`,
          type: 'radio',
          label: getLabelForElement(firstRadio) || name,
          name,
          required: firstRadio.required,
          options,
          checked: !!checkedRadio,
          value: checkedRadio?.value || undefined,
          attributes: getAttributes(firstRadio),
        });
      });

      // Extract file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
       
      fileInputs.forEach((input: any) => {
        const element = input;

        extractedFields.push({
          selector: getUniqueSelector(element),
          type: 'file',
          label: getLabelForElement(element),
          name: element.name || undefined,
          id: element.id || undefined,
          required: element.required,
          accept: element.accept || undefined,
          attributes: getAttributes(element),
        });
      });

      return extractedFields;
      /* eslint-enable no-undef */
    });

    return fields;
  }

  /**
   * Find the submit button
   */
  private async findSubmitButton(
    page: Page
  ): Promise<{ selector: string; text: string } | undefined> {
    const button = await page.evaluate(() => {
      /* eslint-disable no-undef */
      // Look for input[type="submit"]
      const submitInput = document.querySelector('input[type="submit"]');
      if (submitInput) {
         
        const value = (submitInput as any).value || 'Submit';
        return {
          selector: 'input[type="submit"]',
          text: value,
        };
      }

      // Look for button[type="submit"]
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        return {
          selector: 'button[type="submit"]',
          text: submitButton.textContent?.trim() || 'Submit',
        };
      }

      // Look for button without type (defaults to submit)
      const buttons = document.querySelectorAll('button');
       
      for (const button of Array.from(buttons) as any[]) {
        const text = button.textContent?.toLowerCase() || '';
        if (text.includes('submit') || text.includes('send') || text.includes('continue')) {
          return {
            selector: `button:has-text("${button.textContent?.trim()}")`,
            text: button.textContent?.trim() || '',
          };
        }
      }

      return undefined;
      /* eslint-enable no-undef */
    });

    return button || undefined;
  }

  /**
   * Find form element selector
   */
  private async findFormSelector(page: Page): Promise<string | undefined> {
    const formSelector = await page.evaluate(() => {
      /* eslint-disable no-undef */
      const forms = document.querySelectorAll('form');
      if (forms.length === 0) return undefined;

      const form = forms[0]; // Use first form
      if (form.id) return `#${form.id}`;
      if (form.className) {
        const classes = form.className.trim().split(/\s+/).filter(Boolean);
        if (classes.length > 0) {
          return `form.${classes.join('.')}`;
        }
      }

      return 'form';
      /* eslint-enable no-undef */
    });

    return formSelector || undefined;
  }
}

// Export singleton instance
export const domAnalyzer = new DOMAnalyzer();

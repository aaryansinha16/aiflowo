import { Injectable, Logger } from '@nestjs/common';

import { LLMService } from '../../agent';

/**
 * Form field from DOM analysis
 */
export interface FormField {
  selector: string;
  type: string;
  label: string;
  name?: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

/**
 * Field mapping result
 */
export interface FieldMapping {
  selector: string;
  value: any;
  confidence: number; // 0-1
  fieldType: string;
  source?: string; // Which user data field was used
}

/**
 * Field Mapper Service
 * Uses LLM to intelligently map user data to form fields
 */
@Injectable()
export class FieldMapperService {
  private readonly logger = new Logger(FieldMapperService.name);

  constructor(private readonly llmService: LLMService) {}

  /**
   * Map user data to form fields using AI
   */
  async mapUserDataToFields(
    formFields: FormField[],
    userData: Record<string, any>,
    files?: Record<string, string>
  ): Promise<FieldMapping[]> {
    this.logger.log('Mapping user data to form fields with AI', {
      fieldCount: formFields.length,
      userDataKeys: Object.keys(userData),
    });

    try {
      // Prepare the prompt for the LLM
      const prompt = this.buildMappingPrompt(formFields, userData, files);

      // Call LLM for intelligent mapping
      const completion = await this.llmService.complete(
        [
          {
            role: 'system',
            content: `You are a form field mapper expert. Your task is to intelligently map user data to form fields.
You must understand synonyms, handle format conversions, and match data semantically.
Return ONLY valid JSON array, no explanations.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        [], // No tools
        { temperature: 0.1 } // Low temperature for consistent mapping
      );

      const response = completion.choices[0]?.message?.content || '';

      // Parse the LLM response
      const mappings = this.parseLLMResponse(response);

      this.logger.log('Field mapping complete', {
        mappingsCount: mappings.length,
      });

      return mappings;
    } catch (error) {
      this.logger.error('Field mapping failed', error);

      // Fallback to simple name matching if LLM fails
      return this.fallbackMapping(formFields, userData, files);
    }
  }

  /**
   * Build the prompt for LLM
   */
  private buildMappingPrompt(
    formFields: FormField[],
    userData: Record<string, any>,
    files?: Record<string, string>
  ): string {
    // Format form fields for the prompt
    const fieldsDescription = formFields
      .map((field, index) => {
        let desc = `Field ${index + 1}:
  - Selector: "${field.selector}"
  - Type: ${field.type}
  - Label: "${field.label}"`;

        if (field.name) desc += `\n  - Name: "${field.name}"`;
        if (field.placeholder) desc += `\n  - Placeholder: "${field.placeholder}"`;
        if (field.required) desc += `\n  - Required: true`;
        if (field.options && field.options.length > 0) {
          desc += `\n  - Options: [${field.options.map((o) => `"${o}"`).join(', ')}]`;
        }

        return desc;
      })
      .join('\n\n');

    // Format user data for the prompt
    const userDataDescription = this.formatUserDataForPrompt(userData);

    // Format files for the prompt
    const filesDescription = files
      ? `\n\nAvailable Files:\n${Object.entries(files)
          .map(([key, path]) => `  - ${key}: ${path}`)
          .join('\n')}`
      : '';

    return `Given the following form fields and user data, create a JSON array of mappings.

FORM FIELDS:
${fieldsDescription}

USER DATA:
${userDataDescription}${filesDescription}

INSTRUCTIONS:
1. Match each form field to the most appropriate user data
2. Handle synonyms (e.g., "Full Name" matches "full_name" or "name")
3. Handle format conversions (e.g., "1995-08-15" to "15/08/1995" for date fields)
4. For select/radio fields, match the exact option text or closest match
5. For file fields, use the file paths from "Available Files" if the label matches
6. Set confidence 1.0 for exact matches, 0.8-0.9 for close matches, 0.5-0.7 for uncertain matches
7. Skip fields if no matching data (don't include them in output)

RETURN FORMAT (JSON array only, no other text):
[
  {
    "selector": "field_selector",
    "value": "mapped_value",
    "confidence": 0.95,
    "fieldType": "text",
    "source": "user_data_key"
  }
]

Generate the mappings now:`;
  }

  /**
   * Format user data for the prompt (flatten nested objects)
   */
  private formatUserDataForPrompt(userData: Record<string, any>, prefix = ''): string {
    const lines: string[] = [];

    for (const [key, value] of Object.entries(userData)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively handle nested objects
        lines.push(this.formatUserDataForPrompt(value, fullKey));
      } else if (Array.isArray(value)) {
        lines.push(`  - ${fullKey}: [${value.join(', ')}]`);
      } else if (value !== null && value !== undefined) {
        lines.push(`  - ${fullKey}: ${value}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Parse LLM response into field mappings
   */
  private parseLLMResponse(response: string): FieldMapping[] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
      }

      // Parse JSON
      const mappings = JSON.parse(jsonStr);

      // Validate structure
      if (!Array.isArray(mappings)) {
        throw new Error('Expected array of mappings');
      }

      // Validate each mapping
      return mappings.map((mapping: any) => ({
        selector: mapping.selector,
        value: mapping.value,
        confidence: mapping.confidence || 0.5,
        fieldType: mapping.fieldType || 'text',
        source: mapping.source,
      }));
    } catch (error) {
      this.logger.error('Failed to parse LLM response', { response, error });
      throw error;
    }
  }

  /**
   * Fallback mapping using simple name matching
   */
  private fallbackMapping(
    formFields: FormField[],
    userData: Record<string, any>,
    files?: Record<string, string>
  ): FieldMapping[] {
    this.logger.warn('Using fallback mapping (simple name matching)');

    const mappings: FieldMapping[] = [];

    // Flatten user data
    const flatUserData = this.flattenObject(userData);

    for (const field of formFields) {
      // Try to find matching user data
      const matchKey = this.findMatchingKey(
        field.name || field.label,
        Object.keys(flatUserData)
      );

      if (matchKey && flatUserData[matchKey] !== undefined) {
        mappings.push({
          selector: field.selector,
          value: flatUserData[matchKey],
          confidence: 0.7, // Lower confidence for fallback
          fieldType: field.type,
          source: matchKey,
        });
      }

      // Handle file fields
      if (field.type === 'file' && files) {
        const fileKey = this.findMatchingKey(field.label, Object.keys(files));
        if (fileKey) {
          mappings.push({
            selector: field.selector,
            value: files[fileKey],
            confidence: 0.8,
            fieldType: 'file',
            source: fileKey,
          });
        }
      }
    }

    return mappings;
  }

  /**
   * Flatten nested object
   */
  private flattenObject(
    obj: Record<string, any>,
    prefix = ''
  ): Record<string, any> {
    const flat: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flat, this.flattenObject(value, fullKey));
      } else {
        flat[fullKey] = value;
      }
    }

    return flat;
  }

  /**
   * Find matching key using simple string similarity
   */
  private findMatchingKey(target: string, candidates: string[]): string | null {
    const normalizedTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const candidate of candidates) {
      const normalizedCandidate = candidate
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      if (
        normalizedCandidate === normalizedTarget ||
        normalizedCandidate.includes(normalizedTarget) ||
        normalizedTarget.includes(normalizedCandidate)
      ) {
        return candidate;
      }
    }

    return null;
  }
}

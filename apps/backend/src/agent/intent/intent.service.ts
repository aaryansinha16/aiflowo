import { Injectable, Logger } from '@nestjs/common';

import { LLMService } from '../llm/llm.service';
import {
  CLASSIFY_INTENT_FUNCTION,
  createIntentClassifierMessages,
} from '../prompts/intent-classifier.prompt';
import {
  IntentClassification,
  IntentClassificationSchema,
  IntentType,
} from '../types/intent.types';

@Injectable()
export class IntentService {
  private readonly logger = new Logger(IntentService.name);

  constructor(private readonly llmService: LLMService) {}

  /**
   * Classify user intent from natural language message
   */
  async classifyIntent(userMessage: string): Promise<IntentClassification> {
    this.logger.log(`Classifying intent for message: "${userMessage}"`);

    try {
      // Create messages with current date context
      const messages = createIntentClassifierMessages(userMessage, new Date());

      // Call LLM with function calling
      const completion = await this.llmService.complete(
        messages,
        [CLASSIFY_INTENT_FUNCTION],
        {
          temperature: 0.1, // Low temperature for deterministic output
          maxTokens: 500,
        }
      );

      // Extract function call
      const functionCall = this.llmService.extractFunctionCall(completion);

      if (!functionCall) {
        this.logger.warn('No function call in LLM response, returning unknown intent');
        return {
          intent: IntentType.UNKNOWN,
          params: {},
          confidence: 0,
          missingFields: [],
        };
      }

      // Parse and validate function arguments
      const rawResult = this.llmService.parseFunctionArguments(functionCall);

      // Validate with Zod schema
      const result = IntentClassificationSchema.parse(rawResult);

      // Log token usage for monitoring
      const usage = this.llmService.getTokenUsage(completion);
      this.logger.log(
        `Intent classified as "${result.intent}" with confidence ${result.confidence || 'N/A'} ` +
          `(tokens: ${usage.totalTokens})`
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to classify intent: ${error.message}`, error.stack);
      
      // Return unknown intent on error rather than throwing
      return {
        intent: IntentType.UNKNOWN,
        params: {},
        confidence: 0,
        missingFields: [],
      };
    }
  }

  /**
   * Validate if all required parameters are present for an intent
   */
  validateIntentParams(intent: IntentType, params: Record<string, unknown>): {
    valid: boolean;
    missingFields: string[];
  } {
    const requiredFields: Record<IntentType, string[]> = {
      [IntentType.FLIGHT_SEARCH]: ['from', 'to', 'date'],
      [IntentType.BOOK_FLIGHT]: ['flightOptionId', 'passengers'],
      [IntentType.APPLY_JOB]: ['jobUrl'],
      [IntentType.FILL_FORM]: ['url'],
      [IntentType.POST_SOCIAL]: ['platform', 'caption'],
      [IntentType.BROWSER_ACTION]: ['url'],
      [IntentType.UNKNOWN]: [],
    };

    const required = requiredFields[intent] || [];
    const missingFields = required.filter(field => !params[field]);

    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Get a human-readable description of the intent
   */
  getIntentDescription(classification: IntentClassification): string {
    const { intent, params } = classification;

    switch (intent) {
      case IntentType.FLIGHT_SEARCH:
        return `Search flights from ${params.from || '?'} to ${params.to || '?'} on ${params.date || '?'}`;
      
      case IntentType.BOOK_FLIGHT:
        return `Book flight ${params.flightOptionId || '?'}`;
      
      case IntentType.APPLY_JOB:
        return `Apply to job: ${params.jobTitle || params.jobUrl || '?'}`;
      
      case IntentType.FILL_FORM:
        return `Fill form at ${params.url || '?'}`;
      
      case IntentType.POST_SOCIAL:
        return `Post on ${params.platform || '?'}: ${params.caption || '?'}`;
      
      case IntentType.BROWSER_ACTION:
        return `Browser action: ${params.description || params.url || '?'}`;
      
      case IntentType.UNKNOWN:
      default:
        return 'Unknown intent';
    }
  }
}

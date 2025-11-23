import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface LLMCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface LLMFunctionCall {
  name: string;
  arguments: string;
}

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private readonly client: OpenAI;
  private readonly defaultModel: string;
  private readonly defaultTimeout: number;
  private readonly maxRetries: number;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not configured');
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey,
      organization: this.config.get<string>('OPENAI_ORG_ID'),
    });

    this.defaultModel = this.config.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    this.defaultTimeout = parseInt(this.config.get<string>('LLM_TIMEOUT_MS') || '15000', 10);
    this.maxRetries = parseInt(this.config.get<string>('LLM_MAX_RETRIES') || '3', 10);

    this.logger.log(
      `LLM Service initialized with model: ${this.defaultModel}, timeout: ${this.defaultTimeout}ms`
    );
  }

  /**
   * Complete a chat conversation with function calling support
   */
  async complete(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    functions?: OpenAI.Chat.ChatCompletionCreateParams.Function[],
    options?: LLMCompletionOptions
  ): Promise<OpenAI.Chat.ChatCompletion> {
    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.1;
    const maxTokens = options?.maxTokens || 1000;

    this.logger.debug(
      `Calling LLM with model: ${model}, messages: ${messages.length}, functions: ${functions?.length || 0}`
    );

    try {
      const completion = await this.retryWithBackoff(async () => {
        return await this.client.chat.completions.create(
          {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            ...(functions && functions.length > 0
              ? {
                  functions,
                  function_call: 'auto',
                }
              : {}),
          },
          {
            timeout: options?.timeout || this.defaultTimeout,
          }
        );
      });

      this.logger.debug(
        `LLM response received: ${completion.choices[0]?.message?.content || 'function call'}`
      );

      return completion;
    } catch (error) {
      this.logger.error(`LLM completion failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Extract function call from completion
   */
  extractFunctionCall(completion: OpenAI.Chat.ChatCompletion): LLMFunctionCall | null {
    const message = completion.choices[0]?.message;
    
    if (!message?.function_call) {
      return null;
    }

    return {
      name: message.function_call.name,
      arguments: message.function_call.arguments,
    };
  }

  /**
   * Parse function call arguments as JSON
   */
  parseFunctionArguments<T = Record<string, unknown>>(functionCall: LLMFunctionCall): T {
    try {
      return JSON.parse(functionCall.arguments) as T;
    } catch (error) {
      this.logger.error(`Failed to parse function arguments: ${error.message}`);
      throw new Error('Invalid function call arguments: not valid JSON');
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retryCount >= this.maxRetries) {
        throw error;
      }

      // Check if error is retryable
      const isRetryable = this.isRetryableError(error);
      
      if (!isRetryable) {
        throw error;
      }

      const delayMs = Math.min(1000 * Math.pow(2, retryCount), 10000);
      this.logger.warn(
        `LLM call failed (attempt ${retryCount + 1}/${this.maxRetries}), retrying in ${delayMs}ms...`
      );

      await this.delay(delayMs);
      return this.retryWithBackoff(fn, retryCount + 1);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof OpenAI.APIError) {
      // Retry on rate limits, timeouts, and server errors
      return (
        error.status === 429 || // Rate limit
        error.status === 408 || // Timeout
        error.status === 503 || // Service unavailable
        error.status === 500    // Internal server error
      );
    }
    return false;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current token usage (for monitoring)
   */
  getTokenUsage(completion: OpenAI.Chat.ChatCompletion): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    return {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
    };
  }
}

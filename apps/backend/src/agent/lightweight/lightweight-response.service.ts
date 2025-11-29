/**
 * Lightweight Response Service
 * Handles conversational intents without full task execution
 */

import { Injectable, Logger } from '@nestjs/common';

import { ChatContext } from '../../modules/tasks/types/chat.types';
import { LLMService } from '../llm/llm.service';
import { IntentClassification, IntentType } from '../types/intent.types';

export interface LightweightResponse {
  message: string;
  intent: IntentType;
  isLightweight: true;
}

@Injectable()
export class LightweightResponseService {
  private readonly logger = new Logger(LightweightResponseService.name);

  constructor(private readonly llmService: LLMService) {}

  /**
   * Generate a quick response for conversational intents
   */
  async generateResponse(
    userMessage: string,
    classification: IntentClassification,
    context?: ChatContext
  ): Promise<LightweightResponse> {
    this.logger.log(`Generating lightweight response for intent: ${classification.intent}`);

    const systemPrompt = this.buildSystemPrompt(classification.intent, context);
    
    try {
      const completion = await this.llmService.complete(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        undefined,
        {
          temperature: 0.7,
          maxTokens: 500,
        }
      );

      const message = completion.choices[0]?.message?.content || this.getFallbackResponse(classification.intent);

      this.logger.log(`Lightweight response generated for ${classification.intent}`);

      return {
        message: message.trim(),
        intent: classification.intent,
        isLightweight: true,
      };
    } catch (error) {
      this.logger.error(`Failed to generate lightweight response: ${error.message}`);
      return {
        message: this.getFallbackResponse(classification.intent),
        intent: classification.intent,
        isLightweight: true,
      };
    }
  }

  /**
   * Build system prompt based on intent type
   */
  private buildSystemPrompt(intent: IntentType, context?: ChatContext): string {
    const basePrompt = `You are a helpful AI assistant called AIFlowo. You help users with various tasks like flight booking, job applications, form filling, and more.

Be friendly, concise, and helpful. Keep responses brief (2-3 sentences max for simple queries).`;

    const contextSection = context?.previousTasks?.length
      ? `\n\nPrevious conversation context:
${context.previousTasks
  .slice(-5) // Last 5 tasks for context
  .map((t) => `- User asked: "${t.intent}" (${t.status})`)
  .join('\n')}`
      : '';

    switch (intent) {
      case IntentType.GREETING:
        return `${basePrompt}${contextSection}

The user is greeting you. Respond warmly and ask how you can help them today. You can mention some things you can help with:
- Search and book flights
- Apply to jobs
- Fill forms automatically
- Post on social media
- And more!`;

      case IntentType.HELP:
        return `${basePrompt}${contextSection}

The user needs help. Explain what you can do:
1. **Flight Search & Booking**: "Find flights from Mumbai to Delhi on Dec 5"
2. **Job Applications**: "Apply to this job at [URL]"
3. **Form Filling**: "Fill this form at [URL]"
4. **Social Media**: "Post this on Instagram"
5. **Calculations**: "Calculate 25 * 4"
6. **Weather**: "What's the weather in London?"

Be helpful and give examples of how to use each feature.`;

      case IntentType.CLARIFICATION:
        return `${basePrompt}${contextSection}

The user is asking for clarification. Based on the conversation context (if any), try to understand what they're confused about and provide a clear explanation. If you don't have enough context, ask them to be more specific.`;

      case IntentType.GENERAL_QUESTION:
        return `${basePrompt}${contextSection}

The user is asking a general question. Answer it concisely and helpfully. If the question relates to something you can help them do (like book a flight), mention that you can help execute that task.`;

      default:
        return basePrompt + contextSection;
    }
  }

  /**
   * Get fallback response when LLM fails
   */
  private getFallbackResponse(intent: IntentType): string {
    switch (intent) {
      case IntentType.GREETING:
        return "Hello! 👋 I'm AIFlowo, your AI assistant. I can help you search flights, apply to jobs, fill forms, and more. How can I assist you today?";

      case IntentType.HELP:
        return `Here's what I can help you with:

✈️ **Flights**: "Find flights from Mumbai to Delhi on Dec 5"
💼 **Jobs**: "Apply to this job at [URL]"
📝 **Forms**: "Fill this form at [URL]"
📱 **Social**: "Post this on Instagram"
🔢 **Math**: "Calculate 25 * 4"
🌤️ **Weather**: "What's the weather in London?"

Just tell me what you need!`;

      case IntentType.CLARIFICATION:
        return "I'm not sure what you're asking about. Could you please provide more details or rephrase your question?";

      case IntentType.GENERAL_QUESTION:
        return "That's an interesting question! Could you provide a bit more context so I can give you a better answer?";

      default:
        return "I'm here to help! Try asking me to search for flights, apply to jobs, fill forms, or any other task.";
    }
  }
}

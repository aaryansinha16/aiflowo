import { Test, TestingModule } from '@nestjs/testing';
import OpenAI from 'openai';

import { LLMService } from '../llm/llm.service';
import { IntentType } from '../types/intent.types';

import { IntentService } from './intent.service';

describe('IntentService', () => {
  let service: IntentService;

  const mockLLMService = {
    complete: jest.fn(),
    extractFunctionCall: jest.fn(),
    parseFunctionArguments: jest.fn(),
    getTokenUsage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntentService,
        {
          provide: LLMService,
          useValue: mockLLMService,
        },
      ],
    }).compile();

    service = module.get<IntentService>(IntentService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('classifyIntent', () => {
    const mockCompletion: OpenAI.Chat.ChatCompletion = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: 1234567890,
      model: 'gpt-4o-mini',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: null,
            refusal: null,
            function_call: {
              name: 'classify_intent',
              arguments: '{}',
            },
          },
          finish_reason: 'function_call',
          logprobs: null,
        },
      ],
      usage: {
        prompt_tokens: 200,
        completion_tokens: 50,
        total_tokens: 250,
        prompt_tokens_details: { cached_tokens: 0 },
        completion_tokens_details: { reasoning_tokens: 0 },
      },
    };

    it('should classify flight search intent', async () => {
      const flightSearchResult = {
        intent: IntentType.FLIGHT_SEARCH,
        params: {
          from: 'BOM',
          to: 'DEL',
          date: '2025-11-24',
          passengers: 2,
          class: 'economy',
        },
        confidence: 0.95,
      };

      mockLLMService.complete.mockResolvedValue(mockCompletion);
      mockLLMService.extractFunctionCall.mockReturnValue({
        name: 'classify_intent',
        arguments: JSON.stringify(flightSearchResult),
      });
      mockLLMService.parseFunctionArguments.mockReturnValue(flightSearchResult);
      mockLLMService.getTokenUsage.mockReturnValue({
        promptTokens: 200,
        completionTokens: 50,
        totalTokens: 250,
      });

      const result = await service.classifyIntent(
        'Find flights from Mumbai to Delhi tomorrow for 2 passengers'
      );

      expect(result).toEqual(flightSearchResult);
      expect(mockLLMService.complete).toHaveBeenCalled();
    });

    it('should classify job application intent', async () => {
      const jobApplicationResult = {
        intent: IntentType.APPLY_JOB,
        params: {
          jobTitle: 'Software Engineer',
          company: 'Google',
        },
        confidence: 0.9,
        missingFields: ['jobUrl', 'resumeId'],
      };

      mockLLMService.complete.mockResolvedValue(mockCompletion);
      mockLLMService.extractFunctionCall.mockReturnValue({
        name: 'classify_intent',
        arguments: JSON.stringify(jobApplicationResult),
      });
      mockLLMService.parseFunctionArguments.mockReturnValue(jobApplicationResult);
      mockLLMService.getTokenUsage.mockReturnValue({
        promptTokens: 200,
        completionTokens: 50,
        totalTokens: 250,
      });

      const result = await service.classifyIntent('Apply to Software Engineer at Google');

      expect(result.intent).toBe(IntentType.APPLY_JOB);
      expect(result.params.company).toBe('Google');
    });

    it('should classify form filling intent', async () => {
      const formFillingResult = {
        intent: IntentType.FILL_FORM,
        params: {
          url: 'https://example.com/form',
        },
        confidence: 0.88,
      };

      mockLLMService.complete.mockResolvedValue(mockCompletion);
      mockLLMService.extractFunctionCall.mockReturnValue({
        name: 'classify_intent',
        arguments: JSON.stringify(formFillingResult),
      });
      mockLLMService.parseFunctionArguments.mockReturnValue(formFillingResult);
      mockLLMService.getTokenUsage.mockReturnValue({
        promptTokens: 200,
        completionTokens: 50,
        totalTokens: 250,
      });

      const result = await service.classifyIntent('Fill out the form at example.com/form');

      expect(result.intent).toBe(IntentType.FILL_FORM);
      expect(result.params.url).toBe('https://example.com/form');
    });

    it('should classify social media post intent', async () => {
      const socialPostResult = {
        intent: IntentType.POST_SOCIAL,
        params: {
          platform: 'instagram',
          caption: 'Beautiful sunset!',
        },
        confidence: 0.92,
      };

      mockLLMService.complete.mockResolvedValue(mockCompletion);
      mockLLMService.extractFunctionCall.mockReturnValue({
        name: 'classify_intent',
        arguments: JSON.stringify(socialPostResult),
      });
      mockLLMService.parseFunctionArguments.mockReturnValue(socialPostResult);
      mockLLMService.getTokenUsage.mockReturnValue({
        promptTokens: 200,
        completionTokens: 50,
        totalTokens: 250,
      });

      const result = await service.classifyIntent('Post on Instagram: Beautiful sunset!');

      expect(result.intent).toBe(IntentType.POST_SOCIAL);
      expect(result.params.platform).toBe('instagram');
    });

    it('should classify browser action intent', async () => {
      const browserActionResult = {
        intent: IntentType.BROWSER_ACTION,
        params: {
          url: 'amazon.com',
          description: 'search for iPhone',
        },
        confidence: 0.85,
      };

      mockLLMService.complete.mockResolvedValue(mockCompletion);
      mockLLMService.extractFunctionCall.mockReturnValue({
        name: 'classify_intent',
        arguments: JSON.stringify(browserActionResult),
      });
      mockLLMService.parseFunctionArguments.mockReturnValue(browserActionResult);
      mockLLMService.getTokenUsage.mockReturnValue({
        promptTokens: 200,
        completionTokens: 50,
        totalTokens: 250,
      });

      const result = await service.classifyIntent('Go to amazon.com and search for iPhone');

      expect(result.intent).toBe(IntentType.BROWSER_ACTION);
    });

    it('should return unknown intent when no function call', async () => {
      mockLLMService.complete.mockResolvedValue(mockCompletion);
      mockLLMService.extractFunctionCall.mockReturnValue(null);
      mockLLMService.getTokenUsage.mockReturnValue({
        promptTokens: 200,
        completionTokens: 50,
        totalTokens: 250,
      });

      const result = await service.classifyIntent('Something unclear');

      expect(result.intent).toBe(IntentType.UNKNOWN);
      expect(result.confidence).toBe(0);
    });

    it('should handle LLM errors gracefully', async () => {
      mockLLMService.complete.mockRejectedValue(new Error('API error'));

      const result = await service.classifyIntent('Test message');

      expect(result.intent).toBe(IntentType.UNKNOWN);
      expect(result.confidence).toBe(0);
      expect(result.params).toEqual({});
    });

    it('should handle invalid JSON from LLM', async () => {
      mockLLMService.complete.mockResolvedValue(mockCompletion);
      mockLLMService.extractFunctionCall.mockReturnValue({
        name: 'classify_intent',
        arguments: 'invalid json',
      });
      mockLLMService.parseFunctionArguments.mockImplementation(() => {
        throw new Error('Invalid JSON');
      });

      const result = await service.classifyIntent('Test message');

      expect(result.intent).toBe(IntentType.UNKNOWN);
      expect(result.confidence).toBe(0);
    });

    it('should include current date in prompt', async () => {
      const flightResult = {
        intent: IntentType.FLIGHT_SEARCH,
        params: {
          from: 'BOM',
          to: 'DEL',
          date: '2025-11-24',
        },
        confidence: 0.95,
      };

      mockLLMService.complete.mockResolvedValue(mockCompletion);
      mockLLMService.extractFunctionCall.mockReturnValue({
        name: 'classify_intent',
        arguments: JSON.stringify(flightResult),
      });
      mockLLMService.parseFunctionArguments.mockReturnValue(flightResult);
      mockLLMService.getTokenUsage.mockReturnValue({
        promptTokens: 200,
        completionTokens: 50,
        totalTokens: 250,
      });

      await service.classifyIntent('Find flights tomorrow');

      const callArgs = mockLLMService.complete.mock.calls[0];
      const messages = callArgs[0];
      
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('Today\'s date is:');
    });
  });

  describe('validateIntentParams', () => {
    it('should validate flight search params', () => {
      const result = service.validateIntentParams(IntentType.FLIGHT_SEARCH, {
        from: 'BOM',
        to: 'DEL',
        date: '2025-11-24',
      });

      expect(result.valid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it('should detect missing required fields for flight search', () => {
      const result = service.validateIntentParams(IntentType.FLIGHT_SEARCH, {
        from: 'BOM',
      });

      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('to');
      expect(result.missingFields).toContain('date');
    });

    it('should validate job application params', () => {
      const result = service.validateIntentParams(IntentType.APPLY_JOB, {
        jobUrl: 'https://example.com/job',
      });

      expect(result.valid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it('should validate form filling params', () => {
      const result = service.validateIntentParams(IntentType.FILL_FORM, {
        url: 'https://example.com/form',
      });

      expect(result.valid).toBe(true);
    });

    it('should validate social media post params', () => {
      const result = service.validateIntentParams(IntentType.POST_SOCIAL, {
        platform: 'instagram',
        caption: 'Test post',
      });

      expect(result.valid).toBe(true);
    });

    it('should return valid for unknown intent', () => {
      const result = service.validateIntentParams(IntentType.UNKNOWN, {});

      expect(result.valid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });
  });

  describe('getIntentDescription', () => {
    it('should generate description for flight search', () => {
      const description = service.getIntentDescription({
        intent: IntentType.FLIGHT_SEARCH,
        params: { from: 'BOM', to: 'DEL', date: '2025-11-24' },
      });

      expect(description).toBe('Search flights from BOM to DEL on 2025-11-24');
    });

    it('should generate description for job application', () => {
      const description = service.getIntentDescription({
        intent: IntentType.APPLY_JOB,
        params: { jobTitle: 'Software Engineer', company: 'Google' },
      });

      expect(description).toContain('Apply to job');
      expect(description).toContain('Software Engineer');
    });

    it('should generate description for form filling', () => {
      const description = service.getIntentDescription({
        intent: IntentType.FILL_FORM,
        params: { url: 'https://example.com/form' },
      });

      expect(description).toContain('Fill form at');
    });

    it('should generate description for social media post', () => {
      const description = service.getIntentDescription({
        intent: IntentType.POST_SOCIAL,
        params: { platform: 'instagram', caption: 'Test' },
      });

      expect(description).toContain('Post on instagram');
    });

    it('should generate description for browser action', () => {
      const description = service.getIntentDescription({
        intent: IntentType.BROWSER_ACTION,
        params: { url: 'amazon.com', description: 'search' },
      });

      expect(description).toContain('Browser action');
    });

    it('should handle unknown intent', () => {
      const description = service.getIntentDescription({
        intent: IntentType.UNKNOWN,
        params: {},
      });

      expect(description).toBe('Unknown intent');
    });

    it('should handle missing parameters gracefully', () => {
      const description = service.getIntentDescription({
        intent: IntentType.FLIGHT_SEARCH,
        params: {},
      });

      expect(description).toContain('?');
    });
  });
});

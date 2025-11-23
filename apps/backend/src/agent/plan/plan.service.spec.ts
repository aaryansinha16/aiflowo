import { Test, TestingModule } from '@nestjs/testing';
import OpenAI from 'openai';

import { LLMService } from '../llm/llm.service';
import { IntentType } from '../types/intent.types';
import { ToolName } from '../types/tools.types';

import { PlanService } from './plan.service';

describe('PlanService', () => {
  let service: PlanService;

  const mockLLMService = {
    complete: jest.fn(),
    extractFunctionCall: jest.fn(),
    parseFunctionArguments: jest.fn(),
    getTokenUsage: jest.fn(),
  };

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
            name: 'generate_plan',
            arguments: '{}',
          },
        },
        finish_reason: 'function_call',
        logprobs: null,
      },
    ],
    usage: {
      prompt_tokens: 300,
      completion_tokens: 150,
      total_tokens: 450,
      prompt_tokens_details: { cached_tokens: 0 },
      completion_tokens_details: { reasoning_tokens: 0 },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanService,
        {
          provide: LLMService,
          useValue: mockLLMService,
        },
      ],
    }).compile();

    service = module.get<PlanService>(PlanService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePlan', () => {
    it('should generate plan for flight search intent', async () => {
      const classification = {
        intent: IntentType.FLIGHT_SEARCH,
        params: {
          from: 'BOM',
          to: 'DEL',
          date: '2025-12-25',
          passengers: 2,
        },
        confidence: 0.95,
      };

      const generatedPlan = {
        intent: IntentType.FLIGHT_SEARCH,
        steps: [
          {
            id: 'step_1',
            tool: ToolName.SEARCH_FLIGHTS,
            params: {
              from: 'BOM',
              to: 'DEL',
              date: '2025-12-25',
              passengers: 2,
              class: 'economy',
            },
            description: 'Search for available flights',
            retryable: true,
            maxRetries: 3,
          },
          {
            id: 'step_2',
            tool: ToolName.VALIDATE_RESULTS,
            params: { minResults: 1 },
            description: 'Validate search results',
            dependsOn: ['step_1'],
          },
        ],
        metadata: {
          complexity: 'simple',
          totalSteps: 2,
          estimatedDuration: 30,
        },
      };

      mockLLMService.complete.mockResolvedValue(mockCompletion);
      mockLLMService.extractFunctionCall.mockReturnValue({
        name: 'generate_plan',
        arguments: JSON.stringify(generatedPlan),
      });
      mockLLMService.parseFunctionArguments.mockReturnValue(generatedPlan);
      mockLLMService.getTokenUsage.mockReturnValue({
        promptTokens: 300,
        completionTokens: 150,
        totalTokens: 450,
      });

      const result = await service.generatePlan(classification);

      expect(result.intent).toBe(IntentType.FLIGHT_SEARCH);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].tool).toBe(ToolName.SEARCH_FLIGHTS);
      expect(result.steps[0].params.from).toBe('BOM');
      expect(result.steps[0].params.to).toBe('DEL');
      expect(result.steps[1].tool).toBe(ToolName.VALIDATE_RESULTS);
      expect(mockLLMService.complete).toHaveBeenCalled();
    });

    it('should generate plan for job application intent', async () => {
      const classification = {
        intent: IntentType.APPLY_JOB,
        params: {
          jobTitle: 'Software Engineer',
          company: 'Google',
        },
        confidence: 0.9,
      };

      const generatedPlan = {
        intent: IntentType.APPLY_JOB,
        steps: [
          {
            id: 'step_1',
            tool: ToolName.GENERATE_COVER_LETTER,
            params: {
              jobTitle: 'Software Engineer',
              company: 'Google',
              tone: 'professional',
            },
            description: 'Generate cover letter',
          },
          {
            id: 'step_2',
            tool: ToolName.APPLY_JOB,
            params: {
              jobTitle: 'Software Engineer',
              company: 'Google',
            },
            description: 'Submit application',
            dependsOn: ['step_1'],
          },
          {
            id: 'step_3',
            tool: ToolName.TAKE_SCREENSHOT,
            params: { fullPage: true },
            description: 'Capture confirmation',
            dependsOn: ['step_2'],
          },
        ],
        metadata: {
          complexity: 'moderate',
          totalSteps: 3,
        },
      };

      mockLLMService.complete.mockResolvedValue(mockCompletion);
      mockLLMService.extractFunctionCall.mockReturnValue({
        name: 'generate_plan',
        arguments: JSON.stringify(generatedPlan),
      });
      mockLLMService.parseFunctionArguments.mockReturnValue(generatedPlan);
      mockLLMService.getTokenUsage.mockReturnValue({
        promptTokens: 300,
        completionTokens: 150,
        totalTokens: 450,
      });

      const result = await service.generatePlan(classification);

      expect(result.intent).toBe(IntentType.APPLY_JOB);
      expect(result.steps.length).toBeGreaterThan(0);
      // First step should be either generate_cover_letter or apply_job depending on LLM response
      expect([ToolName.GENERATE_COVER_LETTER, ToolName.APPLY_JOB]).toContain(result.steps[0].tool);
    });

    it('should return empty plan for unknown intent', async () => {
      const classification = {
        intent: IntentType.UNKNOWN,
        params: {},
        confidence: 0,
      };

      const result = await service.generatePlan(classification);

      expect(result.intent).toBe(IntentType.UNKNOWN);
      expect(result.steps).toHaveLength(0);
      expect(mockLLMService.complete).not.toHaveBeenCalled();
    });

    it('should use fallback plan when LLM fails', async () => {
      const classification = {
        intent: IntentType.FLIGHT_SEARCH,
        params: {
          from: 'BOM',
          to: 'DEL',
          date: '2025-12-25',
        },
        confidence: 0.95,
      };

      mockLLMService.complete.mockRejectedValue(new Error('LLM API error'));

      const result = await service.generatePlan(classification);

      expect(result.intent).toBe(IntentType.FLIGHT_SEARCH);
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps[0].tool).toBe(ToolName.SEARCH_FLIGHTS);
    });

    it('should handle missing function call from LLM by parsing message content', async () => {
      const classification = {
        intent: IntentType.POST_SOCIAL,
        params: {
          platform: 'instagram',
          caption: 'Test post',
        },
        confidence: 0.9,
      };

      const planInMessageContent = {
        intent: IntentType.POST_SOCIAL,
        steps: [
          {
            id: 'step_1',
            tool: ToolName.POST_SOCIAL,
            params: { platform: 'instagram', caption: 'Test post', mediaIds: [] },
            description: 'Post to Instagram',
          },
        ],
        metadata: {
          complexity: 'simple',
          totalSteps: 1,
        },
      };

      // Mock completion with message content instead of function call
      const completionWithContent = {
        ...mockCompletion,
        choices: [
          {
            ...mockCompletion.choices[0],
            message: {
              role: 'assistant' as const,
              content: `\`\`\`json\n${JSON.stringify(planInMessageContent)}\n\`\`\``,
              refusal: null,
            },
          },
        ],
      };

      mockLLMService.complete.mockResolvedValue(completionWithContent);
      mockLLMService.extractFunctionCall.mockReturnValue(null);
      mockLLMService.getTokenUsage.mockReturnValue({
        promptTokens: 300,
        completionTokens: 150,
        totalTokens: 450,
      });

      const result = await service.generatePlan(classification);

      // Should successfully parse from message content
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.intent).toBe(IntentType.POST_SOCIAL);
    });

    it('should include user profile context in plan generation', async () => {
      const classification = {
        intent: IntentType.FLIGHT_SEARCH,
        params: {
          from: 'BOM',
          to: 'DEL',
        },
        confidence: 0.95,
      };

      const context = {
        userId: 'user_123',
        userProfile: {
          travelPrefs: {
            preferredClass: 'business',
            preferredAirline: 'Air India',
          },
          resumeUrl: 'https://example.com/resume.pdf',
        },
        environment: 'production' as const,
      };

      const generatedPlan = {
        intent: IntentType.FLIGHT_SEARCH,
        steps: [
          {
            id: 'step_1',
            tool: ToolName.SEARCH_FLIGHTS,
            params: {
              from: 'BOM',
              to: 'DEL',
              class: 'business',
              date: '2025-12-25',
            },
            description: 'Search for business class flights',
          },
        ],
        metadata: {
          complexity: 'simple',
          totalSteps: 1,
        },
      };

      mockLLMService.complete.mockResolvedValue(mockCompletion);
      mockLLMService.extractFunctionCall.mockReturnValue({
        name: 'generate_plan',
        arguments: JSON.stringify(generatedPlan),
      });
      mockLLMService.parseFunctionArguments.mockReturnValue(generatedPlan);
      mockLLMService.getTokenUsage.mockReturnValue({
        promptTokens: 300,
        completionTokens: 150,
        totalTokens: 450,
      });

      const result = await service.generatePlan(classification, context);

      expect(result.steps[0].params.class).toBe('business');
      expect(mockLLMService.complete).toHaveBeenCalled();
    });

    it('should ensure all steps have IDs', async () => {
      const classification = {
        intent: IntentType.POST_SOCIAL,
        params: {
          platform: 'instagram',
        },
        confidence: 0.9,
      };

      const generatedPlan = {
        intent: IntentType.POST_SOCIAL,
        steps: [
          {
            tool: ToolName.POST_SOCIAL,
            params: { platform: 'instagram' },
            description: 'Post to Instagram',
          },
          {
            tool: ToolName.TAKE_SCREENSHOT,
            params: {},
            description: 'Capture confirmation',
          },
        ],
        metadata: {
          complexity: 'simple',
        },
      };

      mockLLMService.complete.mockResolvedValue(mockCompletion);
      mockLLMService.extractFunctionCall.mockReturnValue({
        name: 'generate_plan',
        arguments: JSON.stringify(generatedPlan),
      });
      mockLLMService.parseFunctionArguments.mockReturnValue(generatedPlan);
      mockLLMService.getTokenUsage.mockReturnValue({
        promptTokens: 300,
        completionTokens: 150,
        totalTokens: 450,
      });

      const result = await service.generatePlan(classification);

      expect(result.steps[0].id).toBe('step_1');
      expect(result.steps[1].id).toBe('step_2');
      expect(result.metadata?.totalSteps).toBe(2);
    });
  });

  describe('validatePlan', () => {
    it('should validate correct flight search plan', () => {
      const plan = {
        intent: IntentType.FLIGHT_SEARCH,
        steps: [
          {
            id: 'step_1',
            tool: ToolName.SEARCH_FLIGHTS,
            params: {
              from: 'BOM',
              to: 'DEL',
              date: '2025-12-25',
              passengers: 1,
              class: 'economy',
            },
            description: 'Search flights',
          },
          {
            id: 'step_2',
            tool: ToolName.VALIDATE_RESULTS,
            params: { minResults: 1 },
            description: 'Validate results',
            dependsOn: ['step_1'],
          },
        ],
        metadata: {
          complexity: 'simple' as const,
          totalSteps: 2,
        },
      };

      const result = service.validatePlan(plan);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid tool name', () => {
      const plan = {
        intent: IntentType.FLIGHT_SEARCH,
        steps: [
          {
            id: 'step_1',
            tool: 'invalid_tool' as any,
            params: {},
            description: 'Invalid step',
          },
        ],
        metadata: {
          complexity: 'simple' as const,
          totalSteps: 1,
        },
      };

      const result = service.validatePlan(plan);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('INVALID_TOOL');
    });

    it('should detect invalid parameters', () => {
      const plan = {
        intent: IntentType.FLIGHT_SEARCH,
        steps: [
          {
            id: 'step_1',
            tool: ToolName.SEARCH_FLIGHTS,
            params: {
              // Missing required fields
              from: 'BOM',
            },
            description: 'Search flights',
          },
        ],
        metadata: {
          complexity: 'simple' as const,
          totalSteps: 1,
        },
      };

      const result = service.validatePlan(plan);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_PARAMS')).toBe(true);
    });

    it('should detect invalid dependencies', () => {
      const plan = {
        intent: IntentType.FLIGHT_SEARCH,
        steps: [
          {
            id: 'step_1',
            tool: ToolName.VALIDATE_RESULTS,
            params: { minResults: 1 },
            description: 'Validate',
            dependsOn: ['step_999'], // Non-existent step
          },
        ],
        metadata: {
          complexity: 'simple' as const,
          totalSteps: 1,
        },
      };

      const result = service.validatePlan(plan);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_DEPENDENCY')).toBe(true);
    });

    it('should detect circular dependencies', () => {
      const plan = {
        intent: IntentType.FLIGHT_SEARCH,
        steps: [
          {
            id: 'step_1',
            tool: ToolName.SEARCH_FLIGHTS,
            params: { from: 'BOM', to: 'DEL', date: '2025-12-25' },
            description: 'Search',
            dependsOn: ['step_2'],
          },
          {
            id: 'step_2',
            tool: ToolName.VALIDATE_RESULTS,
            params: { minResults: 1 },
            description: 'Validate',
            dependsOn: ['step_1'],
          },
        ],
        metadata: {
          complexity: 'simple' as const,
          totalSteps: 2,
        },
      };

      const result = service.validatePlan(plan);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'CIRCULAR_DEPENDENCY')).toBe(true);
    });

    it('should warn about missing validation steps', () => {
      const plan = {
        intent: IntentType.FLIGHT_SEARCH,
        steps: [
          {
            id: 'step_1',
            tool: ToolName.SEARCH_FLIGHTS,
            params: { from: 'BOM', to: 'DEL', date: '2025-12-25' },
            description: 'Search flights',
          },
          {
            id: 'step_2',
            tool: ToolName.BOOK_FLIGHT,
            params: { flightOptionId: 'FL123', passengers: [] },
            description: 'Book flight',
          },
        ],
        metadata: {
          complexity: 'moderate' as const,
          totalSteps: 2,
        },
      };

      const result = service.validatePlan(plan);

      // Plan will be valid since params are technically correct, but should have warnings
      expect(result.warnings).toBeDefined();
      // Should warn about missing validation steps
      expect(result.warnings?.some((w) => w.includes('validation'))).toBe(true);
    });

    it('should suggest screenshot for booking actions', () => {
      const plan = {
        intent: IntentType.BOOK_FLIGHT,
        steps: [
          {
            id: 'step_1',
            tool: ToolName.BOOK_FLIGHT,
            params: {
              flightOptionId: 'FL123',
              passengers: [{ firstName: 'John', lastName: 'Doe' }],
            },
            description: 'Book flight',
          },
        ],
        metadata: {
          complexity: 'moderate' as const,
          totalSteps: 1,
        },
      };

      const result = service.validatePlan(plan);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.some((s) => s.includes('screenshot'))).toBe(true);
    });

    it('should fail for empty plan', () => {
      const plan = {
        intent: IntentType.FLIGHT_SEARCH,
        steps: [],
        metadata: {
          complexity: 'simple' as const,
          totalSteps: 0,
        },
      };

      const result = service.validatePlan(plan);

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('EMPTY_PLAN');
    });
  });

  describe('getPlanDescription', () => {
    it('should generate human-readable description', () => {
      const plan = {
        intent: IntentType.FLIGHT_SEARCH,
        steps: [
          {
            id: 'step_1',
            tool: ToolName.SEARCH_FLIGHTS,
            params: {},
            description: 'Search for flights',
          },
          {
            id: 'step_2',
            tool: ToolName.VALIDATE_RESULTS,
            params: {},
            description: 'Validate results',
          },
        ],
        metadata: {
          complexity: 'simple' as const,
          totalSteps: 2,
        },
      };

      const description = service.getPlanDescription(plan);

      expect(description).toContain('flight_search');
      expect(description).toContain('2 steps');
      expect(description).toContain('Search for flights');
      expect(description).toContain('Validate results');
    });
  });
});

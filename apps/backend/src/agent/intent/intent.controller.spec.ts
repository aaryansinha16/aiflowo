import { Test, TestingModule } from '@nestjs/testing';

import { IntentType } from '../types/intent.types';

import { ClassifyIntentDto } from './dto/classify-intent.dto';
import { IntentController } from './intent.controller';
import { IntentService } from './intent.service';

describe('IntentController', () => {
  let controller: IntentController;
  let service: IntentService;

  const mockIntentService = {
    classifyIntent: jest.fn(),
    getIntentDescription: jest.fn(),
    validateIntentParams: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntentController],
      providers: [
        {
          provide: IntentService,
          useValue: mockIntentService,
        },
      ],
    }).compile();

    controller = module.get<IntentController>(IntentController);
    service = module.get<IntentService>(IntentService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('classifyIntent', () => {
    const dto: ClassifyIntentDto = {
      message: 'Find me flights from Mumbai to Delhi tomorrow',
    };

    const mockClassification = {
      intent: IntentType.FLIGHT_SEARCH,
      params: {
        from: 'BOM',
        to: 'DEL',
        date: '2025-11-24',
        passengers: 1,
      },
      confidence: 0.95,
      missingFields: [],
    };

    it('should classify flight search intent', async () => {
      mockIntentService.classifyIntent.mockResolvedValue(mockClassification);
      mockIntentService.getIntentDescription.mockReturnValue(
        'Search flights from BOM to DEL on 2025-11-24'
      );

      const result = await controller.classifyIntent(dto);

      expect(result.intent).toBe(IntentType.FLIGHT_SEARCH);
      expect(result.params.from).toBe('BOM');
      expect(result.params.to).toBe('DEL');
      expect(result.confidence).toBe(0.95);
      expect(result.description).toBe('Search flights from BOM to DEL on 2025-11-24');
      expect(result.timestamp).toBeDefined();
      expect(service.classifyIntent).toHaveBeenCalledWith(dto.message);
    });

    it('should classify job application intent', async () => {
      const jobDto: ClassifyIntentDto = {
        message: 'Apply to Software Engineer at Google',
      };

      const jobClassification = {
        intent: IntentType.APPLY_JOB,
        params: {
          jobTitle: 'Software Engineer',
          company: 'Google',
        },
        confidence: 0.9,
        missingFields: ['jobUrl', 'resumeId'],
      };

      mockIntentService.classifyIntent.mockResolvedValue(jobClassification);
      mockIntentService.getIntentDescription.mockReturnValue('Apply to job: Software Engineer');

      const result = await controller.classifyIntent(jobDto);

      expect(result.intent).toBe(IntentType.APPLY_JOB);
      expect(result.params.company).toBe('Google');
      expect(result.missingFields).toContain('jobUrl');
    });

    it('should classify form filling intent', async () => {
      const formDto: ClassifyIntentDto = {
        message: 'Fill the registration form at example.com',
      };

      const formClassification = {
        intent: IntentType.FILL_FORM,
        params: {
          url: 'https://example.com/register',
        },
        confidence: 0.88,
      };

      mockIntentService.classifyIntent.mockResolvedValue(formClassification);
      mockIntentService.getIntentDescription.mockReturnValue(
        'Fill form at https://example.com/register'
      );

      const result = await controller.classifyIntent(formDto);

      expect(result.intent).toBe(IntentType.FILL_FORM);
      expect(result.params.url).toBe('https://example.com/register');
    });

    it('should classify social media post intent', async () => {
      const socialDto: ClassifyIntentDto = {
        message: 'Post on Instagram: Beautiful sunset!',
      };

      const socialClassification = {
        intent: IntentType.POST_SOCIAL,
        params: {
          platform: 'instagram',
          caption: 'Beautiful sunset!',
        },
        confidence: 0.92,
      };

      mockIntentService.classifyIntent.mockResolvedValue(socialClassification);
      mockIntentService.getIntentDescription.mockReturnValue('Post on instagram: Beautiful sunset!');

      const result = await controller.classifyIntent(socialDto);

      expect(result.intent).toBe(IntentType.POST_SOCIAL);
      expect(result.params.platform).toBe('instagram');
    });

    it('should classify browser action intent', async () => {
      const browserDto: ClassifyIntentDto = {
        message: 'Go to amazon.com and search for iPhone',
      };

      const browserClassification = {
        intent: IntentType.BROWSER_ACTION,
        params: {
          url: 'amazon.com',
          description: 'search for iPhone',
        },
        confidence: 0.85,
      };

      mockIntentService.classifyIntent.mockResolvedValue(browserClassification);
      mockIntentService.getIntentDescription.mockReturnValue('Browser action: search for iPhone');

      const result = await controller.classifyIntent(browserDto);

      expect(result.intent).toBe(IntentType.BROWSER_ACTION);
    });

    it('should return unknown intent for unclear messages', async () => {
      const unclearDto: ClassifyIntentDto = {
        message: 'Do something',
      };

      const unknownClassification = {
        intent: IntentType.UNKNOWN,
        params: {},
        confidence: 0,
        missingFields: [],
      };

      mockIntentService.classifyIntent.mockResolvedValue(unknownClassification);
      mockIntentService.getIntentDescription.mockReturnValue('Unknown intent');

      const result = await controller.classifyIntent(unclearDto);

      expect(result.intent).toBe(IntentType.UNKNOWN);
      expect(result.confidence).toBe(0);
    });

    it('should include timestamp in response', async () => {
      mockIntentService.classifyIntent.mockResolvedValue(mockClassification);
      mockIntentService.getIntentDescription.mockReturnValue('Test description');

      const beforeTimestamp = new Date().toISOString();
      const result = await controller.classifyIntent(dto);
      const afterTimestamp = new Date().toISOString();

      expect(result.timestamp).toBeDefined();
      expect(result.timestamp >= beforeTimestamp).toBe(true);
      expect(result.timestamp <= afterTimestamp).toBe(true);
    });
  });

  describe('classifyIntentTest (public endpoint)', () => {
    it('should work the same as protected endpoint', async () => {
      const dto: ClassifyIntentDto = {
        message: 'Test message',
      };

      const mockClassification = {
        intent: IntentType.FLIGHT_SEARCH,
        params: { from: 'BOM', to: 'DEL' },
        confidence: 0.9,
      };

      mockIntentService.classifyIntent.mockResolvedValue(mockClassification);
      mockIntentService.getIntentDescription.mockReturnValue('Test description');

      const result = await controller.classifyIntentTest(dto);

      expect(result.intent).toBe(IntentType.FLIGHT_SEARCH);
      expect(service.classifyIntent).toHaveBeenCalledWith(dto.message);
    });
  });

  describe('edge cases', () => {
    it('should handle very long messages', async () => {
      const longMessage = 'a'.repeat(1000);
      const dto: ClassifyIntentDto = {
        message: longMessage,
      };

      const mockClassification = {
        intent: IntentType.UNKNOWN,
        params: {},
        confidence: 0,
      };

      mockIntentService.classifyIntent.mockResolvedValue(mockClassification);
      mockIntentService.getIntentDescription.mockReturnValue('Unknown intent');

      const result = await controller.classifyIntent(dto);

      expect(result.intent).toBe(IntentType.UNKNOWN);
      expect(service.classifyIntent).toHaveBeenCalledWith(longMessage);
    });

    it('should handle messages with special characters', async () => {
      const dto: ClassifyIntentDto = {
        message: 'Find flights from São Paulo to München with € budget',
      };

      const mockClassification = {
        intent: IntentType.FLIGHT_SEARCH,
        params: {
          from: 'GRU',
          to: 'MUC',
        },
        confidence: 0.85,
      };

      mockIntentService.classifyIntent.mockResolvedValue(mockClassification);
      mockIntentService.getIntentDescription.mockReturnValue('Search flights from GRU to MUC');

      const result = await controller.classifyIntent(dto);

      expect(result.intent).toBe(IntentType.FLIGHT_SEARCH);
    });

    it('should handle empty parameters', async () => {
      const dto: ClassifyIntentDto = {
        message: 'Book a flight',
      };

      const mockClassification = {
        intent: IntentType.FLIGHT_SEARCH,
        params: {},
        confidence: 0.6,
        missingFields: ['from', 'to', 'date'],
      };

      mockIntentService.classifyIntent.mockResolvedValue(mockClassification);
      mockIntentService.getIntentDescription.mockReturnValue('Search flights from ? to ? on ?');

      const result = await controller.classifyIntent(dto);

      expect(result.missingFields).toHaveLength(3);
    });
  });
});

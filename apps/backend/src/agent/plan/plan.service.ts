import { Injectable, Logger } from '@nestjs/common';

import { LLMService } from '../llm/llm.service';
import {
  createPlanGeneratorMessages,
  GENERATE_PLAN_FUNCTION,
} from '../prompts/plan-generator.prompt';
import { IntentClassification, IntentType } from '../types/intent.types';
import {
  PlanContext,
  PlanValidationResult,
  TaskPlan,
  TaskPlanSchema,
} from '../types/plan.types';
import { TOOL_REGISTRY, ToolName } from '../types/tools.types';

@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);

  constructor(private readonly llmService: LLMService) {}

  /**
   * Generate an execution plan from classified intent
   */
  async generatePlan(
    classification: IntentClassification,
    context?: PlanContext
  ): Promise<TaskPlan> {
    this.logger.log(
      `Generating plan for intent: ${classification.intent} with ${Object.keys(classification.params).length} params`
    );

    try {
      // Handle unknown intent
      if (classification.intent === IntentType.UNKNOWN) {
        this.logger.warn('Cannot generate plan for unknown intent');
        return {
          intent: IntentType.UNKNOWN,
          steps: [],
          metadata: {
            complexity: 'simple',
            totalSteps: 0,
            requiresUserInput: false,
          },
        };
      }

      // Create messages with user context
      const messages = createPlanGeneratorMessages(
        classification.intent,
        classification.params,
        context?.userProfile,
        new Date()
      );

      // Check if we have a simple template for this intent first
      const templatePlan = this.getTemplatePlan(classification);
      if (templatePlan) {
        this.logger.log(`Using template plan for intent: ${classification.intent}`);
        return templatePlan;
      }

      // Generate plan with LLM for complex tasks
      const completion = await this.llmService.complete(
        messages,
        [GENERATE_PLAN_FUNCTION],
        {
          temperature: 0.2, // Low temperature for deterministic plans
          maxTokens: 2000,
        }
      );

      // Extract function call
      const functionCall = this.llmService.extractFunctionCall(completion);

      let rawPlan: any;

      if (!functionCall) {
        this.logger.warn('No function call in LLM response, attempting to extract JSON from message content');
        
        // Try to extract JSON from message content (sometimes LLM responds with content instead of function call)
        const messageContent = completion.choices[0]?.message?.content;
        if (messageContent) {
          try {
            // Remove markdown code blocks if present
            const jsonMatch = messageContent.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonStr = jsonMatch ? jsonMatch[1].trim() : messageContent.trim();
            rawPlan = JSON.parse(jsonStr);
            this.logger.log('Successfully extracted plan from message content');
          } catch (parseError) {
            this.logger.warn(`Failed to parse JSON from message content: ${parseError.message}`);
            this.logger.warn('Using fallback plan');
            return this.getFallbackPlan(classification);
          }
        } else {
          this.logger.warn('No message content available, using fallback plan');
          return this.getFallbackPlan(classification);
        }
      } else {
        // Parse and validate function arguments
        rawPlan = this.llmService.parseFunctionArguments(functionCall);
      }

      // Validate with Zod schema
      const plan = TaskPlanSchema.parse(rawPlan);

      // Additional validation
      const validation = this.validatePlan(plan);
      if (!validation.valid) {
        this.logger.error(
          `Plan validation failed: ${validation.errors.map((e) => e.message).join(', ')}`
        );
        
        // Log warnings but don't fail completely
        if (validation.errors.some((e) => e.severity === 'error')) {
          throw new Error(`Plan validation failed: ${validation.errors[0].message}`);
        }
      }

      // Add step IDs if missing
      const planWithIds = this.ensureStepIds(plan);

      // Log token usage
      const usage = this.llmService.getTokenUsage(completion);
      this.logger.log(
        `Plan generated with ${planWithIds.steps.length} steps (tokens: ${usage.totalTokens})`
      );

      return planWithIds;
    } catch (error) {
      this.logger.error(`Failed to generate plan: ${error.message}`, error.stack);
      
      // Return a basic plan as fallback
      return this.getFallbackPlan(classification);
    }
  }

  /**
   * Validate a generated plan
   */
  validatePlan(plan: TaskPlan): PlanValidationResult {
    const errors: PlanValidationResult['errors'] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check if plan has steps
    if (!plan.steps || plan.steps.length === 0) {
      errors.push({
        code: 'EMPTY_PLAN',
        message: 'Plan has no steps',
        severity: 'error',
      });
      return { valid: false, errors, warnings, suggestions };
    }

    // Validate each step
    plan.steps.forEach((step, index) => {
      const stepId = step.id || `step_${index + 1}`;

      // Check if tool exists
      if (!Object.values(ToolName).includes(step.tool)) {
        errors.push({
          stepId,
          code: 'INVALID_TOOL',
          message: `Tool "${step.tool}" is not registered`,
          severity: 'error',
        });
        return;
      }

      const toolDef = TOOL_REGISTRY[step.tool];

      // Validate tool parameters
      try {
        toolDef.paramsSchema.parse(step.params);
      } catch (validationError) {
        errors.push({
          stepId,
          code: 'INVALID_PARAMS',
          message: `Invalid parameters for tool "${step.tool}": ${validationError.message}`,
          severity: 'error',
        });
      }

      // Check dependencies
      if (step.dependsOn && step.dependsOn.length > 0) {
        step.dependsOn.forEach((depId) => {
          const depExists = plan.steps.some((s) => s.id === depId);
          if (!depExists) {
            errors.push({
              stepId,
              code: 'INVALID_DEPENDENCY',
              message: `Dependency "${depId}" does not exist`,
              severity: 'error',
            });
          }

          // Check for circular dependencies
          const depStep = plan.steps.find((s) => s.id === depId);
          if (depStep?.dependsOn?.includes(stepId)) {
            errors.push({
              stepId,
              code: 'CIRCULAR_DEPENDENCY',
              message: `Circular dependency detected between "${stepId}" and "${depId}"`,
              severity: 'error',
            });
          }
        });
      }

      // Warnings for auth-required tools
      if (toolDef.requiresAuth) {
        warnings.push(`Step "${stepId}" requires authentication`);
      }
    });

    // Check for validation steps
    const hasValidation = plan.steps.some((s) =>
      [
        ToolName.VALIDATE_RESULTS,
        ToolName.CHECK_COMPLETION,
        ToolName.VERIFY_BOOKING,
      ].includes(s.tool)
    );

    if (!hasValidation && plan.steps.length > 1) {
      warnings.push('Plan has no validation steps - consider adding verification');
    }

    // Check for screenshots on important actions
    const hasBooking = plan.steps.some((s) =>
      [ToolName.BOOK_FLIGHT, ToolName.APPLY_JOB, ToolName.POST_SOCIAL].includes(s.tool)
    );
    const hasScreenshot = plan.steps.some((s) => s.tool === ToolName.TAKE_SCREENSHOT);

    if (hasBooking && !hasScreenshot) {
      suggestions.push('Consider adding a screenshot step for confirmation');
    }

    const valid = errors.filter((e) => e.severity === 'error').length === 0;

    return {
      valid,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  /**
   * Ensure all steps have IDs
   */
  private ensureStepIds(plan: TaskPlan): TaskPlan {
    return {
      ...plan,
      steps: plan.steps.map((step, index) => ({
        ...step,
        id: step.id || `step_${index + 1}`,
      })),
      metadata: {
        ...plan.metadata,
        totalSteps: plan.steps.length,
      },
    };
  }

  /**
   * Get empty plan for unknown intent
   */
  private getEmptyPlan(intent: IntentType): TaskPlan {
    return {
      intent,
      steps: [],
      metadata: {
        complexity: 'simple',
        totalSteps: 0,
        requiresUserInput: false,
      },
    };
  }

  /**
   * Get template plan for simple intents (utility tools)
   */
  private getTemplatePlan(classification: IntentClassification): TaskPlan | null {
    const { intent, params } = classification;

    switch (intent) {
      case IntentType.GET_WEATHER:
        return {
          intent: IntentType.GET_WEATHER,
          steps: [
            {
              id: 'step_1',
              tool: ToolName.GET_WEATHER,
              params: {
                location: params.location || '',
                units: params.units || 'celsius',
              },
              description: 'Get current weather information',
            },
          ],
          metadata: {
            complexity: 'simple',
            totalSteps: 1,
            requiresUserInput: false,
          },
        };

      case IntentType.CALCULATE:
        return {
          intent: IntentType.CALCULATE,
          steps: [
            {
              id: 'step_1',
              tool: ToolName.CALCULATE,
              params: {
                expression: params.expression || '0',
              },
              description: 'Perform calculation',
            },
          ],
          metadata: {
            complexity: 'simple',
            totalSteps: 1,
            requiresUserInput: false,
          },
        };

      default:
        return null;
    }
  }

  /**
   * Get fallback plan based on intent type
   */
  private getFallbackPlan(classification: IntentClassification): TaskPlan {
    const { intent, params } = classification;

    this.logger.warn(`Using fallback plan for intent: ${intent}`);

    // Create basic plans based on intent type
    switch (intent) {
      case IntentType.FLIGHT_SEARCH:
        return {
          intent,
          steps: [
            {
              id: 'step_1',
              tool: ToolName.SEARCH_FLIGHTS,
              params: {
                from: params.from || '',
                to: params.to || '',
                date: params.date || new Date().toISOString().split('T')[0],
                passengers: params.passengers || 1,
                class: params.class || 'economy',
              },
              description: 'Search for flights',
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
            requiresUserInput: false,
          },
        };

      case IntentType.BOOK_FLIGHT:
        return {
          intent,
          steps: [
            {
              id: 'step_1',
              tool: ToolName.BOOK_FLIGHT,
              params: {
                flightOptionId: params.flightOptionId || '',
                passengers: params.passengers || [],
              },
              description: 'Book flight',
              retryable: true,
              maxRetries: 2,
            },
            {
              id: 'step_2',
              tool: ToolName.TAKE_SCREENSHOT,
              params: { fullPage: true },
              description: 'Capture confirmation',
              dependsOn: ['step_1'],
            },
          ],
          metadata: {
            complexity: 'moderate',
            totalSteps: 2,
            requiresUserInput: true,
          },
        };

      case IntentType.APPLY_JOB:
        return {
          intent,
          steps: [
            {
              id: 'step_1',
              tool: ToolName.APPLY_JOB,
              params: {
                jobUrl: params.jobUrl || '',
                jobTitle: params.jobTitle,
                company: params.company,
                resumeId: params.resumeId,
              },
              description: 'Apply to job',
              retryable: true,
              maxRetries: 2,
            },
            {
              id: 'step_2',
              tool: ToolName.TAKE_SCREENSHOT,
              params: { fullPage: true },
              description: 'Capture confirmation',
              dependsOn: ['step_1'],
            },
          ],
          metadata: {
            complexity: 'moderate',
            totalSteps: 2,
            requiresUserInput: false,
          },
        };

      case IntentType.FILL_FORM:
        return {
          intent,
          steps: [
            {
              id: 'step_1',
              tool: ToolName.FILL_FORM,
              params: {
                url: params.url || '',
                fields: params.fields || {},
                submitForm: true,
              },
              description: 'Fill form',
              retryable: true,
              maxRetries: 2,
            },
            {
              id: 'step_2',
              tool: ToolName.CHECK_COMPLETION,
              params: { expectedOutcome: 'Form submitted', screenshot: true },
              description: 'Verify submission',
              dependsOn: ['step_1'],
            },
          ],
          metadata: {
            complexity: 'moderate',
            totalSteps: 2,
            requiresUserInput: true,
          },
        };

      case IntentType.POST_SOCIAL:
        return {
          intent,
          steps: [
            {
              id: 'step_1',
              tool: ToolName.POST_SOCIAL,
              params: {
                platform: params.platform || 'instagram',
                caption: params.caption || '',
                mediaIds: params.mediaIds || [],
              },
              description: 'Post to social media',
              retryable: true,
              maxRetries: 2,
            },
            {
              id: 'step_2',
              tool: ToolName.TAKE_SCREENSHOT,
              params: {},
              description: 'Capture confirmation',
              dependsOn: ['step_1'],
            },
          ],
          metadata: {
            complexity: 'simple',
            totalSteps: 2,
            requiresUserInput: false,
          },
        };

      case IntentType.BROWSER_ACTION:
        return {
          intent,
          steps: [
            {
              id: 'step_1',
              tool: ToolName.BROWSER_ACTION,
              params: {
                url: params.url,
                description: params.description,
                steps: params.steps || [],
              },
              description: 'Execute browser actions',
              retryable: true,
              maxRetries: 2,
            },
            {
              id: 'step_2',
              tool: ToolName.TAKE_SCREENSHOT,
              params: { fullPage: true },
              description: 'Capture final state',
              dependsOn: ['step_1'],
            },
          ],
          metadata: {
            complexity: 'complex',
            totalSteps: 2,
            requiresUserInput: false,
          },
        };

      default:
        return this.getEmptyPlan(intent);
    }
  }

  /**
   * Get plan description for logging/display
   */
  getPlanDescription(plan: TaskPlan): string {
    const stepDescriptions = plan.steps
      .map((step, index) => `${index + 1}. ${step.description || step.tool}`)
      .join('\n');

    return `Plan for ${plan.intent} (${plan.steps.length} steps):\n${stepDescriptions}`;
  }
}

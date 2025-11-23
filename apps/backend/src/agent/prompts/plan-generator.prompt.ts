/**
 * Plan Generator Prompt Templates
 * LLM prompts for generating multi-step execution plans from classified intents
 */

import { IntentType } from '../types/intent.types';
import { TOOL_REGISTRY, ToolName } from '../types/tools.types';

/**
 * System prompt for plan generation
 */
export const PLAN_GENERATOR_SYSTEM_PROMPT = `You are a Plan Generator for an autonomous AI agent.

Your job is to convert a classified user intent into a deterministic, executable multi-step plan.

## Available Tools

You have access to the following tools:

### Flight Tools
- **search_flights**: Search for flight options (params: from, to, date, returnDate, passengers, class, budget)
- **book_flight**: Book a selected flight (params: flightOptionId, passengers[], paymentMethodId)

### Job Tools
- **search_jobs**: Search for job openings (params: query, location, remote, experienceLevel)
- **apply_job**: Apply to a job posting (params: jobUrl, jobTitle, company, resumeId, coverLetter, answers)
- **generate_cover_letter**: Generate personalized cover letter (params: jobTitle, company, jobDescription, resumeId, tone)

### Form Tools
- **fill_form**: Fill and submit a web form (params: url, fields{}, files{}, submitForm)
- **analyze_form**: Analyze form structure (params: url, returnStructure)

### Social Media Tools
- **post_social**: Post content on social media (params: platform, accountId, caption, mediaIds[], scheduledFor, tags[])
- **schedule_post**: Schedule a social media post (params: platform, scheduledFor, caption, mediaIds[])
- **generate_caption**: Generate caption with hashtags (params: platform, context, tone, includeHashtags, maxLength)

### Browser Tools
- **browser_action**: Execute custom browser automation (params: url, steps[], description)
- **navigate_to**: Navigate to a URL (params: url, waitForSelector)
- **extract_data**: Extract data from webpage (params: url, selectors{})
- **take_screenshot**: Take screenshot (params: fullPage, selector)

### Validation Tools
- **validate_results**: Validate step results (params: stepId, minResults, required)
- **check_completion**: Check task completion (params: expectedOutcome, screenshot)
- **verify_booking**: Verify booking confirmation (params: bookingType, confirmationRequired[])

## Plan Generation Rules

1. **Deterministic**: Same intent should produce the same plan structure
2. **Safe**: Only use tools that are registered and validated
3. **Ordered**: Steps must be in logical execution order
4. **Dependencies**: Use \`dependsOn\` for steps that need previous results
5. **Validation**: Include validation steps after critical actions
6. **User Context**: Consider user profile data (travel prefs, social accounts, resume)
7. **Error Handling**: Mark optional steps, set retry policies
8. **Evidence**: Include screenshot/verification steps for important actions

## User Profile Context

You will receive user profile information that may include:
- Travel preferences (preferred airline, class, budget limits)
- Social media accounts (platform credentials, posting preferences)
- Resume URL for job applications
- Payment methods on file
- Stored browser sessions

Use this context to:
- Pre-fill parameters when possible
- Skip authentication steps if sessions exist
- Respect user preferences (e.g., budget limits)
- Select appropriate tools based on available data

## Output Format

You MUST respond with a valid JSON object following this structure:

\`\`\`json
{
  "intent": "flight_search",
  "steps": [
    {
      "id": "step_1",
      "tool": "search_flights",
      "params": {
        "from": "BOM",
        "to": "DEL",
        "date": "2025-12-25",
        "passengers": 2,
        "class": "economy"
      },
      "description": "Search for flights from Mumbai to Delhi",
      "optional": false,
      "retryable": true,
      "maxRetries": 3
    },
    {
      "id": "step_2",
      "tool": "validate_results",
      "params": {
        "stepId": "step_1",
        "minResults": 1,
        "required": true
      },
      "description": "Ensure flight search returned results",
      "dependsOn": ["step_1"],
      "optional": false
    }
  ],
  "metadata": {
    "estimatedDuration": 30,
    "requiresUserInput": false,
    "complexity": "simple",
    "totalSteps": 2
  }
}
\`\`\`

## Important Constraints

- ALL tool names must be from the registered tools list
- ALL parameters must match the tool's schema
- Steps should be numbered sequentially (step_1, step_2, etc.)
- Always include at least one validation or verification step
- For booking/payment actions, ALWAYS add verification screenshots
- For OTP/CAPTCHA flows, mark requiresUserInput: true
- Keep plans as simple as possible - avoid unnecessary steps
- Use existing user data (resumeId, accountId) instead of asking for it

## Examples

### Example 1: Flight Search
Input: { intent: "flight_search", params: { from: "BOM", to: "DEL", date: "2025-12-25" } }
Output: 2-step plan (search + validate)

### Example 2: Job Application
Input: { intent: "apply_job", params: { jobTitle: "Software Engineer", company: "Google" } }
Output: 3-step plan (generate_cover_letter + apply_job + screenshot)

### Example 3: Social Media Post
Input: { intent: "post_social", params: { platform: "instagram", caption: "Hello world" } }
Output: 3-step plan (generate_caption (optional) + post_social + screenshot)

Return ONLY the JSON plan object. No additional text or explanation.`;

/**
 * Create plan generation messages for LLM
 */
export function createPlanGeneratorMessages(
  intent: IntentType,
  params: Record<string, unknown>,
  userProfile?: {
    travelPrefs?: Record<string, unknown>;
    socialAccounts?: Record<string, unknown>;
    resumeUrl?: string;
    paymentMethods?: string[];
  },
  currentDate?: Date
): Array<{ role: 'system' | 'user'; content: string }> {
  const date = currentDate || new Date();
  const dateStr = date.toISOString().split('T')[0];

  // Build user context
  const contextParts: string[] = [
    `Intent: ${intent}`,
    `Parameters: ${JSON.stringify(params, null, 2)}`,
    `Current date: ${dateStr}`,
  ];

  if (userProfile) {
    if (userProfile.travelPrefs && Object.keys(userProfile.travelPrefs).length > 0) {
      contextParts.push(`Travel preferences: ${JSON.stringify(userProfile.travelPrefs, null, 2)}`);
    }
    if (userProfile.socialAccounts && Object.keys(userProfile.socialAccounts).length > 0) {
      contextParts.push(`Social accounts: ${JSON.stringify(userProfile.socialAccounts, null, 2)}`);
    }
    if (userProfile.resumeUrl) {
      contextParts.push(`Resume URL: ${userProfile.resumeUrl}`);
    }
    if (userProfile.paymentMethods && userProfile.paymentMethods.length > 0) {
      contextParts.push(`Payment methods: ${userProfile.paymentMethods.join(', ')}`);
    }
  }

  const userMessage = contextParts.join('\n\n');

  return [
    {
      role: 'system',
      content: PLAN_GENERATOR_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: `Generate an execution plan for the following:\n\n${userMessage}`,
    },
  ];
}

/**
 * OpenAI Function Definition for Plan Generation
 */
export const GENERATE_PLAN_FUNCTION = {
  name: 'generate_plan',
  description: 'Generate a multi-step execution plan from classified intent',
  parameters: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        enum: Object.values(IntentType),
        description: 'The classified intent type',
      },
      steps: {
        type: 'array',
        description: 'Ordered list of execution steps',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique step identifier (e.g., step_1, step_2)',
            },
            tool: {
              type: 'string',
              enum: Object.values(ToolName),
              description: 'Tool to execute (must be from registered tools)',
            },
            params: {
              type: 'object',
              description: 'Tool-specific parameters',
            },
            description: {
              type: 'string',
              description: 'Human-readable description of what this step does',
            },
            dependsOn: {
              type: 'array',
              items: { type: 'string' },
              description: 'Step IDs this step depends on',
            },
            optional: {
              type: 'boolean',
              description: 'Whether this step is optional (can be skipped on failure)',
              default: false,
            },
            retryable: {
              type: 'boolean',
              description: 'Whether this step can be retried on failure',
              default: true,
            },
            maxRetries: {
              type: 'number',
              description: 'Maximum number of retry attempts',
              default: 3,
            },
          },
          required: ['id', 'tool', 'params'],
        },
      },
      metadata: {
        type: 'object',
        description: 'Plan metadata',
        properties: {
          estimatedDuration: {
            type: 'number',
            description: 'Estimated execution time in seconds',
          },
          requiresUserInput: {
            type: 'boolean',
            description: 'Whether plan requires user interaction (OTP, payment, etc.)',
            default: false,
          },
          complexity: {
            type: 'string',
            enum: ['simple', 'moderate', 'complex'],
            description: 'Plan complexity level',
            default: 'moderate',
          },
          totalSteps: {
            type: 'number',
            description: 'Total number of steps in the plan',
          },
        },
      },
      validationRules: {
        type: 'array',
        description: 'Post-execution validation rules',
        items: {
          type: 'object',
          properties: {
            stepId: { type: 'string' },
            rule: { type: 'string' },
            required: { type: 'boolean', default: true },
          },
        },
      },
    },
    required: ['intent', 'steps'],
  },
};

/**
 * Get tool descriptions for context
 */
export function getToolDescriptions(): string {
  return Object.values(TOOL_REGISTRY)
    .map((tool) => `- ${tool.name}: ${tool.description}`)
    .join('\n');
}

/**
 * Get example plan for an intent type
 */
export function getExamplePlan(intent: IntentType): string {
  const examples: Record<IntentType, string> = {
    [IntentType.GET_WEATHER]: JSON.stringify(
      {
        intent: 'get_weather',
        steps: [
          {
            id: 'step_1',
            tool: 'get_weather',
            params: { location: 'San Francisco', units: 'celsius' },
            description: 'Get current weather information',
          },
        ],
        metadata: { complexity: 'simple', totalSteps: 1 },
      },
      null,
      2
    ),
    [IntentType.CALCULATE]: JSON.stringify(
      {
        intent: 'calculate',
        steps: [
          {
            id: 'step_1',
            tool: 'calculate',
            params: { expression: '25 * 4' },
            description: 'Perform calculation',
          },
        ],
        metadata: { complexity: 'simple', totalSteps: 1 },
      },
      null,
      2
    ),
    [IntentType.FLIGHT_SEARCH]: JSON.stringify(
      {
        intent: 'flight_search',
        steps: [
          {
            id: 'step_1',
            tool: 'search_flights',
            params: { from: 'BOM', to: 'DEL', date: '2025-12-25', passengers: 1 },
            description: 'Search for available flights',
          },
          {
            id: 'step_2',
            tool: 'validate_results',
            params: { stepId: 'step_1', minResults: 1 },
            description: 'Validate search results',
            dependsOn: ['step_1'],
          },
        ],
        metadata: { complexity: 'simple', totalSteps: 2 },
      },
      null,
      2
    ),
    [IntentType.BOOK_FLIGHT]: JSON.stringify(
      {
        intent: 'book_flight',
        steps: [
          {
            id: 'step_1',
            tool: 'book_flight',
            params: { flightOptionId: 'FL123', passengers: [], paymentMethodId: 'pm_123' },
            description: 'Book the selected flight',
          },
          {
            id: 'step_2',
            tool: 'verify_booking',
            params: { bookingType: 'flight', confirmationRequired: ['PNR', 'ticketNumber'] },
            description: 'Verify booking confirmation',
            dependsOn: ['step_1'],
          },
          {
            id: 'step_3',
            tool: 'take_screenshot',
            params: { fullPage: true },
            description: 'Capture confirmation',
            dependsOn: ['step_2'],
          },
        ],
        metadata: { complexity: 'moderate', requiresUserInput: true, totalSteps: 3 },
      },
      null,
      2
    ),
    [IntentType.APPLY_JOB]: JSON.stringify(
      {
        intent: 'apply_job',
        steps: [
          {
            id: 'step_1',
            tool: 'generate_cover_letter',
            params: { jobTitle: 'Software Engineer', company: 'Google', tone: 'professional' },
            description: 'Generate personalized cover letter',
          },
          {
            id: 'step_2',
            tool: 'apply_job',
            params: { jobUrl: 'https://...', coverLetter: '{{step_1.output}}' },
            description: 'Submit application',
            dependsOn: ['step_1'],
          },
          {
            id: 'step_3',
            tool: 'take_screenshot',
            params: { fullPage: true },
            description: 'Capture confirmation',
            dependsOn: ['step_2'],
          },
        ],
        metadata: { complexity: 'moderate', totalSteps: 3 },
      },
      null,
      2
    ),
    [IntentType.FILL_FORM]: JSON.stringify(
      {
        intent: 'fill_form',
        steps: [
          {
            id: 'step_1',
            tool: 'fill_form',
            params: { url: 'https://...', fields: {}, submitForm: true },
            description: 'Fill and submit form',
          },
          {
            id: 'step_2',
            tool: 'check_completion',
            params: { expectedOutcome: 'Form submitted successfully', screenshot: true },
            description: 'Verify submission',
            dependsOn: ['step_1'],
          },
        ],
        metadata: { complexity: 'moderate', totalSteps: 2 },
      },
      null,
      2
    ),
    [IntentType.POST_SOCIAL]: JSON.stringify(
      {
        intent: 'post_social',
        steps: [
          {
            id: 'step_1',
            tool: 'generate_caption',
            params: { platform: 'instagram', context: 'Beautiful sunset', tone: 'casual' },
            description: 'Generate caption',
            optional: true,
          },
          {
            id: 'step_2',
            tool: 'post_social',
            params: { platform: 'instagram', caption: '{{step_1.output}}' },
            description: 'Post to Instagram',
          },
          {
            id: 'step_3',
            tool: 'take_screenshot',
            params: {},
            description: 'Capture post confirmation',
            dependsOn: ['step_2'],
          },
        ],
        metadata: { complexity: 'simple', totalSteps: 3 },
      },
      null,
      2
    ),
    [IntentType.BROWSER_ACTION]: JSON.stringify(
      {
        intent: 'browser_action',
        steps: [
          {
            id: 'step_1',
            tool: 'browser_action',
            params: { url: 'https://...', description: 'Navigate and perform actions' },
            description: 'Execute browser automation',
          },
          {
            id: 'step_2',
            tool: 'take_screenshot',
            params: { fullPage: true },
            description: 'Capture final state',
            dependsOn: ['step_1'],
          },
        ],
        metadata: { complexity: 'complex', totalSteps: 2 },
      },
      null,
      2
    ),
    [IntentType.UNKNOWN]: JSON.stringify(
      {
        intent: 'unknown',
        steps: [],
        metadata: { complexity: 'simple', totalSteps: 0 },
      },
      null,
      2
    ),
  };

  return examples[intent] || examples[IntentType.UNKNOWN];
}

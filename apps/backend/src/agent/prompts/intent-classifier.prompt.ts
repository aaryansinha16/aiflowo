/**
 * Intent Classifier Prompt Template
 */

import { IntentType } from '../types/intent.types';

export const INTENT_CLASSIFIER_SYSTEM_PROMPT = `You are an Intent Classifier for an autonomous AI agent that executes tasks for users.

Your job is to analyze user messages and classify them into one of the following intents:

## CONVERSATIONAL INTENTS (Quick responses, no task execution needed)

1. **greeting**: User is greeting or making small talk
   - Extract: message (the greeting text)
   - Examples: "Hello", "Hi there", "Good morning", "How are you?", "Hey"

2. **clarification**: User is asking for clarification or details about something
   - Extract: query (what they want clarified), context (related topic)
   - Examples: "What do you mean?", "Can you explain more?", "I don't understand"

3. **general_question**: User is asking a general question that doesn't require task execution
   - Extract: question (the question text)
   - Examples: "What can you do?", "How does this work?", "What's the capital of France?"

4. **help**: User needs help or guidance
   - Extract: topic (what they need help with)
   - Examples: "Help me", "I need assistance", "What commands can I use?"

## TASK INTENTS (Require full task execution)

5. **get_weather**: User wants to get weather information
   - Extract: location (city name), units (celsius/fahrenheit)
   - Examples: "What's the weather in San Francisco?", "Check weather in London", "Weather forecast for NYC"

6. **calculate**: User wants to perform a calculation
   - Extract: expression (the mathematical expression)
   - Examples: "Calculate 25 * 4", "What is 100 divided by 5?", "Solve 2 + 2"

7. **flight_search**: User wants to search for flights
   - Extract: from, to, date, returnDate, passengers, class, budget
   - Examples: "Find flights from Mumbai to Delhi", "Show me flights to NYC next week"

8. **book_flight**: User wants to book a specific flight
   - Extract: flightOptionId, passengers (with names), paymentMethodId
   - Examples: "Book this flight", "Confirm booking for flight ABC123"

9. **apply_job**: User wants to apply to a job posting
   - Extract: jobUrl, jobTitle, company, resumeId, coverLetter, answers
   - Examples: "Apply to this job at Google", "Submit application for Software Engineer role"

10. **fill_form**: User wants to fill out a web form
    - Extract: url, fields (key-value pairs), files, submitForm
    - Examples: "Fill this form for me", "Complete the registration form at example.com"

11. **post_social**: User wants to post on social media
    - Extract: platform, accountId, caption, mediaIds, scheduledFor, tags
    - Examples: "Post this photo on Instagram", "Tweet this message", "Schedule a LinkedIn post"

12. **browser_action**: User wants to perform custom browser actions
    - Extract: url, steps, description
    - Examples: "Go to amazon.com and add iPhone to cart", "Navigate to settings and change password"

If the user's intent doesn't clearly match any of these, classify as "unknown".

IMPORTANT RULES:
1. Today's date is: {{currentDate}}. Use this to parse relative dates like "tomorrow", "next Monday", etc.
2. Convert city names to IATA airport codes when possible (e.g., "Mumbai" → "BOM", "Delhi" → "DEL")
3. Extract ALL parameters you can find, even if some are missing
4. If required information is missing, still classify the intent but note the missing fields
5. Be conservative with date parsing - if unclear, leave it empty
6. Return ONLY the function call, no additional text
7. Prefer conversational intents (greeting, clarification, general_question, help) for simple messages that don't need task execution

You MUST respond with a function call to classify_intent.`;

/**
 * Context for intent classification
 */
interface ClassifierContext {
  previousTasks?: Array<{
    intent: string;
    status: string;
    result?: any;
  }>;
  summary?: string;
}

export const createIntentClassifierMessages = (
  userMessage: string,
  currentDate?: Date,
  context?: ClassifierContext
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> => {
  const date = currentDate || new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: INTENT_CLASSIFIER_SYSTEM_PROMPT.replace('{{currentDate}}', dateStr),
    },
  ];

  // Add conversation context if available
  if (context?.previousTasks && context.previousTasks.length > 0) {
    // Get last 5 tasks for context (most recent)
    const recentTasks = context.previousTasks.slice(-5);
    
    // Build context message
    let contextMessage = `CONVERSATION CONTEXT (use this to understand follow-up questions):\n`;
    contextMessage += `The user has been having a conversation with you. Here are the recent interactions:\n\n`;
    
    recentTasks.forEach((task, index) => {
      contextMessage += `${index + 1}. User asked: "${task.intent}"\n`;
      contextMessage += `   Intent: ${getIntentFromTask(task)}\n`;
      if (task.result?.data) {
        contextMessage += `   Result: ${summarizeResult(task)}\n`;
      }
      contextMessage += '\n';
    });
    
    contextMessage += `\nIMPORTANT: If the current message is a follow-up (e.g., "show cheaper ones", "what about tomorrow", "filter by price"), `;
    contextMessage += `use the context above to understand what the user is referring to and extract the relevant parameters.\n`;
    contextMessage += `For example, if the last intent was "flight_search" from Mumbai to Delhi, and the user now says "show flights under 5000", `;
    contextMessage += `you should classify as "flight_search" with the same from/to but add the budget constraint.`;
    
    messages.push({
      role: 'system',
      content: contextMessage,
    });
  }

  // Add the user's current message
  messages.push({
    role: 'user',
    content: userMessage,
  });

  return messages;
};

/**
 * Extract intent type from task
 */
function getIntentFromTask(task: { intent: string; result?: any }): string {
  // Try to get from result metadata
  if (task.result?.intent) {
    return task.result.intent;
  }
  // Fall back to analyzing the intent text
  const intentText = task.intent.toLowerCase();
  if (intentText.includes('flight') || intentText.includes('fly')) return 'flight_search';
  if (intentText.includes('weather')) return 'get_weather';
  if (intentText.includes('calculate') || intentText.includes('math')) return 'calculate';
  if (intentText.includes('job') || intentText.includes('apply')) return 'apply_job';
  if (intentText.includes('form') || intentText.includes('fill')) return 'fill_form';
  if (intentText.includes('post') || intentText.includes('instagram') || intentText.includes('twitter')) return 'post_social';
  return 'unknown';
}

/**
 * Summarize task result for context
 */
function summarizeResult(task: { intent: string; result?: any }): string {
  const result = task.result;
  if (!result) return 'No result';
  
  // Handle lightweight responses
  if (result.isLightweight) {
    return 'Conversational response';
  }
  
  // Handle flight search results
  if (result.results?.[0]?.toolName === 'search_flights') {
    const flightData = result.results[0]?.result?.data;
    if (flightData?.flights?.length) {
      const flights = flightData.flights;
      return `Found ${flights.length} flights from ${flights[0]?.from} to ${flights[0]?.to}, prices from ₹${flights[0]?.price} to ₹${flights[flights.length-1]?.price}`;
    }
  }
  
  // Handle other results
  if (result.success) {
    return 'Task completed successfully';
  }
  
  return 'Task result available';
}

/**
 * OpenAI Function Definition for Intent Classification
 */
export const CLASSIFY_INTENT_FUNCTION = {
  name: 'classify_intent',
  description: 'Classify user intent and extract parameters',
  parameters: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        enum: Object.values(IntentType),
        description: 'The classified intent type',
      },
      params: {
        type: 'object',
        description: 'Extracted parameters from the user message',
        properties: {
          // Flight search
          from: { type: 'string', description: 'Departure location (airport code or city)' },
          to: { type: 'string', description: 'Destination location (airport code or city)' },
          date: { type: 'string', description: 'Departure date (YYYY-MM-DD)' },
          returnDate: { type: 'string', description: 'Return date (YYYY-MM-DD)' },
          passengers: { type: 'number', description: 'Number of passengers' },
          class: { 
            type: 'string',
            enum: ['economy', 'premium_economy', 'business', 'first'],
            description: 'Cabin class'
          },
          budget: { type: 'number', description: 'Maximum budget' },
          
          // Job application
          jobUrl: { type: 'string', description: 'Job posting URL' },
          jobTitle: { type: 'string', description: 'Job title' },
          company: { type: 'string', description: 'Company name' },
          resumeId: { type: 'string', description: 'Resume reference' },
          coverLetter: { type: 'string', description: 'Cover letter text' },
          
          // Form filling
          url: { type: 'string', description: 'Form URL' },
          fields: { type: 'object', description: 'Form field values' },
          
          // Social media
          platform: { 
            type: 'string',
            enum: ['instagram', 'twitter', 'facebook', 'linkedin'],
            description: 'Social media platform'
          },
          caption: { type: 'string', description: 'Post caption' },
          mediaIds: { type: 'array', items: { type: 'string' }, description: 'Media references' },
          scheduledFor: { type: 'string', description: 'Scheduled time (ISO format)' },
          
          // Browser action
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                selector: { type: 'string' },
                value: { type: 'string' },
              },
            },
            description: 'Browser action steps'
          },
          description: { type: 'string', description: 'Task description' },
        },
      },
      confidence: {
        type: 'number',
        description: 'Confidence score between 0 and 1',
      },
      missingFields: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of required fields that are missing',
      },
    },
    required: ['intent', 'params'],
  },
};

/**
 * Intent Classifier Prompt Template
 */

import { IntentType } from '../types/intent.types';

export const INTENT_CLASSIFIER_SYSTEM_PROMPT = `You are an Intent Classifier for an autonomous AI agent that executes tasks for users.

Your job is to analyze user messages and classify them into one of the following intents:

1. **flight_search**: User wants to search for flights
   - Extract: from, to, date, returnDate, passengers, class, budget
   - Examples: "Find flights from Mumbai to Delhi", "Show me flights to NYC next week"

2. **book_flight**: User wants to book a specific flight
   - Extract: flightOptionId, passengers (with names), paymentMethodId
   - Examples: "Book this flight", "Confirm booking for flight ABC123"

3. **apply_job**: User wants to apply to a job posting
   - Extract: jobUrl, jobTitle, company, resumeId, coverLetter, answers
   - Examples: "Apply to this job at Google", "Submit application for Software Engineer role"

4. **fill_form**: User wants to fill out a web form
   - Extract: url, fields (key-value pairs), files, submitForm
   - Examples: "Fill this form for me", "Complete the registration form at example.com"

5. **post_social**: User wants to post on social media
   - Extract: platform, accountId, caption, mediaIds, scheduledFor, tags
   - Examples: "Post this photo on Instagram", "Tweet this message", "Schedule a LinkedIn post"

6. **browser_action**: User wants to perform custom browser actions
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

You MUST respond with a function call to classify_intent.`;

export const createIntentClassifierMessages = (
  userMessage: string,
  currentDate?: Date
): Array<{ role: 'system' | 'user'; content: string }> => {
  const date = currentDate || new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

  return [
    {
      role: 'system',
      content: INTENT_CLASSIFIER_SYSTEM_PROMPT.replace('{{currentDate}}', dateStr),
    },
    {
      role: 'user',
      content: userMessage,
    },
  ];
};

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

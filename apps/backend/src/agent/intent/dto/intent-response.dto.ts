import { IntentType } from '../../types/intent.types';

export class IntentResponseDto {
  intent: IntentType;
  params: Record<string, unknown>;
  confidence?: number;
  missingFields?: string[];
  description?: string;
  timestamp: string;
}

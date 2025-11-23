import { IntentType } from '../../types/intent.types';
import { PlanStep } from '../../types/plan.types';

export class PlanResponseDto {
  intent: IntentType;
  steps: PlanStep[];
  metadata?: {
    estimatedDuration?: number;
    requiresUserInput?: boolean;
    complexity?: 'simple' | 'moderate' | 'complex';
    totalSteps: number;
  };
  description?: string;
  validationResult?: {
    valid: boolean;
    warnings?: string[];
    suggestions?: string[];
  };
  timestamp: string;
}

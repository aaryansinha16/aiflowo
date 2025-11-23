import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

import { IntentType } from '../../types/intent.types';

export class GeneratePlanDto {
  @IsEnum(IntentType)
  @IsNotEmpty()
  intent: IntentType;

  @IsObject()
  @IsNotEmpty()
  params: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  userProfile?: {
    travelPrefs?: Record<string, unknown>;
    socialAccounts?: Record<string, unknown>;
    resumeUrl?: string;
    paymentMethods?: string[];
  };

  @IsString()
  @IsOptional()
  userId?: string;
}

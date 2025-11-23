import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ClassifyIntentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}

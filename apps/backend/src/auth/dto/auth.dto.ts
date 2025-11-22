import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMagicLinkDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;
}

export class VerifyMagicLinkDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

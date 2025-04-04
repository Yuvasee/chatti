import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for JWT token payload
 */
export class TokenPayloadDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;
} 
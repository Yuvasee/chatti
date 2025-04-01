import { IsString, IsOptional, MaxLength } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Name is too long, maximum length is 50 characters' })
  name?: string;
}

import { IsString, IsNotEmpty } from 'class-validator';

export class LoginResponseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
  
  @IsString()
  @IsNotEmpty()
  avatar!: string;
  
  @IsString()
  @IsNotEmpty()
  token!: string;
}

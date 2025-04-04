import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, ApiResponseDto } from '@chatti/shared-types';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ 
    status: 200, 
    description: 'User logged in successfully', 
    type: () => ApiResponseDto<LoginResponseDto> 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid login data' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Server error'
  })
  async login(@Body() loginDto: LoginDto): Promise<ApiResponseDto<LoginResponseDto>> {
    const result = await this.authService.login(loginDto.name);
    return new ApiResponseDto<LoginResponseDto>(result, 'Login successful');
  }
}

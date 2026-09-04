import { Controller, Post, Get, Req, Body } from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @Public()
  register(registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  login(
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}

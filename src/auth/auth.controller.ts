import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Query,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from '../users/dto/register.dto.js';
import { LoginDto } from '../users/dto/login.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtStrategy } from './jwt.strategy.js';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @ApiOperation({ summary: 'Шинэ хэрэглэгч бvртгэх' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me() {
    return { message: 'Hi' };
  }

  @Get('test')
  @UseGuards(JwtAuthGuard)
  async qwerty(@Req() req: any) {
    const userId = req.user.sub;

    const name = await this.authService.getProfile(userId);
    // const user = this.authService.getProfile(name);
    return { message: `Hello, ${name}` };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Одоогийн хэрэглэгчийн мэдээлэл харах' })
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  logoutAll(@Request() req: any) {
    return this.authService.revokeAllSessions(req.user.sub);
  }
}

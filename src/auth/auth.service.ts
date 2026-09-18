import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from '../users/dto/register.dto.js';
import { LoginDto } from '../users/dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Энэ email бүртгэлтэй байна');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });

    const { password, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email эсвэл нууц үг буруу байна');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Email эсвэл нууц үг буруу байна');
    }
    
    return this.generateTokens(user.id, user.email);
  }

  async revokeAllSessions(userId: string) {
  await this.usersService.incrementTokenVersion(userId);
  await this.usersService.setRefreshToken(userId, null);
  }

  async generateTokens(userId: string, email: string) {
  const newTokenVersion = await this.usersService.incrementTokenVersion(userId);
  const payload = { sub: userId, email, tokenVersion: newTokenVersion };

  const accessToken = await this.jwtService.signAsync(payload, {
    secret: this.configService.get('JWT_SECRET'),
    expiresIn: this.configService.get('JWT_EXPIRES'),
  });

  const refreshToken = await this.jwtService.signAsync(payload, {
    secret: this.configService.get('REFRESH_SECRET'),
    expiresIn: this.configService.get('REFRESH_EXPIRES'),
  });

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await this.usersService.setRefreshToken(userId, hashedRefreshToken);

  return { access_token: accessToken, refresh_token: refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token хvчингvй байна');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Хандах эрхгvй');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) {
      throw new UnauthorizedException('Refresh token таарахгvй байна');
    }

    return this.generateTokens(user.id, user.email);
  }
}
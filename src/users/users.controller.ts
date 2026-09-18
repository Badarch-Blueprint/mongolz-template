import { Controller, Get, Patch, Body, UseGuards, Request, UnauthorizedException, Delete } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from './entities/user.entities.js';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  update(@Request() req: any, @Body() dto: UpdateUserDto) {
    const userId = req.user.sub;
    return this.usersService.update(userId, dto);
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    const userId = req.user.sub;
    const user = await this.usersService.findById(userId);
    if (!user){
      throw new UnauthorizedException('Хэрэглэгч олдсонгүй');
    }
    const { password, refreshToken, tokenVersion,id, role, ...result } = user;
    return result;
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async getAllUsers() {
  return this.usersService.findAll();
  }
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async remove(@Request() req: any) {
    const userId = req.user.sub;
    await this.usersService.remove(userId);
    return { message: 'Хэрэглэгч амжилттай устгагдлаа' };
  }
}
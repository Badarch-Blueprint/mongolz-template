import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
  Param,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from './entities/user.entities.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BlockedUsersService } from '../users/blocked-users.service.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly blockedUsersService: BlockedUsersService,
  ) {}

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
    if (!user) {
      throw new UnauthorizedException('Хэрэглэгч олдсонгvй');
    }
    const { password, refreshToken, tokenVersion, role, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('chat-list')
  async getChatList(@Request() req: any) {
    const allUsers = await this.usersService.findChatList(req.user.sub);
    const blockedPartnerIds =
      await this.blockedUsersService.getBlockedPartnerIds(req.user.sub);
    return allUsers.filter((user) => !blockedPartnerIds.has(user.id));
  }

  @UseGuards(JwtAuthGuard)
  @Get('blocked')
  getBlockedUsers(@Request() req: any) {
    return this.blockedUsersService.listBlockedByMe(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('block/:userId')
  blockUser(@Request() req: any, @Param('userId') userId: string) {
    if (!isUUID(userId)) throw new BadRequestException('Буруу id');
    return this.blockedUsersService.block(req.user.sub, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('block/:userId')
  unblockUser(@Request() req: any, @Param('userId') userId: string) {
    if (!isUUID(userId)) throw new BadRequestException('Буруу id');
    return this.blockedUsersService.unblock(req.user.sub, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = `${(req as any).user.sub}-${Date.now()}`;
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException(
              'Зөвхөн зургийн файл (jpg, png, gif) зөвшөөрнө',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Файл олдсонгvй');
    }
    const userId = req.user.sub;
    const avatarPath = `/uploads/${file.filename}`;
    await this.usersService.updateAvatar(userId, avatarPath);
    return { avatar: avatarPath };
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
    const deletionDate = await this.usersService.scheduleForDeletion(userId);
    return {
      message:
        'Таны бvртгэл 7 хоногийн дараа устгагдана. Энэ хугацаанд дахин нэвтэрвэл цуцлагдана.',
      scheduledFor: deletionDate,
    };
  }
}

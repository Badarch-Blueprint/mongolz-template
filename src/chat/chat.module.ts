import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway.js';
import { MessagesService } from './message.service.js';
import { Message } from '../users/entities/message.entities.js';
import { PrivateMessage } from '../users/entities/private-message.entity.js';
import { UsersModule } from '../users/users.module.js';
import { BlockedUsersModule } from '../users/blocked-users.module.js'; // шинэ

@Module({
  imports: [
    UsersModule,
    BlockedUsersModule, // шинэ — UsersModule өөрөө BlockedUsersService-ийг export хийдэггvй тул шууд нэмэх шаардлагатай
    TypeOrmModule.forFeature([Message, PrivateMessage]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
    }),
  ],
  providers: [ChatGateway, MessagesService],
})
export class ChatModule {}

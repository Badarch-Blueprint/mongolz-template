import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entities.js';
import { AuthModule } from '../auth/auth.module.js';
import { DeletionService } from './deletion.service.js';
import { BlockedUsersModule } from './blocked-users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule),
    BlockedUsersModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, DeletionService],
  exports: [UsersService],
})
export class UsersModule {}

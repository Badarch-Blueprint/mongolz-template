import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockedUser } from './entities/block.entities.js';
import { BlockedUsersService } from './blocked-users.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([BlockedUser])],
  providers: [BlockedUsersService],
  exports: [BlockedUsersService],
})
export class BlockedUsersModule {}

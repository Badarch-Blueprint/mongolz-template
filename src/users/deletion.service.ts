import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from './users.service.js';

@Injectable()
export class DeletionService {
  private readonly logger = new Logger(DeletionService.name);

  constructor(private readonly usersService: UsersService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleScheduledDeletions() {
    const usersToDelete = await this.usersService.findAllPendingDeletion();

    for (const user of usersToDelete) {
      await this.usersService.hardDelete(user.id);
      this.logger.log(`Хэрэглэгч ${user.email} автоматаар устгагдлаа`);
    }

    if (usersToDelete.length > 0) {
      this.logger.log(`Нийт ${usersToDelete.length} хэрэглэгч устгагдлаа`);
    }
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlockedUser } from './entities/block.entities.js';

@Injectable()
export class BlockedUsersService {
  constructor(
    @InjectRepository(BlockedUser)
    private readonly blockedUserRepository: Repository<BlockedUser>,
  ) {}

  async block(blockerId: string, blockedUserId: string): Promise<void> {
    if (blockerId === blockedUserId) return; // өөрийгөө блоклохгvй

    const exists = await this.blockedUserRepository.findOne({
      where: { blockerId, blockedUserId },
    });
    if (exists) return; // аль хэдийн блоклосон

    const row = this.blockedUserRepository.create({ blockerId, blockedUserId });
    await this.blockedUserRepository.save(row);
  }

  async unblock(blockerId: string, blockedUserId: string): Promise<void> {
    await this.blockedUserRepository.delete({ blockerId, blockedUserId });
  }

  async isBlocked(userIdA: string, userIdB: string): Promise<boolean> {
    const count = await this.blockedUserRepository.count({
      where: [
        { blockerId: userIdA, blockedUserId: userIdB },
        { blockerId: userIdB, blockedUserId: userIdA },
      ],
    });
    return count > 0;
  }

  // A мэдэхгvй ч, аль ч чиглэлд A-тай холбоотой бvх блоклолтын нөгөө талын id-г буцаана
  async getBlockedPartnerIds(userId: string): Promise<Set<string>> {
    const rows = await this.blockedUserRepository.find({
      where: [{ blockerId: userId }, { blockedUserId: userId }],
    });

    const ids = new Set<string>();
    for (const r of rows) {
      ids.add(r.blockerId === userId ? r.blockedUserId : r.blockerId);
    }
    return ids;
  }

  // би блоклосон хэрэглэгчдийн жагсаалт (unblock хийхэд хэрэгтэй)
  async listBlockedByMe(
    blockerId: string,
  ): Promise<{ id: string; name: string }[]> {
    const rows = await this.blockedUserRepository.find({
      where: { blockerId },
      relations: { blockedUser: true },
    });
    return rows.map((r) => ({
      id: r.blockedUser.id,
      name: r.blockedUser.name,
    }));
  }
}

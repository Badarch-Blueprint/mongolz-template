import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entities.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async update(
    id: string,
    data: { name?: string; password?: string; currentPassword?: string },
  ): Promise<User | null> {
    const updateData: {
      name?: string;
      password?: string;
      currentPassword?: string;
    } = {
      name: data.name,
      password: data.password,
    };
    if (updateData.password) {
      const currentUser = await this.userRepository.findOne({ where: { id } });
      if (!currentUser) {
        throw new NotFoundException('Хэрэглэгч олдсонгүй');
      }

      const passwordMatch = await bcrypt.compare(
        data.currentPassword ?? '',
        currentUser.password,
      );

      if (!passwordMatch) {
        throw new UnauthorizedException('Нууц үг таарахгүй байна');
      }

      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    await this.userRepository.update(id, updateData);
    return this.userRepository.findOne({ where: { id } });
  }

  async setRefreshToken(userId: string, refreshToken: string | null) {
    await this.userRepository.update(userId, { refreshToken });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async incrementTokenVersion(userId: string): Promise<number> {
    const result = await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ tokenVersion: () => '"tokenVersion" + 1' })
      .where('id = :id', { id: userId })
      .returning('tokenVersion')
      .execute();

    return result.raw[0].tokenVersion;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async scheduleForDeletion(userId: string): Promise<Date> {
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 7);

    await this.userRepository.update(userId, {
      isPendingDeletion: true,
      deletionScheduledAt: deletionDate,
    });

    return deletionDate;
  }

  async cancelDeletion(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isPendingDeletion: false,
      deletionScheduledAt: null,
    });
  }

  async findAllPendingDeletion(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.isPendingDeletion = :pending', { pending: true })
      .andWhere('user.deletionScheduledAt <= :now', { now: new Date() })
      .getMany();
  }

  async hardDelete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async findChatList(
    excludeUserId: string,
  ): Promise<Pick<User, 'id' | 'name' | 'avatar'>[]> {
    return this.userRepository.find({
      where: { id: Not(excludeUserId), isPendingDeletion: false },
      select: { id: true, name: true, avatar: true },
      order: { name: 'ASC' },
    });
  }

  async updateAvatar(userId: string, avatarPath: string): Promise<void> {
    await this.userRepository.update(userId, { avatar: avatarPath });
  }
}

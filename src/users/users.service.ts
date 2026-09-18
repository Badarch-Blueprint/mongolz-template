import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async create(data: { email: string; password: string; name?: string }): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async update(id: string, data: { name?: string; password?: string }): Promise<User | null> {
    const updateData: { name?: string; password?: string } = { ...data };

    if (updateData.password) {
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
    .set({ tokenVersion: () => '"tokenVersion" + 1' })   // <- давхар хашилт нэмсэн
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
}
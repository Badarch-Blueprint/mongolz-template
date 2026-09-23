import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Or, And } from 'typeorm';
import { Message } from '../users/entities/message.entities.js';
import { PrivateMessage } from '../users/entities/private-message.entity.js';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(PrivateMessage)
    private readonly privateMessageRepository: Repository<PrivateMessage>,
  ) {}

  async create(data: {
    text: string;
    senderId: string;
    senderName: string;
  }): Promise<Message> {
    const message = this.messageRepository.create(data);
    return this.messageRepository.save(message);
  }

  async findRecent(limit: number): Promise<Message[]> {
    return this.messageRepository.find({
      order: { timestamp: 'ASC' },
      take: limit,
    });
  }

  async createPrivate(data: {
    text: string;
    senderId: string;
    senderName: string;
    toUserId: string;
  }): Promise<PrivateMessage> {
    const message = this.privateMessageRepository.create(data);
    return this.privateMessageRepository.save(message);
  }

  async findPrivateHistory(
    userId: string,
    limit = 200,
  ): Promise<PrivateMessage[]> {
    return this.privateMessageRepository
      .createQueryBuilder('msg')
      .where('msg.senderId = :userId OR msg.toUserId = :userId', { userId })
      .orderBy('msg.timestamp', 'ASC')
      .take(limit)
      .getMany();
  }
}

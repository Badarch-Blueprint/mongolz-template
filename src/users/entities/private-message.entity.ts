import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class PrivateMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  text: string;

  @Column()
  senderId: string;

  @Column()
  senderName: string;

  @Column()
  toUserId: string;

  @CreateDateColumn()
  timestamp: Date;
}

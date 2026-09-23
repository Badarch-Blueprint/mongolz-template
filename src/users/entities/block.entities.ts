import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entities.js';

@Entity()
@Unique(['blockerId', 'blockedUserId']) // нэг хосыг хоёр удаа блоклохоос сэргийлнэ
export class BlockedUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  blockerId: string; // блоклож буй хэрэглэгч

  @Index()
  @Column('uuid')
  blockedUserId: string; // блоклогдож буй хэрэглэгч

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockerId' })
  blocker: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockedUserId' })
  blockedUser: User;

  @CreateDateColumn()
  createdAt: Date;
}

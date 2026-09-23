import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  refreshToken: string | null;

  @Column({ type: 'int', default: 0 })
  tokenVersion: number;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ type: 'boolean', default: false })
  isPendingDeletion: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletionScheduledAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  avatar: string | null;
}

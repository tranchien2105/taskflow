import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';

export enum ProjectInvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity('project_invitations')
export class ProjectInvitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'project_id',
    type: 'uuid',
  })
  projectId!: string;

  @ManyToOne(() => Project)
  @JoinColumn({
    name: 'project_id',
  })
  project!: Project;

  @Column({
    name: 'invited_user_id',
    type: 'uuid',
  })
  invitedUserId!: string;

  @ManyToOne(() => User)
  @JoinColumn({
    name: 'invited_user_id',
  })
  invitedUser!: User;

  @Column({
    name: 'invited_by_user_id',
    type: 'uuid',
  })
  invitedByUserId!: string;

  @ManyToOne(() => User)
  @JoinColumn({
    name: 'invited_by_user_id',
  })
  invitedBy!: User;

  @Column({
    type: 'enum',
    enum: ProjectInvitationStatus,
    default: ProjectInvitationStatus.PENDING,
  })
  status!: ProjectInvitationStatus;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt!: Date;
}

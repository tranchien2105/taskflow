import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';

import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { TaskLabel } from '../../task-labels/entities/task-label.entity';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('tasks')
@Index('idx_tasks_project_id', ['projectId'])
@Index('idx_tasks_assignee_id', ['assigneeId'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'project_id',
    type: 'uuid',
  })
  projectId!: string;

  @ManyToOne(() => Project, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @OneToMany(() => TaskLabel, (taskLabel) => taskLabel.task)
  taskLabels!: TaskLabel[];

  @Column({
    type: 'varchar',
    length: 200,
  })
  title!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column({
    name: 'creator_id',
    type: 'uuid',
  })
  creatorId!: string;

  @ManyToOne(() => User, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'creator_id' })
  creator!: User;

  @Column({
    name: 'assignee_id',
    type: 'uuid',
    nullable: true,
  })
  assigneeId!: string | null;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'assignee_id' })
  assignee!: User | null;

  @Column({
    name: 'due_date',
    type: 'date',
    nullable: true,
  })
  dueDate!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

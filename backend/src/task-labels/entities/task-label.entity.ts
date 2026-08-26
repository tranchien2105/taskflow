import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Label } from '../../labels/entities/label.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('task_labels')
@Unique(['taskId', 'labelId'])
export class TaskLabel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'task_id',
    type: 'uuid',
  })
  taskId!: string;

  @ManyToOne(() => Task, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @Column({
    name: 'label_id',
    type: 'uuid',
  })
  labelId!: string;

  @ManyToOne(() => Label, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'label_id' })
  label!: Label;
}

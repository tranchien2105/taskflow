import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Project } from '../../projects/entities/project.entity';

@Entity('labels')
@Unique(['projectId', 'name'])
export class Label {
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

  @Column({
    type: 'varchar',
    length: 50,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 7,
  })
  color!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('activities')
export class ActivityEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'project_id', type: 'uuid' })
    projectId!: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId!: string;

    @Column({ type: 'varchar', length: 100 })
    action!: string;

    @Column({ name: 'entity_type', type: 'varchar', length: 50 })
    entityType!: string;

    @Column({ name: 'entity_id', type: 'uuid' })
    entityId!: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata!: Record<string, any> | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
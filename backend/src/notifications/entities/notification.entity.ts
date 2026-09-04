import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { NotificationType } from '../enums/notification-type.enum';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({
        name: 'user_id',
        type: 'uuid',
    })
    userId!: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type!: NotificationType;

    @Column()
    title!: string;

    @Column({
        type: 'text',
    })
    message!: string;

    @Column({
        name: 'entity_type',
        type: 'varchar',
        nullable: true,
    })
    entityType!: string | null;

    @Column({
        name: 'entity_id',
        type: 'uuid',
        nullable: true,
    })
    entityId!: string | null;

    @Column({
        name: 'is_read',
        default: false,
    })
    isRead!: boolean;

    @CreateDateColumn({
        name: 'created_at',
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: 'updated_at',
    })
    updatedAt!: Date;
}
import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum ProjectInvitationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
}

@Entity('project_invitations')
export class ProjectInvitation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'project_id', type: 'uuid' })
    projectId!: string;

    @Column({ name: 'invited_user_id', type: 'uuid' })
    invitedUserId!: string;

    @Column({ name: 'invited_by_user_id', type: 'uuid' })
    invitedByUserId!: string;

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
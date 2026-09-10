import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    EntityManager,
    Repository,
} from 'typeorm';

import { ActivityEntity } from './entities/activity.entity';

@Injectable()
export class ActivitiesService {
    constructor(
        @InjectRepository(ActivityEntity)
        private readonly activityRepository: Repository<ActivityEntity>,
    ) { }

    async create(
        data: {
            userId: string;
            action: string;
            entity: {
                id: string;
                projectId?: string;
                title?: string;
                name?: string;
            };
            projectId?: string;
            entityType: 'task' | 'project';
        },
        manager?: EntityManager,
    ): Promise<ActivityEntity> {
        const repository = manager
            ? manager.getRepository(ActivityEntity)
            : this.activityRepository;

        const projectId =
            data.projectId ?? data.entity.projectId ?? data.entity.id;

        const activity = repository.create({
            userId: data.userId,
            projectId,
            action: data.action,
            entityType: data.entityType,
            entityId: data.entity.id,
            metadata: {
                title: data.entity.title,
                name: data.entity.name,
            },
        });

        return repository.save(activity);
    }
}
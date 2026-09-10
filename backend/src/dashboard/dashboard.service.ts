import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ProjectMember } from '../project-members/entities/project-member.entity';

import {
    Task,
    TaskPriority,
    TaskStatus,
} from '../tasks/entities/task.entity';

import { ActivityEntity } from '../activities/entities/activity.entity';

import { User } from '../users/entities/user.entity';

import { PresenceService } from '../presence/presence.service';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepository: Repository<ProjectMember>,

        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,

        @InjectRepository(ActivityEntity)
        private readonly activityRepository: Repository<ActivityEntity>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        private readonly presenceService: PresenceService,
    ) { }

    async getDashboard(
        userId: string,
        role: string,
    ) {
        /**
         * 1. Get projects that user is a member of
         */
        const projectMembers =
            await this.projectMemberRepository.find({
                select: {
                    projectId: true,
                },
                where: {
                    userId,
                },
            });

        const projectIds = projectMembers.map(
            (member) => member.projectId,
        );

        /**
         * 2. Default dashboard data
         */
        const overview = {
            totalProjects: projectIds.length,
            totalTasks: 0,
            activeTasks: 0,
            completedTasks: 0,
            overdueTasks: 0,
        };

        const taskStatus = {
            TODO: 0,
            IN_PROGRESS: 0,
            REVIEW: 0,
            DONE: 0,
        };

        const priority = {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
            URGENT: 0,
        };

        const myWorkload = {
            assigned: 0,
            completed: 0,
        };

        /**
         * 3. Get task statistics
         */
        if (projectIds.length > 0) {
            const baseQuery = this.taskRepository
                .createQueryBuilder('task')
                .where(
                    'task.project_id IN (:...projectIds)',
                    {
                        projectIds,
                    },
                );

            /**
             * Total tasks
             */
            overview.totalTasks =
                await baseQuery
                    .clone()
                    .getCount();

            /**
             * Active tasks
             */
            overview.activeTasks =
                await baseQuery
                    .clone()
                    .andWhere(
                        'task.status = :status',
                        {
                            status: TaskStatus.IN_PROGRESS,
                        },
                    )
                    .getCount();

            /**
             * Completed tasks
             */
            overview.completedTasks =
                await baseQuery
                    .clone()
                    .andWhere(
                        'task.status = :status',
                        {
                            status: TaskStatus.DONE,
                        },
                    )
                    .getCount();

            /**
             * Overdue tasks
             */
            overview.overdueTasks =
                await baseQuery
                    .clone()
                    .andWhere(
                        'task.due_date < CURRENT_DATE',
                    )
                    .andWhere(
                        'task.status != :status',
                        {
                            status: TaskStatus.DONE,
                        },
                    )
                    .getCount();

            /**
             * Task status statistics
             */
            const statusResult =
                await baseQuery
                    .clone()
                    .select(
                        'task.status',
                        'status',
                    )
                    .addSelect(
                        'COUNT(task.id)',
                        'count',
                    )
                    .groupBy('task.status')
                    .getRawMany<{
                        status: TaskStatus;
                        count: string;
                    }>();

            for (const row of statusResult) {
                taskStatus[row.status] =
                    Number(row.count);
            }

            /**
             * Task priority statistics
             */
            const priorityResult =
                await baseQuery
                    .clone()
                    .select(
                        'task.priority',
                        'priority',
                    )
                    .addSelect(
                        'COUNT(task.id)',
                        'count',
                    )
                    .groupBy('task.priority')
                    .getRawMany<{
                        priority: TaskPriority;
                        count: string;
                    }>();

            for (const row of priorityResult) {
                priority[row.priority] =
                    Number(row.count);
            }

            /**
             * My assigned tasks
             */
            myWorkload.assigned =
                await baseQuery
                    .clone()
                    .andWhere(
                        'task.assignee_id = :userId',
                        { userId },
                    )
                    .getCount();

            /**
             * My completed tasks
             */
            myWorkload.completed =
                await baseQuery
                    .clone()
                    .andWhere(
                        'task.assignee_id = :userId',
                        { userId },
                    )
                    .andWhere(
                        'task.status = :status',
                        {
                            status: TaskStatus.DONE,
                        },
                    )
                    .getCount();
        }

        /**
         * 4. Normal dashboard
         */
        const dashboard = {
            overview,
            taskStatus,
            priority,
            myWorkload,
        };

        /**
         * 5. Admin dashboard
         */
        if (role === 'ADMIN') {
            /**
             * Online users
             */
            const onlineUserIds =
                this.presenceService.getOnlineUserIds();

            const onlineUsers =
                onlineUserIds.length > 0
                    ? await this.userRepository.find({
                        where: onlineUserIds.map(
                            (id) => ({ id }),
                        ),
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            role: true,
                        },
                    })
                    : [];

            /**
             * Latest activities
             */
            const recentActivities =
                await this.activityRepository.find({
                    order: {
                        createdAt: 'DESC',
                    },
                    take: 10,
                });

            /**
             * Get activity users
             */
            const activityUserIds = [
                ...new Set(
                    recentActivities.map(
                        (activity) => activity.userId,
                    ),
                ),
            ];

            const activityUsers =
                activityUserIds.length > 0
                    ? await this.userRepository.find({
                        where: activityUserIds.map(
                            (id) => ({ id }),
                        ),
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        },
                    })
                    : [];

            const activityUserMap =
                new Map(
                    activityUsers.map((user) => [
                        user.id,
                        user,
                    ]),
                );

            const activities =
                recentActivities.map(
                    (activity) => ({
                        id: activity.id,
                        userId: activity.userId,
                        action: activity.action,
                        entityType:
                            activity.entityType,
                        entityId:
                            activity.entityId,
                        metadata:
                            activity.metadata,
                        createdAt:
                            activity.createdAt,
                        user:
                            activityUserMap.get(
                                activity.userId,
                            ) ?? null,
                    }),
                );

            return {
                ...dashboard,

                onlineUsers,

                recentActivities: activities,
            };
        }

        /**
         * 6. Normal member dashboard
         */
        return dashboard;
    }
}
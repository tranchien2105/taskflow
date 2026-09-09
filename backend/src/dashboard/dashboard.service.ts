import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectMember } from '../project-members/entities/project-member.entity';
import {
    Task,
    TaskPriority,
    TaskStatus,
} from '../tasks/entities/task.entity';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(ProjectMember)
        private readonly projectMemberRepository: Repository<ProjectMember>,

        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
    ) {}

    async getDashboard(userId: string) {
        // 1. Lấy danh sách project mà user đang tham gia
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

        // User chưa tham gia project nào
        if (projectIds.length === 0) {
            return {
                overview: {
                    totalProjects: 0,
                    totalTasks: 0,
                    activeTasks: 0,
                    completedTasks: 0,
                    overdueTasks: 0,
                },

                taskStatus: {
                    TODO: 0,
                    IN_PROGRESS: 0,
                    REVIEW: 0,
                    DONE: 0,
                },

                priority: {
                    LOW: 0,
                    MEDIUM: 0,
                    HIGH: 0,
                    URGENT: 0,
                },

                myWorkload: {
                    assigned: 0,
                    completed: 0,
                },
            };
        }

        // 2. Query tất cả task thuộc những project user tham gia
        const baseQuery = this.taskRepository
            .createQueryBuilder('task')
            .where(
                'task.project_id IN (:...projectIds)',
                {
                    projectIds,
                },
            );

        // 3. Tổng số task
        const totalTasks = await baseQuery
            .clone()
            .getCount();

        // 4. Task đang làm
        const activeTasks = await baseQuery
            .clone()
            .andWhere(
                'task.status = :status',
                {
                    status: TaskStatus.IN_PROGRESS,
                },
            )
            .getCount();

        // 5. Task hoàn thành
        const completedTasks = await baseQuery
            .clone()
            .andWhere(
                'task.status = :status',
                {
                    status: TaskStatus.DONE,
                },
            )
            .getCount();

        // 6. Task quá hạn
        const overdueTasks = await baseQuery
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

        // 7. Thống kê theo status
        const statusResult = await baseQuery
            .clone()
            .select('task.status', 'status')
            .addSelect('COUNT(task.id)', 'count')
            .groupBy('task.status')
            .getRawMany<{
                status: TaskStatus;
                count: string;
            }>();

        const taskStatus = {
            TODO: 0,
            IN_PROGRESS: 0,
            REVIEW: 0,
            DONE: 0,
        };

        for (const row of statusResult) {
            taskStatus[row.status] = Number(row.count);
        }

        // 8. Thống kê theo priority
        const priorityResult = await baseQuery
            .clone()
            .select('task.priority', 'priority')
            .addSelect('COUNT(task.id)', 'count')
            .groupBy('task.priority')
            .getRawMany<{
                priority: TaskPriority;
                count: string;
            }>();

        const priority = {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
            URGENT: 0,
        };

        for (const row of priorityResult) {
            priority[row.priority] = Number(row.count);
        }

        // 9. Tổng số task được giao cho user hiện tại
        const assigned = await baseQuery
            .clone()
            .andWhere(
                'task.assignee_id = :userId',
                { userId },
            )
            .getCount();

        // 10. Số task user đã hoàn thành
        const myCompleted = await baseQuery
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

        // 11. Trả dashboard data
        return {
            overview: {
                totalProjects: projectIds.length,
                totalTasks,
                activeTasks,
                completedTasks,
                overdueTasks,
            },

            taskStatus,

            priority,

            myWorkload: {
                assigned,
                completed: myCompleted,
            },
        };
    }
}

import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';

import { ProjectMembersService } from '../project-members/project-members.service';
import { ProjectMemberRole } from '../project-members/entities/project-member.entity';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,

        private readonly projectMembersService: ProjectMembersService,
    ) { }

    async create(
        createTaskDto: CreateTaskDto,
        creatorId: string,
    ): Promise<Task> {
        const isMember =
            await this.projectMembersService.isMember(
                createTaskDto.projectId,
                creatorId,
            );

        if (!isMember) {
            throw new ForbiddenException(
                'You are not a member of this project',
            );
        }

        if (createTaskDto.assigneeId) {
            const isAssigneeMember =
                await this.projectMembersService.isMember(
                    createTaskDto.projectId,
                    createTaskDto.assigneeId,
                );

            if (!isAssigneeMember) {
                throw new ForbiddenException(
                    'Assignee must be a member of this project',
                );
            }
        }

        const task = this.taskRepository.create({
            ...createTaskDto,
            creatorId,
        });

        return this.taskRepository.save(task);
    }

    async findAll(
        query: TaskQueryDto,
        userId: string,
    ) {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            priority,
            projectId,
            assigneeId,
        } = query;

        const skip = (page - 1) * limit;

        const queryBuilder = this.taskRepository
            .createQueryBuilder('task')
            .leftJoinAndSelect(
                'task.project',
                'project',
            )
            .leftJoinAndSelect(
                'task.creator',
                'creator',
            )
            .leftJoinAndSelect(
                'task.assignee',
                'assignee',
            )
            .innerJoin(
                'project_members',
                'projectMember',
                'projectMember.project_id = task.project_id',
            )
            .andWhere(
                'projectMember.user_id = :userId',
                { userId },
            );

        if (search) {
            queryBuilder.andWhere(
                '(task.title ILIKE :search OR task.description ILIKE :search)',
                {
                    search: `%${search}%`,
                },
            );
        }

        if (status) {
            queryBuilder.andWhere(
                'task.status = :status',
                { status },
            );
        }

        if (priority) {
            queryBuilder.andWhere(
                'task.priority = :priority',
                { priority },
            );
        }

        if (projectId) {
            queryBuilder.andWhere(
                'task.projectId = :projectId',
                { projectId },
            );
        }

        if (assigneeId) {
            queryBuilder.andWhere(
                'task.assigneeId = :assigneeId',
                { assigneeId },
            );
        }

        const [data, total] =
            await queryBuilder
                .orderBy(
                    'task.createdAt',
                    'DESC',
                )
                .skip(skip)
                .take(limit)
                .getManyAndCount();

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(
                    total / limit,
                ),
            },
        };
    }

    async findOne(
        id: string,
        userId: string,
    ): Promise<Task> {
        const task =
            await this.findOneWithoutAuth(id);

        const isMember =
            await this.projectMembersService.isMember(
                task.projectId,
                userId,
            );

        if (!isMember) {
            throw new ForbiddenException(
                'You do not have access to this task',
            );
        }

        return task;
    }

    async update(
        id: string,
        updateTaskDto: UpdateTaskDto,
        userId: string,
    ): Promise<Task> {
        const task = await this.findOne(
            id,
            userId,
        );

        const role =
            await this.projectMembersService.getRole(
                task.projectId,
                userId,
            );

        // Chỉ Manager được thay đổi assignee
        if (
            updateTaskDto.assigneeId !== undefined &&
            role !== ProjectMemberRole.MANAGER
        ) {
            throw new ForbiddenException(
                'Only project managers can change task assignee',
            );
        }

        // Assignee mới phải thuộc Project
        if (
            updateTaskDto.assigneeId !== undefined
        ) {
            const isAssigneeMember =
                await this.projectMembersService.isMember(
                    task.projectId,
                    updateTaskDto.assigneeId,
                );

            if (!isAssigneeMember) {
                throw new ForbiddenException(
                    'Assignee must be a member of this project',
                );
            }
        }

        Object.assign(
            task,
            updateTaskDto,
        );

        return this.taskRepository.save(task);
    }

    async remove(
        id: string,
        userId: string,
    ): Promise<{ message: string }> {
        const task = await this.findOne(
            id,
            userId,
        );

        await this.taskRepository.remove(task);

        return {
            message: 'Task deleted successfully',
        };
    }

    async findOneWithoutAuth(
        id: string,
    ): Promise<Task> {
        const task =
            await this.taskRepository.findOne({
                where: { id },
                relations: {
                    project: true,
                    creator: true,
                    assignee: true,
                },
            });

        if (!task) {
            throw new NotFoundException(
                'Task not found',
            );
        }

        return task;
    }
}
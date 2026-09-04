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
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    private readonly projectMembersService: ProjectMembersService,

    private readonly notificationsService: NotificationsService,
  ) { }

  async create(createTaskDto: CreateTaskDto, creatorId: string): Promise<Task> {
    const isMember = await this.projectMembersService.isMember(
      createTaskDto.projectId,
      creatorId,
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (createTaskDto.assigneeId) {
      const isAssigneeMember = await this.projectMembersService.isMember(
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

  async findAll(query: TaskQueryDto, userId: string) {
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
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .innerJoin(
        'project_members',
        'projectMember',
        'projectMember.project_id = task.project_id',
      )
      .andWhere('projectMember.user_id = :userId', { userId });

    if (search) {
      queryBuilder.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    if (projectId) {
      queryBuilder.andWhere('task.projectId = :projectId', { projectId });
    }

    if (assigneeId) {
      queryBuilder.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }

    const [data, total] = await queryBuilder
      .orderBy('task.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.findOneWithoutAuth(id);

    const isMember = await this.projectMembersService.isMember(
      task.projectId,
      userId,
    );

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<Task> {
    const task = await this.findOne(id, userId);

    const role = await this.projectMembersService.getRole(
      task.projectId,
      userId,
    );

    // Only Manager can change task assignee
    if (
      updateTaskDto.assigneeId !== undefined &&
      role !== ProjectMemberRole.MANAGER
    ) {
      throw new ForbiddenException(
        'Only project managers can change task assignee',
      );
    }

    const newAssigneeId = updateTaskDto.assigneeId;

    // Assignee must be a member of the project
    // null means unassign
    if (newAssigneeId !== undefined && newAssigneeId !== null) {
      const isAssigneeMember =
        await this.projectMembersService.isMember(
          task.projectId,
          newAssigneeId,
        );

      if (!isAssigneeMember) {
        throw new ForbiddenException(
          'Assignee must be a member of this project',
        );
      }
    }

    const previousAssigneeId = task.assigneeId;

    Object.assign(task, updateTaskDto);

    const updatedTask = await this.taskRepository.save(task);

    // Assignee changed
    if (
      newAssigneeId !== undefined &&
      previousAssigneeId !== newAssigneeId
    ) {
      // Notify previous assignee
      if (previousAssigneeId) {
        await this.notificationsService.create({
          userId: previousAssigneeId,
          type: NotificationType.TASK_UNASSIGNED,
          title: 'Task đã được gỡ khỏi bạn',
          message: `Task "${updatedTask.title}" không còn được giao cho bạn`,
          entityType: 'task',
          entityId: updatedTask.id,
        });
      }

      // Notify new assignee
      if (newAssigneeId) {
        await this.notificationsService.create({
          userId: newAssigneeId,
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task mới được giao',
          message: `Bạn được giao task "${updatedTask.title}"`,
          entityType: 'task',
          entityId: updatedTask.id,
        });
      }
    }

    return updatedTask;
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const task = await this.findOne(id, userId);

    await this.taskRepository.remove(task);

    return {
      message: 'Task deleted successfully',
    };
  }

  async findOneWithoutAuth(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: {
        project: true,
        creator: true,
        assignee: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }
}

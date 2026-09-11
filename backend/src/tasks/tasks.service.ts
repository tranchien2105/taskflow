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
import { ActivitiesService } from '../activities/activities.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    private readonly projectMembersService: ProjectMembersService,

    private readonly notificationsService: NotificationsService,

    private readonly activitiesService: ActivitiesService,

    private readonly elasticsearchService: ElasticsearchService,
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

    const createdTask =
      await this.taskRepository.save(task);

    await this.activitiesService.create({
      userId: creatorId,
      action: 'TASK_CREATED',
      entity: createdTask,
      entityType: 'task',
    });

    if (createdTask.assigneeId) {
      await this.notifyTaskAssigned(createdTask);

      await this.activitiesService.create({
        userId: creatorId,
        action: 'TASK_ASSIGNED',
        entity: createdTask,
        entityType: 'task',
      });
    }

    return createdTask;
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
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .innerJoin(
        'project_members',
        'projectMember',
        'projectMember.project_id = task.project_id',
      )
      .andWhere(
        'projectMember.user_id = :userId',
        {
          userId,
        },
      );

    /*
     * Nếu có search:
     * Elasticsearch sẽ tìm kiếm title + description
     * và trả về danh sách task ID.
     *
     * PostgreSQL vẫn chịu trách nhiệm:
     * - Authorization
     * - Relations
     * - Các filter còn lại
     * - Lấy dữ liệu Task đầy đủ
     */
    let searchTaskIds: string[] | undefined;

    if (search) {
      const searchResult =
        await this.elasticsearchService.search(
          'tasks',
          search,
          status,
          priority,
          page,
          limit,
        );

      searchTaskIds = searchResult.data.map(
        (task) => task.id,
      );

      /*
       * Elasticsearch không tìm thấy task nào.
       */
      if (searchTaskIds.length === 0) {
        return {
          data: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      /*
       * Chỉ lấy những Task ID mà Elasticsearch tìm thấy.
       */
      queryBuilder.andWhere(
        'task.id IN (:...searchTaskIds)',
        {
          searchTaskIds,
        },
      );
    }

    if (status) {
      queryBuilder.andWhere(
        'task.status = :status',
        {
          status,
        },
      );
    }

    if (priority) {
      queryBuilder.andWhere(
        'task.priority = :priority',
        {
          priority,
        },
      );
    }

    if (projectId) {
      queryBuilder.andWhere(
        'task.projectId = :projectId',
        {
          projectId,
        },
      );
    }

    if (assigneeId) {
      queryBuilder.andWhere(
        'task.assigneeId = :assigneeId',
        {
          assigneeId,
        },
      );
    }

    /*
     * Khi search bằng Elasticsearch:
     *
     * Elasticsearch đã pagination bằng:
     * from + size
     *
     * nên PostgreSQL KHÔNG được skip/take lần nữa.
     */
    if (search) {
      const [data, total] =
        await queryBuilder
          .orderBy('task.createdAt', 'DESC')
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

    /*
     * Không search:
     * PostgreSQL xử lý pagination như trước.
     */
    const [data, total] =
      await queryBuilder
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
    const task =
      await this.findOne(id, userId);

    const role =
      await this.projectMembersService.getRole(
        task.projectId,
        userId,
      );

    if (
      updateTaskDto.assigneeId !== undefined &&
      role !== ProjectMemberRole.MANAGER
    ) {
      throw new ForbiddenException(
        'Only project managers can change task assignee',
      );
    }

    const newAssigneeId =
      updateTaskDto.assigneeId;

    if (
      newAssigneeId !== undefined &&
      newAssigneeId !== null
    ) {
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

    const previousAssigneeId =
      task.assigneeId;

    Object.assign(
      task,
      updateTaskDto,
    );

    const updatedTask =
      await this.taskRepository.save(task);

    await this.activitiesService.create({
      userId,
      action: 'TASK_UPDATED',
      entity: updatedTask,
      entityType: 'task',
    });

    if (
      newAssigneeId !== undefined &&
      previousAssigneeId !== newAssigneeId
    ) {
      if (previousAssigneeId) {
        await this.notifyTaskUnassigned(
          updatedTask,
          previousAssigneeId,
        );

        await this.activitiesService.create({
          userId,
          action: 'TASK_UNASSIGNED',
          entity: updatedTask,
          entityType: 'task',
        });
      }

      if (newAssigneeId) {
        await this.notifyTaskAssigned(
          updatedTask,
        );

        await this.activitiesService.create({
          userId,
          action: 'TASK_ASSIGNED',
          entity: updatedTask,
          entityType: 'task',
        });
      }
    }

    return updatedTask;
  }

  async remove(
    id: string,
    userId: string,
  ): Promise<{ message: string }> {
    const task =
      await this.findOne(id, userId);

    await this.taskRepository.remove(task);

    await this.activitiesService.create({
      userId,
      action: 'TASK_DELETED',
      entity: task,
      entityType: 'task',
    });

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

  /**
   * Send notification when a task is assigned to a user.
   */
  private async notifyTaskAssigned(
    task: Task,
  ): Promise<void> {
    if (!task.assigneeId) {
      return;
    }

    await this.notificationsService.create({
      userId: task.assigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'Task mới được giao',
      message: `Bạn được giao task "${task.title}"`,
      entityType: 'task',
      entityId: task.id,
    });
  }

  /**
   * Send notification when a task is unassigned from a user.
   */
  private async notifyTaskUnassigned(
    task: Task,
    previousAssigneeId: string,
  ): Promise<void> {
    await this.notificationsService.create({
      userId: previousAssigneeId,
      type: NotificationType.TASK_UNASSIGNED,
      title: 'Task đã được gỡ khỏi bạn',
      message: `Task "${task.title}" không còn được giao cho bạn`,
      entityType: 'task',
      entityId: task.id,
    });
  }

  async reindexToElasticsearch() {
    const tasks =
      await this.taskRepository.find();

    await this.elasticsearchService.bulkIndex(
      'tasks',
      tasks.map((task) => ({
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        creatorId: task.creatorId,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })),
    );

    return {
      indexed: tasks.length,
    };
  }

  async search(
    keyword?: string,
    status?: string,
    priority?: string,
    page = 1,
    limit = 10,
  ) {
    const result =
      await this.elasticsearchService.search(
        'tasks',
        keyword,
        status,
        priority,
        page,
        limit,
      );

    return {
      data: result.data,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(
          result.total / limit,
        ),
      },
    };
  }
}
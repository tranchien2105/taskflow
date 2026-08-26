import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { ProjectMemberRole } from '../project-members/entities/project-member.entity';
import { ProjectMembersService } from '../project-members/project-members.service';

describe('TasksService', () => {
  let service: TasksService;

  let taskRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };

  let projectMembersService: {
    isMember: jest.Mock;
    getRole: jest.Mock;
  };

  beforeEach(async () => {
    // Mock Task Repository
    taskRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    // Mock ProjectMembersService
    projectMembersService = {
      isMember: jest.fn(),
      getRole: jest.fn(),
    };

    // Create TestingModule
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: taskRepository,
        },
        {
          provide: ProjectMembersService,
          useValue: projectMembersService,
        },
      ],
    }).compile();

    // Lấy TasksService thật
    service = module.get<TasksService>(TasksService);
  });

  // =====================================================
  // CREATE
  // =====================================================

  it('should create task successfully', async () => {
    // Arrange
    const dto = {
      projectId: 'project-1',
      title: 'Learn Unit Test',
      description: 'Practice Jest',
    };

    const creatorId = 'user-1';

    const createdTask = {
      id: 'task-1',
      ...dto,
      creatorId,
    };

    // Creator là member
    projectMembersService.isMember.mockResolvedValue(true);

    // Giả lập repository.create()
    taskRepository.create.mockReturnValue(createdTask);

    // Giả lập repository.save()
    taskRepository.save.mockResolvedValue(createdTask);

    // Act
    const result = await service.create(dto, creatorId);

    // Assert
    expect(result).toEqual(createdTask);
  });

  it('should reject when creator is not a project member', async () => {
    // Arrange
    const dto = {
      projectId: 'project-1',
      title: 'Learn Unit Test',
    };

    const creatorId = 'user-1';

    // Creator KHÔNG phải member
    projectMembersService.isMember.mockResolvedValue(false);

    // Act + Assert
    await expect(service.create(dto, creatorId)).rejects.toThrow(
      'You are not a member of this project',
    );
  });

  it('should reject when assignee is not a project member', async () => {
    // Arrange
    const dto = {
      projectId: 'project-1',
      title: 'Learn Unit Test',
      assigneeId: 'user-2',
    };

    const creatorId = 'user-1';

    // Lần 1:
    // Creator là member
    projectMembersService.isMember.mockResolvedValueOnce(true);

    // Lần 2:
    // Assignee KHÔNG phải member
    projectMembersService.isMember.mockResolvedValueOnce(false);

    // Act + Assert
    await expect(service.create(dto, creatorId)).rejects.toThrow(
      'Assignee must be a member of this project',
    );
  });

  // =====================================================
  // UPDATE
  // =====================================================

  it('should allow manager to change assignee', async () => {
    // Arrange
    const task = {
      id: 'task-1',
      projectId: 'project-1',
      title: 'Learn Unit Test',
      creatorId: 'user-1',
      assigneeId: 'user-2',
    };

    const updateDto = {
      assigneeId: 'user-3',
    };

    const userId = 'user-1';

    // update() gọi findOne()
    // Mock để không cần truy cập DB thật
    jest.spyOn(service, 'findOne').mockResolvedValue(task as Task);

    // User là Manager
    projectMembersService.getRole.mockResolvedValue(ProjectMemberRole.MANAGER);

    // Assignee mới thuộc project
    projectMembersService.isMember.mockResolvedValue(true);

    // Giả lập save()
    taskRepository.save.mockResolvedValue({
      ...task,
      ...updateDto,
    });

    // Act
    const result = await service.update(task.id, updateDto, userId);

    // Assert
    expect(result).toEqual({
      ...task,
      ...updateDto,
    });
  });
});

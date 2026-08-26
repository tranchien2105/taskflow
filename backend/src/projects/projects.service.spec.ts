import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { ProjectPriority, ProjectStatus } from './entities/project.entity';

import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const projectsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const projectMembersService = {
    create: jest.fn(),
    isMember: jest.fn(),
  };

  const usersRepository = {
    findOne: jest.fn(),
  };

  const manager = {
    getRepository: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(),
  };

  const redisService = {
    deleteByPattern: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ProjectsService(
      projectsRepository as any,
      projectMembersService as any,
      usersRepository as any,
      dataSource as any,
      redisService as any,
    );
  });

  describe('create', () => {
    // Case 1
    it('should throw NotFoundException when owner does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          {
            name: 'Test Project',
            slug: 'test-project',
            description: 'Testing project',
            status: ProjectStatus.PLANNING,
            priority: ProjectPriority.MEDIUM,
            startDate: '2026-08-21',
            dueDate: '2026-12-31',
          } as any,
          'non-existing-user-id',
        ),
      ).rejects.toThrow(NotFoundException);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'non-existing-user-id',
        },
      });

      expect(projectsRepository.save).not.toHaveBeenCalled();
    });

    // Case 2
    it('should throw ConflictException when project slug already exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 'owner-id',
      });

      projectsRepository.findOne.mockResolvedValue({
        id: 'existing-project-id',
        slug: 'test-project',
      });

      await expect(
        service.create(
          {
            name: 'Test Project',
            slug: 'test-project',
            description: 'Testing project',
            status: ProjectStatus.PLANNING,
            priority: ProjectPriority.MEDIUM,
            startDate: '2026-08-21',
            dueDate: '2026-12-31',
          } as any,
          'owner-id',
        ),
      ).rejects.toThrow(ConflictException);

      expect(projectsRepository.findOne).toHaveBeenCalledWith({
        where: {
          slug: 'test-project',
        },
      });

      expect(projectsRepository.save).not.toHaveBeenCalled();

      expect(projectMembersService.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    // Case 4
    it('should throw NotFoundException when project does not exist', async () => {
      projectsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('non-existing-project-id', 'user-id'),
      ).rejects.toThrow(NotFoundException);

      expect(projectsRepository.findOne).toHaveBeenCalled();
    });

    // Case 5
    it('should throw ForbiddenException when user has no access to project', async () => {
      const project = {
        id: 'project-id',
        ownerId: 'owner-id',
      };

      projectsRepository.findOne.mockResolvedValue(project);

      // User không phải owner và không phải member
      projectMembersService.isMember.mockResolvedValue(false);

      await expect(
        service.findOne('project-id', 'other-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    // Case 6
    it('should return project when user has access', async () => {
      const project = {
        id: 'project-id',
        ownerId: 'owner-id',
        name: 'Test Project',
      };

      projectsRepository.findOne.mockResolvedValue(project);

      // User là member của project
      projectMembersService.isMember.mockResolvedValue(true);

      const result = await service.findOne('project-id', 'user-id');

      expect(result).toEqual(project);
    });
  });
});

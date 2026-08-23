import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  ProjectPriority,
  ProjectStatus,
} from './entities/project.entity';

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
    it(
      'should throw NotFoundException when owner does not exist',
      async () => {
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

        expect(
          usersRepository.findOne,
        ).toHaveBeenCalledWith({
          where: {
            id: 'non-existing-user-id',
          },
        });

        expect(
          projectsRepository.save,
        ).not.toHaveBeenCalled();
      },
    );

    // Case 2
    it(
      'should throw ConflictException when project slug already exists',
      async () => {
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

        expect(
          projectsRepository.findOne,
        ).toHaveBeenCalledWith({
          where: {
            slug: 'test-project',
          },
        });

        expect(
          projectsRepository.save,
        ).not.toHaveBeenCalled();

        expect(
          projectMembersService.create,
        ).not.toHaveBeenCalled();
      },
    );

    // Case 3
    it(
      'should create project and assign owner as manager',
      async () => {
        const owner = {
          id: 'owner-id',
        };

        const project = {
          id: 'project-id',
          name: 'Test Project',
          slug: 'test-project',
          description: 'Testing project',
          status: ProjectStatus.PLANNING,
          priority: ProjectPriority.MEDIUM,
          startDate: '2026-08-21',
          dueDate: '2026-12-31',
          ownerId: 'owner-id',
        };

        const projectRepository = {
          create: jest.fn().mockReturnValue(project),
          save: jest.fn().mockResolvedValue(project),
        };

        manager.getRepository.mockReturnValue(
          projectRepository,
        );

        dataSource.transaction.mockImplementation(
          async (callback) => {
            return callback(manager);
          },
        );

        usersRepository.findOne.mockResolvedValue(
          owner,
        );

        projectsRepository.findOne.mockResolvedValue(
          null,
        );

        projectMembersService.create.mockResolvedValue({
          id: 'member-id',
          projectId: 'project-id',
          userId: 'owner-id',
          role: 'MANAGER',
        });

        redisService.deleteByPattern.mockResolvedValue(
          undefined,
        );

        const result = await service.create(
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
        );

        expect(result).toEqual(project);

        expect(
          dataSource.transaction,
        ).toHaveBeenCalled();

        expect(
          manager.getRepository,
        ).toHaveBeenCalled();

        expect(
          projectRepository.create,
        ).toHaveBeenCalledWith({
          name: 'Test Project',
          slug: 'test-project',
          description: 'Testing project',
          status: ProjectStatus.PLANNING,
          priority: ProjectPriority.MEDIUM,
          startDate: '2026-08-21',
          dueDate: '2026-12-31',
          ownerId: 'owner-id',
        });

        expect(
          projectRepository.save,
        ).toHaveBeenCalledWith(project);

        expect(
          projectMembersService.create,
        ).toHaveBeenCalledWith(
          'project-id',
          {
            userId: 'owner-id',
          },
          'MANAGER',
          manager,
        );

        expect(
          redisService.deleteByPattern,
        ).toHaveBeenCalledWith(
          'projects:*',
        );
      },
    );
  });

  describe('findOne', () => {
    // Case 4
    it(
      'should throw NotFoundException when project does not exist',
      async () => {
        projectsRepository.findOne.mockResolvedValue(
          null,
        );

        await expect(
          service.findOne(
            'non-existing-project-id',
            'user-id',
          ),
        ).rejects.toThrow(NotFoundException);

        expect(
          projectsRepository.findOne,
        ).toHaveBeenCalled();

      },
    );

    // Case 5
    it(
      'should throw ForbiddenException when user has no access to project',
      async () => {
        const project = {
          id: 'project-id',
          ownerId: 'owner-id',
        };

        projectsRepository.findOne.mockResolvedValue(
          project,
        );

        // Giả lập user không phải owner/member
        projectMembersService.findOne = jest
          .fn()
          .mockResolvedValue(null);

        await expect(
          service.findOne(
            'project-id',
            'other-user-id',
          ),
        ).rejects.toThrow(ForbiddenException);
      },
    );

    // Case 6
    it(
      'should return project when user has access',
      async () => {
        const project = {
          id: 'project-id',
          ownerId: 'owner-id',
          name: 'Test Project',
        };

        projectsRepository.findOne.mockResolvedValue(
          project,
        );

        projectMembersService.findOne = jest
          .fn()
          .mockResolvedValue({
            projectId: 'project-id',
            userId: 'user-id',
            role: 'MEMBER',
          });

        const result = await service.findOne(
          'project-id',
          'user-id',
        );

        expect(result).toEqual(project);
      },
    );
  });
});
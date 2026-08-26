import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Project } from './entities/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { User } from '../users/entities/user.entity';
import { ProjectMembersModule } from '../project-members/project-members.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project, User]), ProjectMembersModule],

  controllers: [ProjectsController],

  providers: [ProjectsService],

  exports: [ProjectsService],
})
export class ProjectsModule {}

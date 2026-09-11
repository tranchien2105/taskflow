import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';

import { ProjectMembersModule } from '../project-members/project-members.module';
import { TaskAccessGuard } from '../task-access/task-access.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivitiesModule } from '../activities/activities.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    ProjectMembersModule,
    NotificationsModule,
    ActivitiesModule,
    ElasticsearchModule,
  ],
  controllers: [TasksController],
  providers: [
    TasksService,
    TaskAccessGuard,
  ],
  exports: [TasksService],
})
export class TasksModule { }
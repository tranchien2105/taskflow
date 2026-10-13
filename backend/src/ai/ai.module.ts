
import { Module } from '@nestjs/common';

import { TasksModule } from '../tasks/tasks.module';
import { ProjectsModule } from '../projects/projects.module';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';

import { TaskQueryHandler } from './handlers/task-query.handler';
import { ProjectQueryHandler } from './handlers/project-query.handler';
import { ProjectCreateHandler } from './handlers/project-create.handler';
import { TaskCreateHandler } from './handlers/task-create.handler';

import { OllamaService } from './services/ollama.service';

@Module({
  imports: [
    TasksModule,
    ProjectsModule,
  ],
  controllers: [
    AiController,
  ],
  providers: [
    AiService,
    TaskQueryHandler,
    ProjectQueryHandler,
    ProjectCreateHandler,
    TaskCreateHandler,
    OllamaService,
  ],
})
export class AiModule { }

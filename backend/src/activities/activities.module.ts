import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { ActivityEntity } from './entities/activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityEntity])
  ],

  controllers: [
    ActivitiesController,
  ],

  providers: [
    ActivitiesService,
  ],

  exports: [
    ActivitiesService,
  ],
})
export class ActivitiesModule { }
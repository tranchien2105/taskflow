import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { ProjectMembersModule } from './project-members/project-members.module';
import { TasksModule } from './tasks/tasks.module';
import { LabelsModule } from './labels/labels.module';
import { TaskLabelsModule } from './task-labels/task-labels.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RequestIdMiddleware } from './common/request-id/request-id.middleware';
import { RedisModule } from './redis/redis.module';
import { ProjectInvitationsModule } from './project-invitations/project-invitations.module';
import { PresenceModule } from './presence/presence.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,

      autoLoadEntities: true,

      synchronize: false,
    }),

    UsersModule,

    ProjectsModule,

    ProjectMembersModule,

    TasksModule,

    LabelsModule,

    TaskLabelsModule,

    AuthModule,

    RedisModule,

    ProjectInvitationsModule,

    PresenceModule,

    NotificationsModule,
  ],

  controllers: [AppController],

  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    AppService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

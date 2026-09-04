import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification]),
        AuthModule,
    ],
    controllers: [
        NotificationsController,
    ],
    providers: [
        NotificationsService,
        NotificationsGateway,
    ],
    exports: [
        NotificationsService,
    ],
})
export class NotificationsModule {}

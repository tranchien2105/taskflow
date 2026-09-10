import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,

        private readonly notificationsGateway: NotificationsGateway,
    ) { }

    async create(
        createNotificationDto: CreateNotificationDto,
    ): Promise<Notification> {
        const notification =
            this.notificationRepository.create({
                userId: createNotificationDto.userId,
                type: createNotificationDto.type,
                title: createNotificationDto.title,
                message: createNotificationDto.message,
                entityType:
                    createNotificationDto.entityType ?? null,
                entityId:
                    createNotificationDto.entityId ?? null,
            });

        const savedNotification =
            await this.notificationRepository.save(
                notification,
            );

        this.notificationsGateway.emitNotification(
            savedNotification.userId,
            savedNotification,
        );

        return savedNotification;
    }

    async findAll(
        query: GetNotificationsDto,
        userId: string,
    ) {
        const { page, limit } = query;

        const [notifications, total] =
            await this.notificationRepository.findAndCount({
                where: {
                    userId,
                },
                order: {
                    createdAt: 'DESC',
                },
                skip: (page - 1) * limit,
                take: limit,
            });

        return {
            data: notifications,
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

    async markAsRead(
        id: string,
        userId: string,
    ): Promise<Notification> {
        const notification =
            await this.notificationRepository.findOne({
                where: {
                    id,
                    userId,
                },
            });

        if (!notification) {
            throw new NotFoundException(
                'Notification not found',
            );
        }

        if (!notification.isRead) {
            notification.isRead = true;

            await this.notificationRepository.save(
                notification,
            );
        }

        return notification;
    }

    async markAllAsRead(
        userId: string,
    ): Promise<{ message: string }> {
        await this.notificationRepository.update(
            {
                userId,
                isRead: false,
            },
            {
                isRead: true,
            },
        );

        return {
            message:
                'All notifications marked as read',
        };
    }
}
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { ProjectInvitationEmailProcessor } from './project-invitation-email.processor';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST,
                port: Number(process.env.REDIS_PORT),
            },
        }),

        BullModule.registerQueue({
            name: 'project-invitation-email',
        }),

        MailModule,
    ],

    providers: [
        ProjectInvitationEmailProcessor,
    ],
})
export class QueuesModule { }
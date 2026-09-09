import {
    Controller,
    Get,
} from '@nestjs/common';

import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
    constructor(
        private readonly mailService: MailService,
    ) {}

    @Get('test')
    async testMail() {
        await this.mailService.sendMail(
            'test@taskflow.local',
            'TaskFlow Test Email',
            `
                <h1>Hello from TaskFlow 🚀</h1>

                <p>
                    This email was sent from
                    <strong>NestJS</strong>
                    through
                    <strong>Mailpit</strong>.
                </p>

                <p>
                    SMTP is working correctly.
                </p>
            `,
        );

        return {
            message: 'Test email sent successfully',
        };
    }
}

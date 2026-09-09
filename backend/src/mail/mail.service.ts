import { Injectable } from '@nestjs/common';

import * as nodemailer from 'nodemailer';

import {
    ProjectInvitationEmailData,
    projectInvitationTemplate,
} from './templates/project-invitation.template';

@Injectable()
export class MailService {
    private readonly transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT),
            secure: false,
            auth: undefined,
        });
    }

    async sendMail(
        to: string,
        subject: string,
        html: string,
    ): Promise<void> {
        await this.transporter.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject,
            html,
        });
    }

    async sendProjectInvitationEmail(
        data: ProjectInvitationEmailData,
    ): Promise<void> {
        await this.sendMail(
            data.invitedUserEmail,
            `You've been invited to ${data.projectName}`,
            projectInvitationTemplate(data),
        );
    }
}


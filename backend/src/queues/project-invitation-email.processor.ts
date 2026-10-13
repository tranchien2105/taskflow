import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { MailService } from '../mail/mail.service';

@Processor('project-invitation-email')
export class ProjectInvitationEmailProcessor extends WorkerHost {
  constructor(
    private readonly mailService: MailService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {

    await this.mailService.sendProjectInvitationEmail(
      job.data,
    );
  }
}
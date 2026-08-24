import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PresenceGateway } from './presence.gateway';
import { PresenceService } from './presence.service';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET,
        }),
    ],
    providers: [
        PresenceGateway,
        PresenceService,
    ],
    exports: [
        PresenceService,
    ],
})
export class PresenceModule {}
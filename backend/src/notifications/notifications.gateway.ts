import {
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

import { Notification } from './entities/notification.entity';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

type SocketData = {
    userId?: string;
};

type AuthenticatedSocket = Socket<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    SocketData
>;

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:3001',
        credentials: true,
    },
})
export class NotificationsGateway {
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly jwtService: JwtService,
    ) { }

    handleConnection(socket: AuthenticatedSocket) {
        try {
            const token: unknown =
                socket.handshake.auth?.token;

            if (typeof token !== 'string' || !token) {
                socket.disconnect();
                return;
            }

            const payload =
                this.jwtService.verify<JwtPayload>(token);

            if (!payload.sub) {
                socket.disconnect();
                return;
            }

            socket.data.userId = payload.sub;

            void socket.join(`user:${payload.sub}`);

        } catch (error: unknown) {

            socket.disconnect();
        }
    }

    handleDisconnect(socket: AuthenticatedSocket) {
    }

    emitNotification(
        userId: string,
        notification: Notification,
    ) {
        this.server
            .to(`user:${userId}`)
            .emit('notification', notification);
    }
}

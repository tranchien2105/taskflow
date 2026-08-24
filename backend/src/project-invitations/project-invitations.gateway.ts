import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';

import {
    Server,
    Socket,
} from 'socket.io';

import { JwtService } from '@nestjs/jwt';

import { ProjectInvitation } from './entities/project-invitation.entity';

import { ProjectMember } from '../project-members/entities/project-member.entity';

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:3001',
        credentials: true,
    },
})
export class ProjectInvitationsGateway
    implements
    OnGatewayConnection,
    OnGatewayDisconnect {
    constructor(
        private readonly jwtService: JwtService,
    ) { }

    @WebSocketServer()
    server!: Server;

    /**
     * Authenticate socket connection
     * and join personal user room.
     */
    handleConnection(socket: Socket) {
        try {
            const token =
                socket.handshake.auth.token;

            if (!token) {
                console.log(
                    'Socket rejected: no token',
                );

                socket.disconnect();

                return;
            }

            const payload =
                this.jwtService.verify(token);

            const userId = payload.sub;

            console.log(
                'Socket authenticated:',
                userId,
            );

            /**
             * Personal room
             *
             * Used for:
             * - invitation.created
             * - personal notifications
             */
            socket.join(
                `user:${userId}`,
            );

            console.log(
                `Socket joined room: user:${userId}`,
            );
        } catch (error) {
            console.error(
                'Socket authentication failed',
            );

            socket.disconnect();
        }
    }

    /**
     * Socket disconnected.
     */
    handleDisconnect(socket: Socket) {
        console.log(
            `WebSocket disconnected: ${socket.id}`,
        );
    }

    /**
     * Join project room.
     *
     * Frontend sends:
     *
     * socket.emit('project.join', {
     *     projectId,
     * });
     *
     * Socket will then join:
     *
     * project:${projectId}
     */
    @SubscribeMessage('project.join')
    handleProjectJoin(
        @ConnectedSocket()
        socket: Socket,

        @MessageBody()
        data: {
            projectId: string;
        },
    ) {
        socket.join(
            `project:${data.projectId}`,
        );

        console.log(
            `Socket ${socket.id} joined project room: project:${data.projectId}`,
        );
    }

    /**
     * Emit new invitation notification
     * to a specific user.
     */
    emitInvitationCreated(
        userId: string,
        invitation: ProjectInvitation,
    ) {
        this.server
            .to(`user:${userId}`)
            .emit(
                'project.invitation.created',
                invitation,
            );
    }

    /**
     * Emit new project member event
     * to everyone currently inside
     * the project room.
     */
    emitProjectMemberAdded(
        projectId: string,
        member: ProjectMember,
    ) {
        this.server
            .to(`project:${projectId}`)
            .emit(
                'project.member.added',
                member,
            );
    }
}
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

import { ProjectInvitation } from './entities/project-invitation.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

interface SocketData {
  userId?: string;
}

interface ProjectJoinData {
  projectId: string;
}

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
export class ProjectInvitationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Authenticate socket connection
   * and join personal user room.
   */
  handleConnection(socket: AuthenticatedSocket): void {
    try {
      const token: unknown = socket.handshake.auth?.token;

      if (typeof token !== 'string' || !token) {
        console.log('Socket rejected: no token');
        socket.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);

      const userId = payload.sub;

      if (!userId) {
        console.log('Socket rejected: invalid user id');
        socket.disconnect();
        return;
      }

      socket.data.userId = userId;

      console.log('Socket authenticated:', userId);

      /**
       * Personal room
       *
       * Used for:
       * - invitation.created
       * - personal notifications
       */
      void socket.join(`user:${userId}`);

      console.log(`Socket joined room: user:${userId}`);
    } catch (error: unknown) {
      console.error('Socket authentication failed:', error);
      socket.disconnect();
    }
  }

  /**
   * Socket disconnected.
   */
  handleDisconnect(socket: AuthenticatedSocket): void {
    console.log(`WebSocket disconnected: ${socket.id}`);
  }

  /**
   * Join project room.
   *
   * Frontend sends:
   *
   * socket.emit('project.join', {
   *   projectId,
   * });
   *
   * Socket will then join:
   *
   * project:${projectId}
   */
  @SubscribeMessage('project.join')
  handleProjectJoin(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: ProjectJoinData,
  ): void {
    void socket.join(`project:${data.projectId}`);

    console.log(
      `Socket ${socket.id} joined project room: project:${data.projectId}`,
    );
  }

  /**
   * Emit new invitation notification
   * to a specific user.
   */
  emitInvitationCreated(userId: string, invitation: ProjectInvitation): void {
    void this.server
      .to(`user:${userId}`)
      .emit('project.invitation.created', invitation);
  }

  /**
   * Emit new project member event
   * to everyone currently inside
   * the project room.
   */
  emitProjectMemberAdded(projectId: string, member: ProjectMember): void {
    void this.server
      .to(`project:${projectId}`)
      .emit('project.member.added', member);
  }
}

import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

import { PresenceService } from './presence.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

interface SocketData {
  userId?: string;
}

interface ServerToClientEvents {
  'user.online.users': (data: { userIds: string[] }) => void;

  'user.online': (data: { userId: string }) => void;

  'user.offline': (data: { userId: string }) => void;
}

type AuthenticatedSocket = Socket<
  Record<string, never>,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

type PresenceServer = Server<Record<string, never>, ServerToClientEvents>;

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  },
})
export class PresenceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: PresenceServer;

  constructor(
    private readonly jwtService: JwtService,
    private readonly presenceService: PresenceService,
  ) {}

  async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    try {
      const token: unknown = socket.handshake.auth?.token;

      if (typeof token !== 'string' || token.length === 0) {
        socket.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      const userId = payload.sub;

      if (!userId) {
        socket.disconnect();
        return;
      }

      socket.data.userId = userId;

      const wasOffline = this.presenceService.addConnection(userId, socket.id);

      console.log(`User ${userId} connected`, socket.id);

      const onlineUserIds = this.presenceService.getOnlineUserIds();

      socket.emit('user.online.users', {
        userIds: onlineUserIds,
      });

      if (wasOffline) {
        this.server.emit('user.online', {
          userId,
        });
      }
    } catch (error: unknown) {
      console.error('Presence authentication failed:', error);

      socket.disconnect();
    }
  }

  handleDisconnect(socket: AuthenticatedSocket): void {
    const userId: string | undefined = socket.data.userId;

    if (!userId) {
      return;
    }

    const wentOffline = this.presenceService.removeConnection(
      userId,
      socket.id,
    );

    console.log(`User ${userId} disconnected`, socket.id);

    if (wentOffline) {
      this.server.emit('user.offline', {
        userId,
      });
    }
  }
}

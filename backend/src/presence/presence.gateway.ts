import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

import { PresenceService } from './presence.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  },
})
export class PresenceGateway
  implements
  OnGatewayConnection,
  OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly presenceService: PresenceService,
  ) { }

  async handleConnection(socket: Socket) {
    try {
      const token =
        socket.handshake.auth?.token;

      if (!token) {
        socket.disconnect();
        return;
      }

      const payload =
        await this.jwtService.verifyAsync(
          token,
        );

      const userId = payload.sub;

      if (!userId) {
        socket.disconnect();
        return;
      }

      /**
       * Save userId into socket.
       */
      socket.data.userId = userId;

      /**
       * Add socket connection.
       */
      const wasOffline =
        this.presenceService.addConnection(
          userId,
          socket.id,
        );

      console.log(
        `User ${userId} connected`,
        socket.id,
      );

      /**
       * Send current online users
       * to this newly connected client.
       */
      const onlineUserIds =
        this.presenceService.getOnlineUserIds();

      socket.emit('user.online.users', {
        userIds: onlineUserIds,
      });

      /**
       * Only broadcast when the user
       * changes from offline -> online.
       */
      if (wasOffline) {
        this.server.emit(
          'user.online',
          {
            userId,
          },
        );
      }
    } catch (error) {
      console.error(
        'Presence authentication failed:',
        error,
      );

      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userId =
      socket.data.userId;

    if (!userId) {
      return;
    }

    /**
     * Remove this socket.
     */
    const wentOffline =
      this.presenceService.removeConnection(
        userId,
        socket.id,
      );

    console.log(
      `User ${userId} disconnected`,
      socket.id,
    );

    /**
     * Only broadcast when the user
     * completely goes offline.
     */
    if (wentOffline) {
      this.server.emit(
        'user.offline',
        {
          userId,
        },
      );
    }
  }
}
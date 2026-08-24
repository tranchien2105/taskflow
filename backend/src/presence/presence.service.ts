import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
    private readonly userSockets =
        new Map<string, Set<string>>();

    addConnection(
        userId: string,
        socketId: string,
    ): boolean {
        let sockets =
            this.userSockets.get(userId);

        const wasOffline =
            !sockets || sockets.size === 0;

        if (!sockets) {
            sockets = new Set<string>();

            this.userSockets.set(
                userId,
                sockets,
            );
        }

        sockets.add(socketId);

        return wasOffline;
    }

    removeConnection(
        userId: string,
        socketId: string,
    ): boolean {
        const sockets =
            this.userSockets.get(userId);

        if (!sockets) {
            return false;
        }

        sockets.delete(socketId);

        if (sockets.size === 0) {
            this.userSockets.delete(userId);

            return true;
        }

        return false;
    }

    isOnline(userId: string): boolean {
        const sockets =
            this.userSockets.get(userId);

        return !!sockets && sockets.size > 0;
    }

    getOnlineUserIds(): string[] {
        return Array.from(
            this.userSockets.keys(),
        );
    }
}
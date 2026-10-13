'use client';

import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';

import { io, Socket } from 'socket.io-client';

type PresenceContextType = {
    onlineUserIds: Set<string>;
    isOnline: (userId: string) => boolean;
};

const PresenceContext =
    createContext<PresenceContextType | undefined>(
        undefined,
    );

type PresenceProviderProps = {
    children: ReactNode;
};

export function PresenceProvider({
    children,
}: PresenceProviderProps) {
    const [onlineUserIds, setOnlineUserIds] =
        useState<Set<string>>(new Set());

    useEffect(() => {
        const token =
            localStorage.getItem('accessToken');

        if (!token) {
            return;
        }

        const socket: Socket = io(
            process.env.NEXT_PUBLIC_API_URL!,
            {
                auth: {
                    token,
                },
                withCredentials: true,
            },
        );

        /**
         * Socket connected.
         */
        socket.on('connect', () => {
        });

        /**
         * Current online users.
         *
         * Backend sends this immediately
         * after the socket connects.
         */
        socket.on(
            'user.online.users',
            ({
                userIds,
            }: {
                userIds: string[];
            }) => {

                setOnlineUserIds(
                    new Set(userIds),
                );
            },
        );

        /**
         * User became online.
         */
        socket.on(
            'user.online',
            ({
                userId,
            }: {
                userId: string;
            }) => {

                setOnlineUserIds(
                    (current) => {
                        const next =
                            new Set(current);

                        next.add(userId);

                        return next;
                    },
                );
            },
        );

        /**
         * User became offline.
         */
        socket.on(
            'user.offline',
            ({
                userId,
            }: {
                userId: string;
            }) => {

                setOnlineUserIds(
                    (current) => {
                        const next =
                            new Set(current);

                        next.delete(userId);

                        return next;
                    },
                );
            },
        );

        /**
         * Socket connection error.
         */
        socket.on(
            'connect_error',
            (error) => {
            },
        );

        /**
         * Socket disconnected.
         */
        socket.on(
            'disconnect',
            (reason) => {
            },
        );

        /**
         * Cleanup.
         */
        return () => {
            socket.disconnect();
        };
    }, []);

    /**
     * Check whether a user is online.
     */
    const isOnline = (
        userId: string,
    ): boolean => {
        return onlineUserIds.has(userId);
    };

    return (
        <PresenceContext.Provider
            value={{
                onlineUserIds,
                isOnline,
            }}
        >
            {children}
        </PresenceContext.Provider>
    );
}

/**
 * Access presence state.
 */
export function usePresence() {
    const context =
        useContext(PresenceContext);

    if (!context) {
        throw new Error(
            'usePresence must be used within PresenceProvider',
        );
    }

    return context;
}
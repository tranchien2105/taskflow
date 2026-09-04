'use client';

import { useEffect, useState } from 'react';

import { io } from 'socket.io-client';

import { toast } from 'sonner';

type Notification = {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    entityType: string | null;
    entityId: string | null;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
};

export default function Notification() {
    const [notifications, setNotifications] =
        useState<Notification[]>([]);

    const loadNotifications = async () => {
        try {
            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                console.log(
                    'Notification: No access token.',
                );

                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/notifications`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const data = await response.json();

            if (!response.ok) {
                toast.error(
                    data.message ||
                    'Failed to load notifications.',
                );

                return;
            }

            console.log(
                'Notification REST data:',
                data.data,
            );

            setNotifications(data.data);
        } catch (error) {
            console.error(
                'Notification REST error:',
                error,
            );

            toast.error(
                'Unable to connect to the server.',
            );
        }
    };

    useEffect(() => {
        loadNotifications();

        const token =
            localStorage.getItem('accessToken');

        if (!token) {
            console.log(
                'Notification socket: No access token.',
            );

            return;
        }

        const socket = io(
            process.env.NEXT_PUBLIC_API_URL,
            {
                auth: {
                    token,
                },
                withCredentials: true,
            },
        );

        socket.on('connect', () => {
            console.log(
                'Notification socket connected:',
                socket.id,
            );
        });

        socket.on(
            'connect_error',
            (error) => {
                console.error(
                    'Notification socket connection error:',
                    error,
                );
            },
        );

        socket.on(
            'notification',
            (notification: Notification) => {
                console.log(
                    '🔥 NEW NOTIFICATION FROM SOCKET:',
                    notification,
                );

                setNotifications(
                    (current) => {
                        const alreadyExists =
                            current.some(
                                (item) =>
                                    item.id ===
                                    notification.id,
                            );

                        console.log(
                            'Notification already exists:',
                            alreadyExists,
                        );

                        if (alreadyExists) {
                            return current;
                        }

                        return [
                            notification,
                            ...current,
                        ];
                    },
                );

                toast.info(
                    notification.message,
                );
            },
        );

        socket.on('disconnect', (reason) => {
            console.log(
                'Notification socket disconnected:',
                reason,
            );
        });

        return () => {
            console.log(
                'Cleaning up notification socket:',
                socket.id,
            );

            socket.disconnect();
        };
    }, []);

    return null;
}
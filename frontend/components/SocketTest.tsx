'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';

export default function SocketTest() {
    useEffect(() => {
        const token =
            localStorage.getItem('accessToken');

        if (!token) {
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
                'Socket connected:',
                socket.id,
            );
        });

        socket.on(
            'project.member.added',
            (data) => {
                console.log(
                    'Project member added:',
                    data,
                );
            },
        );

        socket.on('disconnect', () => {
            console.log(
                'Socket disconnected',
            );
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return null;
}
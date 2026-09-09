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
    const [notifications, setNotifications] = useState<
        Notification[]
    >([]);

    const [isOpen, setIsOpen] = useState(false);

    const [isMarkingAllAsRead, setIsMarkingAllAsRead] =
        useState(false);

    const unreadCount = notifications.filter(
        (notification) => !notification.isRead,
    ).length;

    /**
     * Load notifications from REST API.
     */
    const loadNotifications = async () => {
        try {
            const token =
                localStorage.getItem('accessToken');

            if (!token) {
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

    /**
     * Mark one notification as read.
     */
    const markAsRead = async (
        notificationId: string,
    ) => {
        try {
            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/notifications/${notificationId}/read`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const data = await response.json();

            if (!response.ok) {
                toast.error(
                    data.message ||
                    'Failed to mark notification as read.',
                );

                return;
            }

            setNotifications((current) =>
                current.map((notification) =>
                    notification.id === notificationId
                        ? {
                            ...notification,
                            isRead: true,
                        }
                        : notification,
                ),
            );
        } catch (error) {
            console.error(
                'Mark notification as read error:',
                error,
            );

            toast.error(
                'Unable to update notification.',
            );
        }
    };

    /**
     * Mark all notifications as read.
     */
    const markAllAsRead = async () => {
        if (unreadCount === 0) {
            return;
        }

        try {
            setIsMarkingAllAsRead(true);

            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/notifications/read-all`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const data = await response.json();

            if (!response.ok) {
                toast.error(
                    data.message ||
                    'Failed to mark all notifications as read.',
                );

                return;
            }

            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    isRead: true,
                })),
            );

            toast.success(
                'All notifications marked as read.',
            );
        } catch (error) {
            console.error(
                'Mark all notifications as read error:',
                error,
            );

            toast.error(
                'Unable to update notifications.',
            );
        } finally {
            setIsMarkingAllAsRead(false);
        }
    };

    /**
     * Handle notification click.
     */
    const handleNotificationClick = async (
        notification: Notification,
    ) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }

        // Close dropdown after clicking notification.
        setIsOpen(false);

        // Navigation to related entity can be added later.
        // Example:
        // /tasks/${notification.entityId}
    };

    /**
     * Load notifications and connect WebSocket.
     */
    useEffect(() => {
        loadNotifications();

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
                    '🔥 NEW NOTIFICATION:',
                    notification,
                );

                setNotifications((current) => {
                    const alreadyExists =
                        current.some(
                            (item) =>
                                item.id ===
                                notification.id,
                        );

                    if (alreadyExists) {
                        return current;
                    }

                    return [
                        notification,
                        ...current,
                    ];
                });

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
            socket.disconnect();
        };
    }, []);

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                type="button"
                onClick={() =>
                    setIsOpen((current) => !current)
                }
                className="relative flex h-9 w-9 items-center justify-center rounded-md border border-violet-200 bg-white text-slate-500 transition hover:border-fuchsia-300 hover:bg-fuchsia-50 hover:text-fuchsia-600"
                aria-label="Notifications"
            >
                {/* Bell icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="h-5 w-5"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 1 0-12 0v.75a8.967 8.967 0 0 1-2.31 6.022c1.733.64 3.56 1.085 5.453 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                    />
                </svg>

                {/* Unread badge */}
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-500 px-1 font-mono text-[9px] font-bold text-white">
                        {unreadCount > 99
                            ? '99+'
                            : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Overlay */}
                    <button
                        type="button"
                        aria-label="Close notifications"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() =>
                            setIsOpen(false)
                        }
                    />

                    {/* Notification panel */}
                    <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-lg border border-violet-200 bg-white shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-violet-100 px-4 py-3">
                            <div>
                                <h3 className="font-mono text-sm font-bold text-slate-800">
                                    Notifications
                                </h3>

                                <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                                    {unreadCount > 0
                                        ? `${unreadCount} unread`
                                        : 'All caught up'}
                                </p>
                            </div>

                            {notifications.length > 0 && (
                                <button
                                    type="button"
                                    disabled={
                                        unreadCount === 0 ||
                                        isMarkingAllAsRead
                                    }
                                    className="font-mono text-[10px] font-semibold text-fuchsia-600 transition hover:text-fuchsia-700 disabled:cursor-not-allowed disabled:text-slate-300"
                                    onClick={
                                        markAllAsRead
                                    }
                                >
                                    {isMarkingAllAsRead
                                        ? 'marking...'
                                        : 'mark all read'}
                                </button>
                            )}
                        </div>

                        {/* Notification list */}
                        <div className="max-h-[420px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-10 text-center">
                                    <div className="mb-2 text-2xl">
                                        🔔
                                    </div>

                                    <p className="font-mono text-xs font-semibold text-slate-500">
                                        No notifications
                                    </p>

                                    <p className="mt-1 font-mono text-[10px] text-slate-400">
                                        You're all caught up.
                                    </p>
                                </div>
                            ) : (
                                notifications.map(
                                    (notification) => (
                                        <button
                                            key={
                                                notification.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                handleNotificationClick(
                                                    notification,
                                                )
                                            }
                                            className={`w-full border-b border-violet-50 px-4 py-3 text-left transition hover:bg-fuchsia-50 ${!notification.isRead
                                                    ? 'bg-fuchsia-50/60'
                                                    : 'bg-white'
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                {/* Read status */}
                                                <div className="pt-1.5">
                                                    <span
                                                        className={`block h-2 w-2 rounded-full ${!notification.isRead
                                                                ? 'bg-fuchsia-500'
                                                                : 'bg-slate-200'
                                                            }`}
                                                    />
                                                </div>

                                                {/* Content */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p
                                                            className={`font-mono text-xs ${!notification.isRead
                                                                    ? 'font-bold text-slate-800'
                                                                    : 'font-medium text-slate-600'
                                                                }`}
                                                        >
                                                            {
                                                                notification.title
                                                            }
                                                        </p>

                                                        <span className="shrink-0 font-mono text-[9px] text-slate-400">
                                                            {new Date(
                                                                notification.createdAt,
                                                            ).toLocaleTimeString(
                                                                'vi-VN',
                                                                {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}
                                                        </span>
                                                    </div>

                                                    <p className="mt-1 font-mono text-[10px] leading-relaxed text-slate-500">
                                                        {
                                                            notification.message
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ),
                                )
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
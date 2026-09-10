'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';

type OnlineUser = {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    role?: string;
};

type RecentActivity = {
    id: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: {
        title?: string;
        name?: string;
        [key: string]: unknown;
    } | null;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string | null;
    } | null;
};

type DashboardData = {
    overview: {
        totalProjects: number;
        totalTasks: number;
        activeTasks: number;
        completedTasks: number;
        overdueTasks: number;
    };

    taskStatus: {
        TODO: number;
        IN_PROGRESS: number;
        REVIEW: number;
        DONE: number;
    };

    priority: {
        LOW: number;
        MEDIUM: number;
        HIGH: number;
        URGENT: number;
    };

    myWorkload: {
        assigned: number;
        completed: number;
    };

    onlineUsers?: OnlineUser[];

    recentActivities?: RecentActivity[];
};

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [dashboard, setDashboard] =
        useState<DashboardData | null>(null);

    const [dashboardLoading, setDashboardLoading] =
        useState(true);

    const [dashboardError, setDashboardError] =
        useState<string | null>(null);

    /*
     * ============================================================
     * AUTH REDIRECT
     * ============================================================
     */

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [loading, user, router]);

    /*
     * ============================================================
     * LOAD DASHBOARD
     * ============================================================
     *
     * showLoading = true:
     *   Initial page load -> show loading screen.
     *
     * showLoading = false:
     *   Background refresh -> update data silently.
     *
     */

    const loadDashboard = useCallback(
        async (showLoading = true) => {
            try {
                if (showLoading) {
                    setDashboardLoading(true);
                }

                setDashboardError(null);

                const token =
                    localStorage.getItem('accessToken');

                if (!token) {
                    router.replace('/login');
                    return;
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/dashboard`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        'Failed to load dashboard.',
                    );
                }

                const dashboardData =
                    data.data ?? data;

                setDashboard(dashboardData);
            } catch (error) {
                console.error(
                    'Dashboard loading error:',
                    error,
                );

                setDashboardError(
                    error instanceof Error
                        ? error.message
                        : 'Unable to load dashboard.',
                );
            } finally {
                if (showLoading) {
                    setDashboardLoading(false);
                }
            }
        },
        [router],
    );

    /*
     * ============================================================
     * INITIAL DASHBOARD LOAD
     * ============================================================
     */

    useEffect(() => {
        if (loading || !user) {
            return;
        }

        loadDashboard(true);
    }, [loading, user, loadDashboard]);

    /*
     * ============================================================
     * REALTIME PRESENCE
     * ============================================================
     *
     * Only Admin needs to listen for all online users.
     *
     * user.online:
     *   Gateway sends userId only.
     *   Refresh dashboard silently to get user information.
     *
     * user.offline:
     *   Remove user directly from local state.
     *
     */

    useEffect(() => {
        if (
            loading ||
            !user ||
            user.role !== 'ADMIN'
        ) {
            return;
        }

        const token =
            localStorage.getItem('accessToken');

        if (!token) {
            return;
        }

        const socket: Socket = io(
            process.env.NEXT_PUBLIC_API_URL as string,
            {
                auth: {
                    token,
                },
            },
        );

        socket.on('connect', () => {
            console.log(
                'Dashboard presence connected:',
                socket.id,
            );
        });

        socket.on('connect_error', (error) => {
            console.error(
                'Dashboard presence connection error:',
                error,
            );
        });

        /*
         * ========================================================
         * USER ONLINE
         * ========================================================
         */

        socket.on(
            'user.online',
            async (data: { userId: string }) => {
                console.log(
                    'User online:',
                    data.userId,
                );

                /*
                 * Backend currently sends only userId.
                 *
                 * Refresh dashboard silently so we get:
                 * - name
                 * - email
                 * - avatar
                 * - role
                 */
                await loadDashboard(false);
            },
        );

        /*
         * ========================================================
         * USER OFFLINE
         * ========================================================
         */

        socket.on(
            'user.offline',
            (data: { userId: string }) => {
                console.log(
                    'User offline:',
                    data.userId,
                );

                setDashboard((current) => {
                    if (!current) {
                        return current;
                    }

                    return {
                        ...current,

                        onlineUsers: (
                            current.onlineUsers ?? []
                        ).filter(
                            (onlineUser) =>
                                onlineUser.id !==
                                data.userId,
                        ),
                    };
                });
            },
        );

        /*
         * ========================================================
         * CLEANUP
         * ========================================================
         */

        return () => {
            socket.off('user.online');
            socket.off('user.offline');
            socket.off('connect');
            socket.off('connect_error');

            socket.disconnect();
        };
    }, [loading, user, loadDashboard]);

    /*
     * ============================================================
     * AUTH LOADING
     * ============================================================
     */

    if (loading || !user) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#fff7fb]">
                <div className="flex items-center gap-3 font-mono text-xs text-slate-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-fuchsia-600" />

                    loading...
                </div>
            </main>
        );
    }

    /*
     * ============================================================
     * DASHBOARD LOADING
     * ============================================================
     */

    if (dashboardLoading) {
        return (
            <div className="min-h-screen bg-[#fff7fb] text-slate-900">
                <Navbar />

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex min-h-[60vh] items-center justify-center">
                        <div className="flex items-center gap-3 font-mono text-xs text-slate-500">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-fuchsia-600" />

                            loading dashboard...
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    /*
     * ============================================================
     * DASHBOARD ERROR
     * ============================================================
     */

    if (dashboardError || !dashboard) {
        return (
            <div className="min-h-screen bg-[#fff7fb] text-slate-900">
                <Navbar />

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="border border-red-200 bg-white p-6">
                        <p className="font-mono text-xs font-bold text-red-500">
                            dashboard.error
                        </p>

                        <h1 className="mt-2 text-lg font-bold text-slate-900">
                            Unable to load dashboard
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            {dashboardError ||
                                'Dashboard data is unavailable.'}
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    /*
     * ============================================================
     * DASHBOARD DATA
     * ============================================================
     */

    const {
        totalProjects,
        totalTasks,
        activeTasks,
        completedTasks,
        overdueTasks,
    } = dashboard.overview;

    const completionPercentage =
        totalTasks > 0
            ? Math.round(
                (completedTasks / totalTasks) * 100,
            )
            : 0;

    const statusItems = [
        {
            label: 'TODO',
            value: dashboard.taskStatus.TODO,
        },
        {
            label: 'IN PROGRESS',
            value: dashboard.taskStatus.IN_PROGRESS,
        },
        {
            label: 'REVIEW',
            value: dashboard.taskStatus.REVIEW,
        },
        {
            label: 'DONE',
            value: dashboard.taskStatus.DONE,
        },
    ];

    const priorityItems = [
        {
            label: 'LOW',
            value: dashboard.priority.LOW,
        },
        {
            label: 'MEDIUM',
            value: dashboard.priority.MEDIUM,
        },
        {
            label: 'HIGH',
            value: dashboard.priority.HIGH,
        },
        {
            label: 'URGENT',
            value: dashboard.priority.URGENT,
        },
    ];

    const onlineUsers =
        dashboard.onlineUsers ?? [];

    const recentActivities =
        dashboard.recentActivities ?? [];

    /*
     * ============================================================
     * ACTIVITY HELPERS
     * ============================================================
     */

    const formatActivityAction = (
        action: string,
    ) => {
        return action
            .toLowerCase()
            .replace(/_/g, ' ');
    };

    const getActivityTarget = (
        activity: RecentActivity,
    ) => {
        return (
            activity.metadata?.title ||
            activity.metadata?.name ||
            activity.entityType
        );
    };

    const formatActivityTime = (
        createdAt: string,
    ) => {
        const date = new Date(createdAt);

        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    /*
     * ============================================================
     * RENDER
     * ============================================================
     */

    return (
        <div className="min-h-screen bg-[#fff7fb] text-slate-900">
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* ================= HEADER ================= */}

                <div className="mb-8">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-fuchsia-600">
                            ~/workspace
                        </span>

                        <span className="font-mono text-[10px] text-slate-300">
                            /
                        </span>

                        <span className="font-mono text-xs text-slate-400">
                            dashboard
                        </span>
                    </div>

                    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                Welcome back, {user.name}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                Here&apos;s what&apos;s happening
                                with your workspace today.
                            </p>
                        </div>

                        <Link
                            href="/projects"
                            className="inline-flex items-center justify-center gap-2 rounded-md border border-fuchsia-600 bg-fuchsia-600 px-4 py-2.5 font-mono text-xs font-bold text-white transition hover:border-fuchsia-700 hover:bg-fuchsia-700 active:translate-y-px"
                        >
                            <span className="text-base leading-none">
                                +
                            </span>

                            new-project
                        </Link>
                    </div>
                </div>

                {/* ================= STATS ================= */}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Projects */}

                    <div className="border border-slate-200 bg-white p-5 transition hover:border-fuchsia-200">
                        <div className="flex items-center justify-between">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                projects
                            </p>

                            <span className="font-mono text-xs text-fuchsia-500">
                                #
                            </span>
                        </div>

                        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                            {totalProjects}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Projects you&apos;re a member of
                        </p>
                    </div>

                    {/* Active Tasks */}

                    <div className="border border-slate-200 bg-white p-5 transition hover:border-fuchsia-200">
                        <div className="flex items-center justify-between">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                active-tasks
                            </p>

                            <span className="font-mono text-xs text-fuchsia-500">
                                &gt;
                            </span>
                        </div>

                        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                            {activeTasks}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Tasks currently in progress
                        </p>
                    </div>

                    {/* Completed */}

                    <div className="border border-slate-200 bg-white p-5 transition hover:border-fuchsia-200">
                        <div className="flex items-center justify-between">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                completed
                            </p>

                            <span className="font-mono text-xs text-emerald-500">
                                ✓
                            </span>
                        </div>

                        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                            {completedTasks}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Completed tasks
                        </p>
                    </div>

                    {/* Overdue */}

                    <div className="border border-slate-200 bg-white p-5 transition hover:border-red-200">
                        <div className="flex items-center justify-between">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                overdue
                            </p>

                            <span className="font-mono text-xs text-red-500">
                                !
                            </span>
                        </div>

                        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                            {overdueTasks}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Tasks past their due date
                        </p>
                    </div>
                </div>

                {/* ================= MAIN GRID ================= */}

                <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    {/* ================= WORKSPACE PROGRESS ================= */}

                    <section className="border border-pink-100 bg-white">
                        <div className="border-b border-pink-100 bg-pink-50/40 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-fuchsia-600">
                                    $
                                </span>

                                <h2 className="font-mono text-sm font-bold text-slate-900">
                                    workspace-progress
                                </h2>
                            </div>

                            <p className="mt-1 font-mono text-[10px] text-slate-400">
                                // real-time overview of your
                                workspace
                            </p>
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {completionPercentage}% completed
                                    </h3>

                                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                                        {completedTasks} of{' '}
                                        {totalTasks} tasks have
                                        been completed across
                                        your workspace.
                                    </p>
                                </div>

                                <div className="shrink-0">
                                    <span className="font-mono text-xs font-bold text-fuchsia-600">
                                        {completedTasks}/
                                        {totalTasks}
                                    </span>
                                </div>
                            </div>

                            {/* Progress */}

                            <div className="mt-6 border-t border-slate-100 pt-5">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        completion
                                    </span>

                                    <span className="font-mono text-[10px] font-bold text-emerald-600">
                                        {completionPercentage}%
                                    </span>
                                </div>

                                <div className="mt-3 h-1.5 w-full bg-slate-100">
                                    <div
                                        className="h-1.5 bg-fuchsia-500 transition-all"
                                        style={{
                                            width: `${completionPercentage}%`,
                                        }}
                                    />
                                </div>

                                <p className="mt-2 font-mono text-[10px] text-slate-400">
                                    // based on completed vs total
                                    tasks
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ================= MY WORKLOAD ================= */}

                    <section className="border border-slate-200 bg-white">
                        <div className="border-b border-slate-100 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-fuchsia-600">
                                    ::
                                </span>

                                <h2 className="font-mono text-sm font-bold text-slate-900">
                                    my-workload
                                </h2>
                            </div>

                            <p className="mt-1 font-mono text-[10px] text-slate-400">
                                // tasks assigned to you
                            </p>
                        </div>

                        <div className="grid grid-cols-2 divide-x divide-slate-100">
                            <div className="p-5">
                                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    assigned
                                </p>

                                <p className="mt-3 text-3xl font-bold text-slate-900">
                                    {dashboard.myWorkload.assigned}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Total assigned
                                </p>
                            </div>

                            <div className="p-5">
                                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    completed
                                </p>

                                <p className="mt-3 text-3xl font-bold text-emerald-600">
                                    {dashboard.myWorkload.completed}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Completed by you
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 px-5 py-4">
                            <Link
                                href="/projects"
                                className="font-mono text-xs font-bold text-fuchsia-600 transition hover:text-fuchsia-700"
                            >
                                view-projects →
                            </Link>
                        </div>
                    </section>
                </div>

                {/* ================= BREAKDOWN ================= */}

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {/* Task Status */}

                    <section className="border border-slate-200 bg-white">
                        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-fuchsia-600">
                                    ::
                                </span>

                                <h2 className="font-mono text-sm font-bold text-slate-900">
                                    task-status
                                </h2>
                            </div>

                            <p className="mt-1 font-mono text-[10px] text-slate-400">
                                // distribution by current status
                            </p>
                        </div>

                        <div className="space-y-5 p-5 sm:p-6">
                            {statusItems.map((item) => {
                                const percentage =
                                    totalTasks > 0
                                        ? Math.round(
                                            (item.value /
                                                totalTasks) *
                                            100,
                                        )
                                        : 0;

                                return (
                                    <div
                                        key={item.label}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-[10px] font-bold text-slate-500">
                                                {item.label}
                                            </span>

                                            <span className="font-mono text-[10px] font-bold text-slate-800">
                                                {item.value}{' '}
                                                <span className="text-slate-300">
                                                    /
                                                </span>{' '}
                                                {percentage}%
                                            </span>
                                        </div>

                                        <div className="mt-2 h-1.5 w-full bg-slate-100">
                                            <div
                                                className="h-1.5 bg-fuchsia-500 transition-all"
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Priority */}

                    <section className="border border-slate-200 bg-white">
                        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-fuchsia-600">
                                    ::
                                </span>

                                <h2 className="font-mono text-sm font-bold text-slate-900">
                                    priority
                                </h2>
                            </div>

                            <p className="mt-1 font-mono text-[10px] text-slate-400">
                                // distribution by task priority
                            </p>
                        </div>

                        <div className="space-y-5 p-5 sm:p-6">
                            {priorityItems.map((item) => {
                                const percentage =
                                    totalTasks > 0
                                        ? Math.round(
                                            (item.value /
                                                totalTasks) *
                                            100,
                                        )
                                        : 0;

                                const isUrgent =
                                    item.label === 'URGENT';

                                const isHigh =
                                    item.label === 'HIGH';

                                return (
                                    <div
                                        key={item.label}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`font-mono text-[10px] font-bold ${isUrgent
                                                        ? 'text-red-500'
                                                        : isHigh
                                                            ? 'text-orange-500'
                                                            : 'text-slate-500'
                                                    }`}
                                            >
                                                {item.label}
                                            </span>

                                            <span className="font-mono text-[10px] font-bold text-slate-800">
                                                {item.value}{' '}
                                                <span className="text-slate-300">
                                                    /
                                                </span>{' '}
                                                {percentage}%
                                            </span>
                                        </div>

                                        <div className="mt-2 h-1.5 w-full bg-slate-100">
                                            <div
                                                className={`h-1.5 transition-all ${isUrgent
                                                        ? 'bg-red-500'
                                                        : isHigh
                                                            ? 'bg-orange-500'
                                                            : 'bg-fuchsia-500'
                                                    }`}
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* ======================================================
                    ADMIN DASHBOARD
                    ====================================================== */}

                {user.role === 'ADMIN' && (
                    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
                        {/* ================= ONLINE USERS ================= */}

                        <section className="border border-emerald-100 bg-white">
                            <div className="border-b border-emerald-100 bg-emerald-50/40 px-5 py-4 sm:px-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-emerald-600">
                                                ●
                                            </span>

                                            <h2 className="font-mono text-sm font-bold text-slate-900">
                                                online-users
                                            </h2>
                                        </div>

                                        <p className="mt-1 font-mono text-[10px] text-slate-400">
                                            // users currently online
                                        </p>
                                    </div>

                                    <span className="font-mono text-xs font-bold text-emerald-600">
                                        {onlineUsers.length}
                                    </span>
                                </div>
                            </div>

                            {onlineUsers.length === 0 ? (
                                <div className="p-6">
                                    <p className="font-mono text-xs text-slate-400">
                                        // no users currently online
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {onlineUsers.map(
                                        (onlineUser) => (
                                            <div
                                                key={
                                                    onlineUser.id
                                                }
                                                className="flex items-center gap-3 px-5 py-4 transition hover:bg-emerald-50/30"
                                            >
                                                <div className="relative shrink-0">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 font-mono text-sm font-bold text-emerald-700">
                                                        {onlineUser.name
                                                            ?.charAt(
                                                                0,
                                                            )
                                                            .toUpperCase()}
                                                    </div>

                                                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-slate-800">
                                                        {
                                                            onlineUser.name
                                                        }
                                                    </p>

                                                    <p className="truncate text-xs text-slate-400">
                                                        {
                                                            onlineUser.email
                                                        }
                                                    </p>
                                                </div>

                                                <span className="shrink-0 font-mono text-[10px] font-bold text-emerald-600">
                                                    online
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </section>

                        {/* ================= RECENT ACTIVITIES ================= */}

                        <section className="border border-slate-200 bg-white">
                            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-fuchsia-600">
                                                ::
                                            </span>

                                            <h2 className="font-mono text-sm font-bold text-slate-900">
                                                recent-activities
                                            </h2>
                                        </div>

                                        <p className="mt-1 font-mono text-[10px] text-slate-400">
                                            // latest workspace activity
                                        </p>
                                    </div>

                                    <span className="font-mono text-[10px] text-slate-400">
                                        latest 10
                                    </span>
                                </div>
                            </div>

                            {recentActivities.length === 0 ? (
                                <div className="p-6">
                                    <p className="font-mono text-xs text-slate-400">
                                        // no recent activities
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {recentActivities.map(
                                        (activity) => (
                                            <div
                                                key={
                                                    activity.id
                                                }
                                                className="px-5 py-4 transition hover:bg-pink-50/30 sm:px-6"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="shrink-0">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-fuchsia-100 bg-fuchsia-50 font-mono text-xs font-bold text-fuchsia-600">
                                                            {activity.user?.name
                                                                ?.charAt(
                                                                    0,
                                                                )
                                                                .toUpperCase() ||
                                                                '?'}
                                                        </div>
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                            <p className="text-sm text-slate-700">
                                                                <span className="font-semibold text-slate-900">
                                                                    {activity.user
                                                                        ?.name ||
                                                                        'Unknown user'}
                                                                </span>{' '}

                                                                <span className="text-slate-500">
                                                                    {formatActivityAction(
                                                                        activity.action,
                                                                    )}
                                                                </span>{' '}

                                                                <span className="font-semibold text-fuchsia-600">
                                                                    {
                                                                        getActivityTarget(
                                                                            activity,
                                                                        )
                                                                    }
                                                                </span>
                                                            </p>

                                                            <span className="shrink-0 font-mono text-[10px] text-slate-400">
                                                                {formatActivityTime(
                                                                    activity.createdAt,
                                                                )}
                                                            </span>
                                                        </div>

                                                        <div className="mt-1 flex items-center gap-2">
                                                            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-300">
                                                                {
                                                                    activity.entityType
                                                                }
                                                            </span>

                                                            <span className="font-mono text-[9px] text-slate-300">
                                                                /
                                                            </span>

                                                            <span className="font-mono text-[9px] text-slate-300">
                                                                {
                                                                    activity.action
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* ================= QUICK ACTIONS ================= */}

                <section className="mt-6 border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-fuchsia-600">
                                ::
                            </span>

                            <h2 className="font-mono text-sm font-bold text-slate-900">
                                quick-actions
                            </h2>
                        </div>

                        <p className="mt-1 font-mono text-[10px] text-slate-400">
                            // common workspace actions
                        </p>
                    </div>

                    <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                        <Link
                            href="/projects"
                            className="group flex items-center justify-between px-5 py-4 transition hover:bg-pink-50/40"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-fuchsia-100 bg-fuchsia-50 font-mono text-xs font-bold text-fuchsia-600">
                                    +
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-slate-800 transition group-hover:text-fuchsia-700">
                                        Create project
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-400">
                                        Start a new workspace
                                    </p>
                                </div>
                            </div>

                            <span className="font-mono text-xs text-slate-300 transition group-hover:text-fuchsia-500">
                                →
                            </span>
                        </Link>

                        <Link
                            href="/projects"
                            className="group flex items-center justify-between px-5 py-4 transition hover:bg-pink-50/40"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-500">
                                    #
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-slate-800 transition group-hover:text-fuchsia-700">
                                        View projects
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-400">
                                        Browse your projects
                                    </p>
                                </div>
                            </div>

                            <span className="font-mono text-xs text-slate-300 transition group-hover:text-fuchsia-500">
                                →
                            </span>
                        </Link>
                    </div>
                </section>

                {/* ================= WORKSPACE INFO ================= */}

                <section className="mt-6 border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-fuchsia-600">
                                        //
                                    </span>

                                    <h2 className="font-mono text-sm font-bold text-slate-900">
                                        workspace
                                    </h2>
                                </div>

                                <p className="mt-1 font-mono text-[10px] text-slate-400">
                                    // current workspace information
                                </p>
                            </div>

                            <span className="hidden font-mono text-[10px] text-slate-300 sm:block">
                                taskflow
                            </span>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3">
                        {/* User */}

                        <div className="border-b border-slate-100 p-5 sm:border-r lg:border-b-0">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                current-user
                            </p>

                            <div className="mt-3 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-fuchsia-200 bg-fuchsia-50 font-mono text-sm font-bold text-fuchsia-700">
                                    {user.name
                                        ?.charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                        {user.name}
                                    </p>

                                    <p className="truncate text-xs text-slate-400">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Dashboard status */}

                        <div className="border-b border-slate-100 p-5 lg:border-r lg:border-b-0">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                dashboard-status
                            </p>

                            <div className="mt-3 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                <span className="font-mono text-xs font-bold text-emerald-600">
                                    synced
                                </span>
                            </div>

                            <p className="mt-2 text-xs text-slate-400">
                                Dashboard data loaded from API.
                            </p>
                        </div>

                        {/* Environment */}

                        <div className="p-5">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                environment
                            </p>

                            <p className="mt-3 font-mono text-sm font-bold text-slate-800">
                                taskflow-api
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                                Connected to PostgreSQL.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ================= FOOTER NOTE ================= */}

                <div className="mt-6 flex items-center justify-between border-t border-pink-100 pt-4">
                    <p className="font-mono text-[10px] text-slate-400">
                        // taskflow workspace dashboard
                    </p>

                    <p className="hidden font-mono text-[10px] text-slate-300 sm:block">
                        v1.0
                    </p>
                </div>
            </main>
        </div>
    );
}
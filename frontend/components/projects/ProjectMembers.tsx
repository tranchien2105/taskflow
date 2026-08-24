'use client';

import {
    useEffect,
    useRef,
    useState,
} from 'react';

import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

type User = {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    role: 'ADMIN' | 'MEMBER';
};

type ProjectMember = {
    userId: string;
    projectId: string;
    role: 'MANAGER' | 'MEMBER';
    user: User;
};

type ProjectMembersProps = {
    projectId: string;
    canManage: boolean;
};

export default function ProjectMembers({
    projectId,
    canManage,
}: ProjectMembersProps) {
    const [members, setMembers] = useState<
        ProjectMember[]
    >([]);

    const [loading, setLoading] = useState(true);

    const [showAddForm, setShowAddForm] =
        useState(false);

    const [search, setSearch] = useState('');

    const [users, setUsers] = useState<User[]>([]);

    const [searching, setSearching] =
        useState(false);

    const [addingUserId, setAddingUserId] =
        useState<string | null>(null);

    const [updatingUserId, setUpdatingUserId] =
        useState<string | null>(null);

    const [removingUserId, setRemovingUserId] =
        useState<string | null>(null);

    /**
     * IDs of users that are currently online.
     *
     * Example:
     *
     * [
     *   "user-id-1",
     *   "user-id-2",
     * ]
     */
    const [onlineUserIds, setOnlineUserIds] =
        useState<string[]>([]);

    const socketRef =
        useRef<Socket | null>(null);

    /**
     * Load project members
     */
    const loadMembers = async () => {
        try {
            setLoading(true);

            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                toast.error(
                    'Your session has expired.',
                );

                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/members`,
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
                        'Failed to load members.',
                );

                return;
            }

            setMembers(data);
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to connect to the server.',
            );
        } finally {
            setLoading(false);
        }
    };

    /**
     * Load members when project changes
     */
    useEffect(() => {
        loadMembers();
    }, [projectId]);

    /**
     * Check whether user is online
     */
    const isOnline = (userId: string) => {
        return onlineUserIds.includes(userId);
    };

    /**
     * Project realtime socket
     *
     * Responsibilities:
     *
     * 1. Connect socket
     * 2. Authenticate with access token
     * 3. Join project room
     * 4. Load current online users
     * 5. Listen for project member added
     * 6. Listen for user online
     * 7. Listen for user offline
     */
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

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log(
                'Project members socket connected:',
                socket.id,
            );

            /**
             * Tell backend which project
             * this client is currently viewing.
             */
            socket.emit('project.join', {
                projectId,
            });
        });

        /**
         * Current online users
         *
         * Backend should emit:
         *
         * user.online.users
         *
         * {
         *   userIds: string[]
         * }
         */
        socket.on(
            'user.online.users',
            (data: {
                userIds: string[];
            }) => {
                console.log(
                    'Current online users:',
                    data.userIds,
                );

                setOnlineUserIds(
                    data.userIds,
                );
            },
        );

        /**
         * User became online
         */
        socket.on(
            'user.online',
            (data: {
                userId: string;
            }) => {
                console.log(
                    'User online:',
                    data.userId,
                );

                setOnlineUserIds(
                    (currentIds) => {
                        /**
                         * Prevent duplicate user ID
                         */
                        if (
                            currentIds.includes(
                                data.userId,
                            )
                        ) {
                            return currentIds;
                        }

                        return [
                            ...currentIds,
                            data.userId,
                        ];
                    },
                );
            },
        );

        /**
         * User became offline
         */
        socket.on(
            'user.offline',
            (data: {
                userId: string;
            }) => {
                console.log(
                    'User offline:',
                    data.userId,
                );

                setOnlineUserIds(
                    (currentIds) =>
                        currentIds.filter(
                            (userId) =>
                                userId !==
                                data.userId,
                        ),
                );
            },
        );

        /**
         * New member joined project
         */
        socket.on(
            'project.member.added',
            (member: ProjectMember) => {
                console.log(
                    'Project member added:',
                    member,
                );

                setMembers(
                    (currentMembers) => {
                        /**
                         * Prevent duplicate member
                         */
                        const exists =
                            currentMembers.some(
                                (
                                    currentMember,
                                ) =>
                                    currentMember.userId ===
                                    member.userId,
                            );

                        if (exists) {
                            return currentMembers;
                        }

                        return [
                            ...currentMembers,
                            member,
                        ];
                    },
                );

                toast.success(
                    `${
                        member.user?.name ??
                        'New member'
                    } joined the project.`,
                );
            },
        );

        socket.on('connect_error', (error) => {
            console.error(
                'Project members socket connection error:',
                error,
            );
        });

        socket.on('disconnect', () => {
            console.log(
                'Project members socket disconnected',
            );
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [projectId]);

    /**
     * Search users
     */
    useEffect(() => {
        if (!showAddForm) {
            setSearch('');
            setUsers([]);

            return;
        }

        const keyword = search.trim();

        if (!keyword) {
            setUsers([]);

            return;
        }

        const timer = setTimeout(
            async () => {
                try {
                    setSearching(true);

                    const token =
                        localStorage.getItem(
                            'accessToken',
                        );

                    if (!token) {
                        toast.error(
                            'Your session has expired.',
                        );

                        return;
                    }

                    const response =
                        await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}/users?search=${encodeURIComponent(
                                keyword,
                            )}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            },
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        toast.error(
                            data.message ||
                                'Failed to search users.',
                        );

                        return;
                    }

                    setUsers(data);
                } catch (error) {
                    console.error(error);

                    toast.error(
                        'Unable to search users.',
                    );
                } finally {
                    setSearching(false);
                }
            },
            300,
        );

        return () => {
            clearTimeout(timer);
        };
    }, [search, showAddForm]);

    /**
     * Check whether user is already a member
     */
    const isAlreadyMember = (
        userId: string,
    ) => {
        return members.some(
            (member) =>
                member.userId === userId,
        );
    };

    /**
     * Send project invitation
     */
    const handleAddMember = async (
        user: User,
    ) => {
        if (isAlreadyMember(user.id)) {
            toast.error(
                'This user is already a member.',
            );

            return;
        }

        try {
            setAddingUserId(user.id);

            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                toast.error(
                    'Your session has expired.',
                );

                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/members`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        userId: user.id,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                toast.error(
                    data.message ||
                        'Failed to add member.',
                );

                return;
            }

            toast.success(
                `Invitation sent to ${user.name}.`,
            );

            setSearch('');
            setUsers([]);

            /**
             * This API creates an invitation.
             *
             * The user will appear in this
             * project only after accepting
             * the invitation.
             */
            await loadMembers();
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to connect to the server.',
            );
        } finally {
            setAddingUserId(null);
        }
    };

    /**
     * Change member role
     */
    const handleChangeRole = async (
        member: ProjectMember,
    ) => {
        const newRole =
            member.role === 'MEMBER'
                ? 'MANAGER'
                : 'MEMBER';

        try {
            setUpdatingUserId(
                member.userId,
            );

            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                toast.error(
                    'Your session has expired.',
                );

                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/members/${member.userId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type':
                            'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        role: newRole,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                toast.error(
                    data.message ||
                        'Failed to update role.',
                );

                return;
            }

            toast.success(
                'Member role updated.',
            );

            await loadMembers();
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to connect to the server.',
            );
        } finally {
            setUpdatingUserId(null);
        }
    };

    /**
     * Remove member
     */
    const handleRemoveMember = async (
        member: ProjectMember,
    ) => {
        const confirmed =
            window.confirm(
                `Remove ${member.user.name} from this project?`,
            );

        if (!confirmed) {
            return;
        }

        try {
            setRemovingUserId(
                member.userId,
            );

            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                toast.error(
                    'Your session has expired.',
                );

                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/members/${member.userId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            let data: {
                message?: string;
            } = {};

            const contentType =
                response.headers.get(
                    'content-type',
                );

            if (
                contentType?.includes(
                    'application/json',
                )
            ) {
                data =
                    await response.json();
            }

            if (!response.ok) {
                toast.error(
                    data.message ||
                        'Failed to remove member.',
                );

                return;
            }

            setMembers(
                (currentMembers) =>
                    currentMembers.filter(
                        (currentMember) =>
                            currentMember.userId !==
                            member.userId,
                    ),
            );

            toast.success(
                `${member.user.name} removed from the project.`,
            );
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to connect to the server.',
            );
        } finally {
            setRemovingUserId(null);
        }
    };

    return (
        <section className="overflow-hidden border border-rose-100 bg-white shadow-sm">
            {/* Header */}
            <div className="border-b border-rose-100 bg-gradient-to-r from-white via-rose-50/40 to-pink-50/30 px-6 py-5 sm:px-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-rose-200 bg-rose-50 font-mono text-sm font-bold text-rose-500">
                            {'{ }'}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-mono text-lg font-bold tracking-tight text-gray-900">
                                    project.members
                                </h2>

                                {!loading && (
                                    <span className="border border-rose-200 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-rose-500">
                                        {members.length}
                                    </span>
                                )}
                            </div>

                            <p className="mt-1 text-sm text-gray-500">
                                People with access to this
                                project.
                            </p>
                        </div>
                    </div>

                    {canManage && (
                        <button
                            type="button"
                            onClick={() =>
                                setShowAddForm(
                                    (current) =>
                                        !current,
                                )
                            }
                            className="border border-rose-500 bg-rose-500 px-4 py-2.5 font-mono text-xs font-bold text-white transition hover:bg-rose-600 active:translate-y-px"
                        >
                            {showAddForm
                                ? '[ cancel ]'
                                : '[ + add member ]'}
                        </button>
                    )}
                </div>
            </div>

            {/* Add member */}
            {showAddForm && (
                <div className="border-b border-rose-100 bg-rose-50/30 px-6 py-5 sm:px-7">
                    <div className="max-w-2xl">
                        <div className="mb-3">
                            <h3 className="font-mono text-sm font-bold text-gray-900">
                                add_member()
                            </h3>

                            <p className="mt-1 text-xs text-gray-500">
                                Search by name or email.
                            </p>
                        </div>

                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 font-mono text-sm text-rose-400">
                                {'>'}
                            </div>

                            <input
                                type="text"
                                value={search}
                                onChange={(
                                    event,
                                ) =>
                                    setSearch(
                                        event.target
                                            .value,
                                    )
                                }
                                placeholder="search user..."
                                autoFocus
                                className="w-full border border-rose-200 bg-white py-3 pl-10 pr-4 font-mono text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                            />
                        </div>

                        {/* Search results */}
                        {search.trim() && (
                            <div className="mt-3 overflow-hidden border border-rose-100 bg-white shadow-sm">
                                {searching ? (
                                    <div className="px-4 py-5 font-mono text-xs text-gray-400">
                                        <span className="text-rose-400">
                                            $
                                        </span>{' '}
                                        searching...
                                    </div>
                                ) : users.length ===
                                  0 ? (
                                    <div className="px-4 py-7 text-center">
                                        <div className="font-mono text-xl text-rose-300">
                                            {'//'}
                                        </div>

                                        <p className="mt-2 font-mono text-xs font-semibold text-gray-700">
                                            no_users_found()
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                            Try another
                                            name or
                                            email.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {users.map(
                                            (
                                                user,
                                            ) => {
                                                const alreadyMember =
                                                    isAlreadyMember(
                                                        user.id,
                                                    );

                                                const adding =
                                                    addingUserId ===
                                                    user.id;

                                                const initial =
                                                    user.name
                                                        ?.charAt(
                                                            0,
                                                        )
                                                        .toUpperCase() ||
                                                    '?';

                                                return (
                                                    <div
                                                        key={
                                                            user.id
                                                        }
                                                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-rose-50/40"
                                                    >
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-rose-200 bg-rose-50 font-mono text-sm font-bold text-rose-500">
                                                            {
                                                                initial
                                                            }
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold text-gray-900">
                                                                {
                                                                    user.name
                                                                }
                                                            </p>

                                                            <p className="truncate font-mono text-[11px] text-gray-400">
                                                                {
                                                                    user.email
                                                                }
                                                            </p>
                                                        </div>

                                                        {alreadyMember ? (
                                                            <span className="border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-emerald-600">
                                                                added
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleAddMember(
                                                                        user,
                                                                    )
                                                                }
                                                                disabled={
                                                                    adding
                                                                }
                                                                className="border border-gray-900 bg-gray-900 px-3 py-2 font-mono text-[10px] font-bold text-white transition hover:border-rose-500 hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {adding
                                                                    ? 'adding...'
                                                                    : 'add'}
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Members */}
            <div className="p-6 sm:p-7">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="flex animate-pulse items-center gap-4 border border-gray-100 p-4"
                                >
                                    <div className="h-10 w-10 bg-gray-100" />

                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-32 bg-gray-100" />

                                        <div className="h-2.5 w-48 bg-gray-50" />
                                    </div>

                                    <div className="h-8 w-20 bg-gray-100" />
                                </div>
                            ),
                        )}
                    </div>
                ) : members.length === 0 ? (
                    <div className="border border-dashed border-rose-200 bg-rose-50/20 px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-rose-200 bg-white font-mono text-sm font-bold text-rose-400">
                            {'< />'}
                        </div>

                        <h3 className="mt-4 font-mono text-sm font-bold text-gray-900">
                            no_members()
                        </h3>

                        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                            Add someone to this
                            project so you can
                            start collaborating.
                        </p>

                        {canManage && (
                            <button
                                type="button"
                                onClick={() =>
                                    setShowAddForm(
                                        true,
                                    )
                                }
                                className="mt-5 border border-gray-900 bg-gray-900 px-4 py-2.5 font-mono text-xs font-bold text-white transition hover:border-rose-500 hover:bg-rose-500"
                            >
                                + add first member
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {members.map(
                            (member) => {
                                const isManager =
                                    member.role ===
                                    'MANAGER';

                                const updating =
                                    updatingUserId ===
                                    member.userId;

                                const removing =
                                    removingUserId ===
                                    member.userId;

                                const online =
                                    isOnline(
                                        member.userId,
                                    );

                                const initial =
                                    member.user?.name
                                        ?.charAt(
                                            0,
                                        )
                                        .toUpperCase() ||
                                    '?';

                                return (
                                    <div
                                        key={
                                            member.userId
                                        }
                                        className="group flex flex-col gap-4 border border-gray-100 bg-gray-50/40 p-4 transition hover:border-rose-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            {/* Avatar */}
                                            <div
                                                className={`relative flex h-10 w-10 shrink-0 items-center justify-center border font-mono text-sm font-bold ${
                                                    isManager
                                                        ? 'border-purple-200 bg-purple-50 text-purple-600'
                                                        : 'border-rose-200 bg-rose-50 text-rose-500'
                                                }`}
                                            >
                                                {initial}

                                                {/* Online indicator */}
                                                <span
                                                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                                                        online
                                                            ? 'bg-emerald-500'
                                                            : 'bg-gray-300'
                                                    }`}
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate text-sm font-semibold text-gray-900">
                                                        {
                                                            member
                                                                .user
                                                                ?.name
                                                        }
                                                    </p>

                                                    <span
                                                        className={`border px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                                                            isManager
                                                                ? 'border-purple-200 bg-purple-50 text-purple-600'
                                                                : 'border-gray-200 bg-gray-50 text-gray-500'
                                                        }`}
                                                    >
                                                        {
                                                            member.role
                                                        }
                                                    </span>
                                                </div>

                                                <p className="mt-1 truncate font-mono text-[11px] text-gray-400">
                                                    {
                                                        member
                                                            .user
                                                            ?.email
                                                    }
                                                </p>

                                                {/* Online / Offline */}
                                                <p
                                                    className={`mt-1 font-mono text-[10px] font-semibold ${
                                                        online
                                                            ? 'text-emerald-500'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    {online
                                                        ? '● Online'
                                                        : '○ Offline'}
                                                </p>
                                            </div>
                                        </div>

                                        {canManage && (
                                            <div className="flex shrink-0 items-center gap-2">
                                                {!isManager && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleChangeRole(
                                                                member,
                                                            )
                                                        }
                                                        disabled={
                                                            updating ||
                                                            removing
                                                        }
                                                        className="border border-gray-200 bg-white px-3 py-2 font-mono text-[10px] font-semibold text-gray-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {updating
                                                            ? 'updating...'
                                                            : 'make manager'}
                                                    </button>
                                                )}

                                                {isManager ? (
                                                    <span className="px-3 py-2 font-mono text-[10px] text-gray-400">
                                                        // project
                                                        manager
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveMember(
                                                                member,
                                                            )
                                                        }
                                                        disabled={
                                                            updating ||
                                                            removing
                                                        }
                                                        className="border border-red-100 bg-white px-3 py-2 font-mono text-[10px] font-semibold text-red-500 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {removing
                                                            ? 'removing...'
                                                            : 'remove'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            },
                        )}
                    </div>
                )}
            </div>

            {!loading &&
                members.length > 0 && (
                    <div className="border-t border-rose-100 bg-rose-50/20 px-6 py-3.5 sm:px-7">
                        <p className="font-mono text-[10px] text-gray-400">
                            <span className="text-rose-400">
                                $
                            </span>{' '}
                            {members.length}{' '}
                            {members.length ===
                            1
                                ? 'member'
                                : 'members'}{' '}
                            in this project
                        </p>
                    </div>
                )}
        </section>
    );
}
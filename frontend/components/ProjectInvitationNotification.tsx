'use client';

import {
    useEffect,
    useRef,
    useState,
} from 'react';

import { io } from 'socket.io-client';
import { toast } from 'sonner';

type ProjectInvitation = {
    id: string;
    projectId: string;

    project: {
        id: string;
        name: string;
        slug: string;
    };

    invitedUserId: string;
    invitedByUserId: string;

    invitedBy: {
        id: string;
        name: string;
    };

    status:
    | 'PENDING'
    | 'ACCEPTED'
    | 'REJECTED';

    createdAt: string;
    updatedAt: string;
};

export default function ProjectInvitationNotification() {
    const [invitations, setInvitations] = useState<
        ProjectInvitation[]
    >([]);

    const [loading, setLoading] =
        useState(true);

    const [processingId, setProcessingId] =
        useState<string | null>(null);

    const [isOpen, setIsOpen] =
        useState(false);

    const invitationRef =
        useRef<HTMLDivElement>(null);

    /**
     * Load existing pending invitations.
     *
     * REST API is responsible for
     * initial state.
     */
    const loadInvitations = async () => {
        try {
            setLoading(true);

            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/project-invitations`,
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
                    'Failed to load invitations.',
                );

                return;
            }

            setInvitations(data);
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
     * Initial load + realtime socket.
     *
     * REST
     *   ↓
     * Load existing invitations
     *
     * Socket.IO
     *   ↓
     * Receive new invitations in realtime
     */
    useEffect(() => {
        loadInvitations();

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
                'Invitation socket connected:',
                socket.id,
            );
        });

        socket.on(
            'connect_error',
            (error) => {
                console.error(
                    'Invitation socket connection error:',
                    error,
                );
            },
        );

        /**
         * Receive new project invitation.
         */
        socket.on(
            'project.invitation.created',
            (
                invitation: ProjectInvitation,
            ) => {
                console.log(
                    'New project invitation:',
                    invitation,
                );

                setInvitations(
                    (current) => {
                        /**
                         * Prevent duplicate invitation.
                         */
                        const alreadyExists =
                            current.some(
                                (item) =>
                                    item.id ===
                                    invitation.id,
                            );

                        if (alreadyExists) {
                            return current;
                        }

                        return [
                            invitation,
                            ...current,
                        ];
                    },
                );

                toast.info(
                    `You received an invitation to join "${invitation.project.name}".`,
                );
            },
        );

        socket.on(
            'disconnect',
            () => {
                console.log(
                    'Invitation socket disconnected',
                );
            },
        );

        /**
         * Cleanup socket when component unmounts.
         */
        return () => {
            socket.disconnect();
        };
    }, []);

    /**
     * Close popup when clicking outside.
     */
    useEffect(() => {
        const handleClickOutside = (
            event: MouseEvent,
        ) => {
            if (
                invitationRef.current &&
                !invitationRef.current.contains(
                    event.target as Node,
                )
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener(
            'mousedown',
            handleClickOutside,
        );

        return () => {
            document.removeEventListener(
                'mousedown',
                handleClickOutside,
            );
        };
    }, []);

    /**
     * Accept invitation.
     */
    const handleAccept = async (
        invitationId: string,
    ) => {
        try {
            setProcessingId(
                invitationId,
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
                `${process.env.NEXT_PUBLIC_API_URL}/project-invitations/${invitationId}/accept`,
                {
                    method: 'PATCH',
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
                    'Failed to accept invitation.',
                );

                return;
            }

            toast.success(
                'You joined the project successfully.',
            );

            setInvitations(
                (current) =>
                    current.filter(
                        (invitation) =>
                            invitation.id !==
                            invitationId,
                    ),
            );
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to connect to the server.',
            );
        } finally {
            setProcessingId(null);
        }
    };

    /**
     * Reject invitation.
     */
    const handleReject = async (
        invitationId: string,
    ) => {
        try {
            setProcessingId(
                invitationId,
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
                `${process.env.NEXT_PUBLIC_API_URL}/project-invitations/${invitationId}/reject`,
                {
                    method: 'PATCH',
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
                    'Failed to reject invitation.',
                );

                return;
            }

            toast.success(
                'Invitation rejected.',
            );

            setInvitations(
                (current) =>
                    current.filter(
                        (invitation) =>
                            invitation.id !==
                            invitationId,
                    ),
            );
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to connect to the server.',
            );
        } finally {
            setProcessingId(null);
        }
    };

    /**
     * Hide notification component when
     * there are no pending invitations.
     */
    if (
        loading ||
        invitations.length === 0
    ) {
        return null;
    }

    return (
        <div
            ref={invitationRef}
            className="relative"
        >
            {/* Invitation button */}
            <button
                type="button"
                onClick={() =>
                    setIsOpen(
                        (current) => !current,
                    )
                }
                className="relative rounded-md border border-violet-200 bg-white px-3 py-2 font-mono text-[11px] font-semibold text-slate-600 transition hover:border-fuchsia-200 hover:bg-fuchsia-50 hover:text-fuchsia-600"
            >
                invitations

                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-fuchsia-500 px-1 font-mono text-[9px] font-bold text-white">
                    {invitations.length}
                </span>
            </button>

            {/* Invitation popup */}
            {isOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 border border-violet-200 bg-white shadow-lg">
                    {/* Header */}
                    <div className="border-b border-violet-100 bg-violet-50/40 px-4 py-3">
                        <p className="font-mono text-xs font-bold text-slate-900">
                            project_invitations()
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                            You have pending
                            project invitations.
                        </p>
                    </div>

                    {/* Invitations */}
                    <div className="divide-y divide-gray-100">
                        {invitations.map(
                            (invitation) => {
                                const processing =
                                    processingId ===
                                    invitation.id;

                                return (
                                    <div
                                        key={
                                            invitation.id
                                        }
                                        className="p-4"
                                    >
                                        {/* Project */}
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-fuchsia-100 bg-fuchsia-50 font-mono text-sm font-bold text-fuchsia-600">
                                                {invitation.project.name
                                                    .charAt(
                                                        0,
                                                    )
                                                    .toUpperCase()}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-slate-900">
                                                    {
                                                        invitation
                                                            .project
                                                            .name
                                                    }
                                                </p>

                                                <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">
                                                    /
                                                    {
                                                        invitation
                                                            .project
                                                            .slug
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        {/* Invitation message */}
                                        <p className="mt-3 text-xs leading-5 text-slate-500">
                                            You have been
                                            invited to
                                            join this
                                            project.
                                        </p>

                                        {/* Invited by */}
                                        <p className="mt-2 font-mono text-[10px] text-slate-400">
                                            invited by:{' '}
                                            <span className="font-semibold text-slate-600">
                                                {
                                                    invitation
                                                        .invitedBy
                                                        .name
                                                }
                                            </span>
                                        </p>

                                        {/* Actions */}
                                        <div className="mt-4 flex gap-2">
                                            {/* Accept */}
                                            <button
                                                type="button"
                                                disabled={
                                                    processing
                                                }
                                                onClick={() =>
                                                    handleAccept(
                                                        invitation.id,
                                                    )
                                                }
                                                className="flex-1 border border-emerald-500 bg-emerald-500 px-3 py-2 font-mono text-[10px] font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {processing
                                                    ? 'processing...'
                                                    : 'accept'}
                                            </button>

                                            {/* Reject */}
                                            <button
                                                type="button"
                                                disabled={
                                                    processing
                                                }
                                                onClick={() =>
                                                    handleReject(
                                                        invitation.id,
                                                    )
                                                }
                                                className="flex-1 border border-gray-200 bg-white px-3 py-2 font-mono text-[10px] font-bold text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                reject
                                            </button>
                                        </div>
                                    </div>
                                );
                            },
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
'use client';

import {
    useEffect,
    useRef,
    useState,
} from 'react';

import { toast } from 'sonner';

type ProjectInvitation = {
    id: string;
    projectId: string;
    invitedUserId: string;
    invitedByUserId: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
    updatedAt: string;
};

export default function ProjectInvitationNotification() {
    const [invitations, setInvitations] = useState<
        ProjectInvitation[]
    >([]);

    const [loading, setLoading] = useState(true);

    const [processingId, setProcessingId] = useState<
        string | null
    >(null);

    const [isOpen, setIsOpen] = useState(false);

    const invitationRef =
        useRef<HTMLDivElement>(null);

    const loadInvitations = async () => {
        try {
            setLoading(true);

            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                return;
            }

            const response = await fetch(
                'http://localhost:3000/project-invitations',
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

    useEffect(() => {
        loadInvitations();
    }, []);

    /**
     * Close popup when clicking outside
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

    const handleAccept = async (
        invitationId: string,
    ) => {
        try {
            setProcessingId(invitationId);

            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                toast.error(
                    'Your session has expired.',
                );

                return;
            }

            const response = await fetch(
                `http://localhost:3000/project-invitations/${invitationId}/accept`,
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
                        'Failed to accept invitation.',
                );

                return;
            }

            toast.success(
                'You joined the project successfully.',
            );

            setInvitations((current) =>
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

    const handleReject = async (
        invitationId: string,
    ) => {
        try {
            setProcessingId(invitationId);

            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                toast.error(
                    'Your session has expired.',
                );

                return;
            }

            const response = await fetch(
                `http://localhost:3000/project-invitations/${invitationId}/reject`,
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
                        'Failed to reject invitation.',
                );

                return;
            }

            toast.success(
                'Invitation rejected.',
            );

            setInvitations((current) =>
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

    if (loading || invitations.length === 0) {
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
                    setIsOpen((current) => !current)
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
                            You have pending project
                            invitations.
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
                                        <p className="font-mono text-xs font-semibold text-slate-900">
                                            Project invitation
                                        </p>

                                        <p className="mt-1 font-mono text-[10px] text-slate-400">
                                            project:{' '}
                                            {
                                                invitation.projectId
                                            }
                                        </p>

                                        <div className="mt-3 flex gap-2">
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
                                                className="flex-1 border border-emerald-500 bg-emerald-500 px-3 py-2 font-mono text-[10px] font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                accept
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
                                                className="flex-1 border border-gray-200 bg-white px-3 py-2 font-mono text-[10px] font-bold text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
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
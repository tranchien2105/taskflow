'use client';

import {
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { toast } from 'sonner';
import TaskLabels from './TaskLabels';

const API_URL = 'http://localhost:3000';

type User = {
    id: string;
    name?: string | null;
    fullName?: string | null;
    email?: string | null;
};

type Task = {
    id: string;
    projectId: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    dueDate?: string | null;

    assigneeId?: string | null;
    assignee?: User | null;
};

type ProjectMember = {
    id?: string;
    userId?: string;
    user?: User | null;
    role?: string;
};

type TaskDetailModalProps = {
    task: Task;
    onClose: () => void;
    onUpdated?: (task: Task) => void;
    onDeleted?: (taskId: string) => void;
    canManage?: boolean;
};

type Label = {
    id: string;
    name: string;
    color: string;
};

const STATUS_OPTIONS = [
    'TODO',
    'IN_PROGRESS',
    'REVIEW',
    'DONE',
];

const PRIORITY_OPTIONS = [
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT',
];

export default function TaskDetailModal({
    task,
    onClose,
    onUpdated,
    onDeleted,
    canManage = false,
}: TaskDetailModalProps) {
    const [editing, setEditing] = useState(false);

    const [title, setTitle] = useState(task.title);

    const [description, setDescription] = useState(
        task.description ?? '',
    );

    const [status, setStatus] = useState(task.status);

    const [priority, setPriority] = useState(
        task.priority,
    );

    const [dueDate, setDueDate] = useState(
        task.dueDate ?? '',
    );

    /*
     * ----------------------------------------
     * Assignee
     * ----------------------------------------
     */

    const [assigneeId, setAssigneeId] = useState<
        string | null
    >(task.assigneeId ?? task.assignee?.id ?? null);

    const [members, setMembers] = useState<
        ProjectMember[]
    >([]);

    const [loadingMembers, setLoadingMembers] =
        useState(false);

    /*
     * ----------------------------------------
     * Labels
     * ----------------------------------------
     */

    const [labels, setLabels] = useState<Label[]>([]);

    const [selectedLabelIds, setSelectedLabelIds] =
        useState<string[]>([]);

    const [initialLabelIds, setInitialLabelIds] =
        useState<string[]>([]);

    const [loadingLabels, setLoadingLabels] =
        useState(false);

    /*
     * ----------------------------------------
     * UI state
     * ----------------------------------------
     */

    const [saving, setSaving] = useState(false);

    const [deleting, setDeleting] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(false);

    /*
     * ----------------------------------------
     * Helpers
     * ----------------------------------------
     */

    const getToken = () => {
        return localStorage.getItem('accessToken');
    };

    const getResponseData = (data: any) => {
        return data?.data ?? data;
    };

    const getUserName = (user?: User | null) => {
        if (!user) {
            return 'Unassigned';
        }

        return (
            user.name ||
            user.fullName ||
            user.email ||
            'Unknown user'
        );
    };

    const getInitials = (user?: User | null) => {
        if (!user) {
            return '?';
        }

        const name =
            user.name ||
            user.fullName ||
            user.email ||
            '';

        const parts = name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 0) {
            return '?';
        }

        if (parts.length === 1) {
            return parts[0]
                .slice(0, 2)
                .toUpperCase();
        }

        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    };

    const getMemberUser = (
        member: ProjectMember,
    ): User | null => {
        if (member.user) {
            return member.user;
        }

        if (member.userId) {
            return {
                id: member.userId,
            };
        }

        return null;
    };

    /*
     * ----------------------------------------
     * Sync task state
     * ----------------------------------------
     */

    useEffect(() => {
        setTitle(task.title);

        setDescription(
            task.description ?? '',
        );

        setStatus(task.status);

        setPriority(task.priority);

        setDueDate(task.dueDate ?? '');

        setAssigneeId(
            task.assigneeId ??
            task.assignee?.id ??
            null,
        );
    }, [task]);

    /*
     * ----------------------------------------
     * Load project members
     * ----------------------------------------
     */

    useEffect(() => {
        if (!editing || !canManage) {
            return;
        }

        const loadMembers = async () => {
            try {
                setLoadingMembers(true);

                const token = getToken();

                if (!token) {
                    toast.error(
                        'Your session has expired.',
                    );

                    return;
                }

                const response = await fetch(
                    `${API_URL}/projects/${task.projectId}/members`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                const data = await response.json();

                if (!response.ok) {
                    toast.error(
                        data?.message ||
                        'Failed to load project members.',
                    );

                    return;
                }

                const responseData =
                    getResponseData(data);

                const projectMembers =
                    Array.isArray(responseData)
                        ? responseData
                        : [];

                setMembers(projectMembers);
            } catch (error) {
                console.error(
                    'Load project members failed:',
                    error,
                );

                toast.error(
                    'Unable to load project members.',
                );
            } finally {
                setLoadingMembers(false);
            }
        };

        loadMembers();
    }, [
        editing,
        canManage,
        task.projectId,
    ]);

    /*
     * ----------------------------------------
     * Load labels
     * ----------------------------------------
     */

    useEffect(() => {
        if (!editing || !canManage) {
            return;
        }

        const loadLabels = async () => {
            try {
                setLoadingLabels(true);

                const token = getToken();

                if (!token) {
                    toast.error(
                        'Your session has expired.',
                    );

                    return;
                }

                /*
                 * Load project labels
                 */

                const labelsResponse =
                    await fetch(
                        `${API_URL}/projects/${task.projectId}/labels`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );

                const labelsData =
                    await labelsResponse.json();

                if (!labelsResponse.ok) {
                    toast.error(
                        labelsData?.message ||
                        'Failed to load project labels.',
                    );

                    return;
                }

                const projectLabels =
                    getResponseData(labelsData);

                setLabels(
                    Array.isArray(projectLabels)
                        ? projectLabels
                        : [],
                );

                /*
                 * Load labels attached to task
                 */

                const taskLabelsResponse =
                    await fetch(
                        `${API_URL}/tasks/${task.id}/labels`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );

                const taskLabelsData =
                    await taskLabelsResponse.json();

                if (!taskLabelsResponse.ok) {
                    toast.error(
                        taskLabelsData?.message ||
                        'Failed to load task labels.',
                    );

                    return;
                }

                const taskLabels =
                    getResponseData(
                        taskLabelsData,
                    );

                const currentLabelIds =
                    Array.isArray(taskLabels)
                        ? taskLabels
                            .map(
                                (item) =>
                                    item.labelId ??
                                    item.label?.id,
                            )
                            .filter(
                                (
                                    id,
                                ): id is string =>
                                    Boolean(id),
                            )
                        : [];

                setInitialLabelIds(
                    currentLabelIds,
                );

                setSelectedLabelIds(
                    currentLabelIds,
                );
            } catch (error) {
                console.error(
                    'Load task labels failed:',
                    error,
                );

                toast.error(
                    'Unable to load task labels.',
                );
            } finally {
                setLoadingLabels(false);
            }
        };

        loadLabels();
    }, [
        editing,
        canManage,
        task.id,
        task.projectId,
    ]);

    /*
     * ----------------------------------------
     * Selected assignee
     * ----------------------------------------
     */

    const selectedMember = useMemo(() => {
        if (!assigneeId) {
            return null;
        }

        return (
            members.find((member) => {
                const user = getMemberUser(member);

                return user?.id === assigneeId;
            }) ?? null
        );
    }, [members, assigneeId]);

    const selectedMemberUser =
        selectedMember
            ? getMemberUser(selectedMember)
            : task.assignee &&
                task.assignee.id === assigneeId
                ? task.assignee
                : null;

    /*
     * ----------------------------------------
     * Label selection
     * ----------------------------------------
     */

    const toggleLabel = (
        labelId: string,
    ) => {
        setSelectedLabelIds((current) => {
            if (current.includes(labelId)) {
                return current.filter(
                    (id) => id !== labelId,
                );
            }

            return [...current, labelId];
        });
    };

    const selectedLabels = useMemo(() => {
        return labels.filter((label) =>
            selectedLabelIds.includes(
                label.id,
            ),
        );
    }, [
        labels,
        selectedLabelIds,
    ]);

    /*
     * ----------------------------------------
     * Sync labels
     * ----------------------------------------
     */

    const syncTaskLabels = async (
        token: string,
    ) => {
        const removedLabelIds =
            initialLabelIds.filter(
                (id) =>
                    !selectedLabelIds.includes(id),
            );

        const addedLabelIds =
            selectedLabelIds.filter(
                (id) =>
                    !initialLabelIds.includes(id),
            );

        const removeResults =
            await Promise.allSettled(
                removedLabelIds.map(
                    async (labelId) => {
                        const response =
                            await fetch(
                                `${API_URL}/tasks/${task.id}/labels/${labelId}`,
                                {
                                    method: 'DELETE',
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                },
                            );

                        if (!response.ok) {
                            let data: any = null;

                            try {
                                data =
                                    await response.json();
                            } catch {
                                // No JSON body.
                            }

                            throw new Error(
                                data?.message ||
                                'Failed to remove label.',
                            );
                        }
                    },
                ),
            );

        const addResults =
            await Promise.allSettled(
                addedLabelIds.map(
                    async (labelId) => {
                        const response =
                            await fetch(
                                `${API_URL}/tasks/${task.id}/labels/${labelId}`,
                                {
                                    method: 'POST',
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                },
                            );

                        if (!response.ok) {
                            let data: any = null;

                            try {
                                data =
                                    await response.json();
                            } catch {
                                // No JSON body.
                            }

                            throw new Error(
                                data?.message ||
                                'Failed to attach label.',
                            );
                        }
                    },
                ),
            );

        const failedRemovals =
            removeResults.filter(
                (result) =>
                    result.status ===
                    'rejected',
            );

        const failedAdds =
            addResults.filter(
                (result) =>
                    result.status ===
                    'rejected',
            );

        return {
            failedRemovals,
            failedAdds,
        };
    };

    /*
     * ----------------------------------------
     * Update task
     * ----------------------------------------
     */

    const handleUpdate = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (!title.trim()) {
            toast.error(
                'Task title is required.',
            );

            return;
        }

        try {
            setSaving(true);

            const token = getToken();

            if (!token) {
                toast.error(
                    'Your session has expired.',
                );

                return;
            }

            /*
             * Update task
             */

            const response = await fetch(
                `${API_URL}/tasks/${task.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type':
                            'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: title.trim(),

                        description:
                            description.trim() ||
                            undefined,

                        status,

                        priority,

                        dueDate:
                            dueDate || undefined,

                        /*
                         * Important:
                         * null means remove assignee.
                         */
                        assigneeId:
                            assigneeId || null,
                    }),
                },
            );

            const data =
                await response.json();

            if (!response.ok) {
                toast.error(
                    data?.message ||
                    'Failed to update task.',
                );

                return;
            }

            const updatedTask =
                getResponseData(data);

            /*
             * Sync labels
             */

            let labelSyncFailed = false;

            if (canManage) {
                const {
                    failedRemovals,
                    failedAdds,
                } =
                    await syncTaskLabels(
                        token,
                    );

                labelSyncFailed =
                    failedRemovals.length > 0 ||
                    failedAdds.length > 0;
            }

            /*
             * Update local snapshots
             */

            setInitialLabelIds(
                selectedLabelIds,
            );

            /*
             * Notify parent
             */

            onUpdated?.({
                ...task,
                ...updatedTask,
                assigneeId,
                assignee:
                    selectedMemberUser ??
                    (assigneeId
                        ? task.assignee
                        : null),
            });

            if (labelSyncFailed) {
                toast.warning(
                    'Task updated, but some labels could not be synchronized.',
                );
            } else {
                toast.success(
                    'Task updated successfully.',
                );
            }

            setEditing(false);
        } catch (error) {
            console.error(
                'Update task failed:',
                error,
            );

            toast.error(
                'Unable to connect to the server.',
            );
        } finally {
            setSaving(false);
        }
    };

    /*
     * ----------------------------------------
     * Delete task
     * ----------------------------------------
     */

    const handleDelete = async () => {
        try {
            setDeleting(true);

            const token = getToken();

            if (!token) {
                toast.error(
                    'Your session has expired.',
                );

                return;
            }

            const response = await fetch(
                `${API_URL}/tasks/${task.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            let data: any = null;

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
                    data?.message ||
                    'Failed to delete task.',
                );

                return;
            }

            toast.success(
                'Task deleted successfully.',
            );

            onDeleted?.(task.id);
        } catch (error) {
            console.error(
                'Delete task failed:',
                error,
            );

            toast.error(
                'Unable to connect to the server.',
            );
        } finally {
            setDeleting(false);
        }
    };

    /*
     * ----------------------------------------
     * Cancel edit
     * ----------------------------------------
     */

    const handleCancelEdit = () => {
        setTitle(task.title);

        setDescription(
            task.description ?? '',
        );

        setStatus(task.status);

        setPriority(task.priority);

        setDueDate(
            task.dueDate ?? '',
        );

        setAssigneeId(
            task.assigneeId ??
            task.assignee?.id ??
            null,
        );

        setSelectedLabelIds(
            initialLabelIds,
        );

        setEditing(false);
    };

    /*
     * ----------------------------------------
     * Styles
     * ----------------------------------------
     */

    const priorityStyle =
        task.priority === 'URGENT'
            ? 'bg-red-50 text-red-600 border-red-100'
            : task.priority === 'HIGH'
                ? 'bg-orange-50 text-orange-600 border-orange-100'
                : task.priority === 'MEDIUM'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                    : 'bg-slate-100 text-slate-600 border-[#eadde7]';

    const statusStyle =
        task.status === 'DONE'
            ? 'bg-green-50 text-green-700 border-green-100'
            : task.status === 'IN_PROGRESS'
                ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100'
                : task.status === 'REVIEW'
                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                    : 'bg-slate-100 text-slate-600 border-[#eadde7]';

    /*
     * ----------------------------------------
     * Render
     * ----------------------------------------
     */

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-[#fff7fb] shadow-lg"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >
                {/*
                 * ----------------------------------------
                 * Delete confirmation
                 * ----------------------------------------
                 */}

                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#fff7fb]/95 p-6 backdrop-blur-sm">
                        <div className="w-full max-w-sm text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-600">
                                !
                            </div>

                            <h3 className="mt-4 text-lg font-bold text-slate-900">
                                Delete this task?
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Are you sure you
                                want to delete{' '}
                                <span className="font-semibold text-slate-700">
                                    "{task.title}"
                                </span>
                                ?
                            </p>

                            <div className="mt-6 flex justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowDeleteConfirm(
                                            false,
                                        )
                                    }
                                    disabled={
                                        deleting
                                    }
                                    className="rounded-lg border border-[#eadde7] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleDelete
                                    }
                                    disabled={
                                        deleting
                                    }
                                    className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {deleting
                                        ? 'Deleting...'
                                        : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/*
                 * ----------------------------------------
                 * Header
                 * ----------------------------------------
                 */}

                <div className="flex shrink-0 items-start justify-between border-b border-[#f3e8f0] bg-white px-6 py-5">
                    <div className="min-w-0 pr-4">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-600">
                            {editing
                                ? 'Edit task'
                                : 'Task details'}
                        </p>

                        <h2 className="break-words text-xl font-bold text-slate-900 sm:text-2xl">
                            {editing
                                ? 'Update task'
                                : task.title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/*
                 * ========================================
                 * EDIT MODE
                 * ========================================
                 */}

                {editing ? (
                    <form
                        onSubmit={handleUpdate}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <div className="space-y-6 px-6 py-6">
                                {/*
                                 * Title
                                 */}

                                <div>
                                    <label
                                        htmlFor="task-title"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Title
                                    </label>

                                    <input
                                        id="task-title"
                                        type="text"
                                        value={title}
                                        onChange={(
                                            event,
                                        ) =>
                                            setTitle(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        maxLength={200}
                                        disabled={
                                            saving
                                        }
                                        autoFocus
                                        className="w-full rounded-lg border border-[#eadde7] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-50 disabled:bg-[#fffafe]"
                                        placeholder="Task title"
                                    />
                                </div>

                                {/*
                                 * Description
                                 */}

                                <div>
                                    <label
                                        htmlFor="task-description"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Description
                                        <span className="ml-1 font-normal text-slate-400">
                                            (optional)
                                        </span>
                                    </label>

                                    <textarea
                                        id="task-description"
                                        value={
                                            description
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setDescription(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        rows={4}
                                        disabled={
                                            saving
                                        }
                                        className="w-full resize-none rounded-lg border border-[#eadde7] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-50 disabled:bg-[#fffafe]"
                                        placeholder="Describe this task..."
                                    />
                                </div>

                                {/*
                                 * Status + Priority
                                 */}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="task-status"
                                            className="mb-2 block text-sm font-semibold text-slate-700"
                                        >
                                            Status
                                        </label>

                                        <select
                                            id="task-status"
                                            value={
                                                status
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setStatus(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            disabled={
                                                saving
                                            }
                                            className="w-full rounded-lg border border-[#eadde7] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-50 disabled:bg-[#fffafe]"
                                        >
                                            {STATUS_OPTIONS.map(
                                                (
                                                    option,
                                                ) => (
                                                    <option
                                                        key={
                                                            option
                                                        }
                                                        value={
                                                            option
                                                        }
                                                    >
                                                        {option.replace(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="task-priority"
                                            className="mb-2 block text-sm font-semibold text-slate-700"
                                        >
                                            Priority
                                        </label>

                                        <select
                                            id="task-priority"
                                            value={
                                                priority
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setPriority(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            disabled={
                                                saving
                                            }
                                            className="w-full rounded-lg border border-[#eadde7] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-50 disabled:bg-[#fffafe]"
                                        >
                                            {PRIORITY_OPTIONS.map(
                                                (
                                                    option,
                                                ) => (
                                                    <option
                                                        key={
                                                            option
                                                        }
                                                        value={
                                                            option
                                                        }
                                                    >
                                                        {
                                                            option
                                                        }
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {/*
                                 * Assignee
                                 */}

                                {canManage && (
                                    <div>
                                        <div className="mb-2">
                                            <label
                                                htmlFor="task-assignee"
                                                className="block text-sm font-semibold text-slate-700"
                                            >
                                                Assignee
                                            </label>

                                            <p className="mt-0.5 text-xs text-slate-400">
                                                Assign this
                                                task to a
                                                member of
                                                the project.
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-[#eadde7] bg-white p-3">
                                            {loadingMembers ? (
                                                <div className="h-12 animate-pulse rounded-lg bg-slate-200" />
                                            ) : (
                                                <select
                                                    id="task-assignee"
                                                    value={
                                                        assigneeId ??
                                                        ''
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setAssigneeId(
                                                            event
                                                                .target
                                                                .value ||
                                                            null,
                                                        )
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                    className="w-full rounded-lg border border-[#eadde7] bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-50 disabled:bg-[#fffafe]"
                                                >
                                                    <option value="">
                                                        Unassigned
                                                    </option>

                                                    {members.map(
                                                        (
                                                            member,
                                                        ) => {
                                                            const user =
                                                                getMemberUser(
                                                                    member,
                                                                );

                                                            if (
                                                                !user
                                                            ) {
                                                                return null;
                                                            }

                                                            return (
                                                                <option
                                                                    key={
                                                                        user.id
                                                                    }
                                                                    value={
                                                                        user.id
                                                                    }
                                                                >
                                                                    {getUserName(
                                                                        user,
                                                                    )}
                                                                    {user.email
                                                                        ? ` — ${user.email}`
                                                                        : ''}
                                                                </option>
                                                            );
                                                        },
                                                    )}
                                                </select>
                                            )}
                                        </div>

                                        {assigneeId &&
                                            selectedMemberUser && (
                                                <div className="mt-3 flex items-center gap-3 rounded-lg border border-fuchsia-100 bg-fuchsia-50/60 p-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fuchsia-600 text-xs font-bold text-white">
                                                        {getInitials(
                                                            selectedMemberUser,
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-slate-900">
                                                            {getUserName(
                                                                selectedMemberUser,
                                                            )}
                                                        </p>

                                                        {selectedMemberUser.email && (
                                                            <p className="truncate text-xs text-slate-500">
                                                                {
                                                                    selectedMemberUser.email
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                )}

                                {/*
                                 * Due date
                                 */}

                                <div>
                                    <label
                                        htmlFor="task-due-date"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Due date
                                        <span className="ml-1 font-normal text-slate-400">
                                            (optional)
                                        </span>
                                    </label>

                                    <input
                                        id="task-due-date"
                                        type="date"
                                        value={
                                            dueDate
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setDueDate(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            saving
                                        }
                                        className="w-full rounded-lg border border-[#eadde7] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-50 disabled:bg-[#fffafe]"
                                    />
                                </div>

                                {/*
                                 * Labels
                                 */}

                                {canManage && (
                                    <div>
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700">
                                                    Labels
                                                </label>

                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    Organize
                                                    this task
                                                    with
                                                    project
                                                    labels.
                                                </p>
                                            </div>

                                            {!loadingLabels &&
                                                labels.length >
                                                0 && (
                                                    <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-semibold text-fuchsia-600">
                                                        {
                                                            selectedLabelIds.length
                                                        }{' '}
                                                        selected
                                                    </span>
                                                )}
                                        </div>

                                        <div className="rounded-lg border border-[#eadde7] bg-white p-4">
                                            {loadingLabels ? (
                                                <div className="space-y-3">
                                                    <div className="h-10 animate-pulse rounded-lg bg-slate-200" />

                                                    <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
                                                </div>
                                            ) : labels.length ===
                                                0 ? (
                                                <div className="rounded-lg border border-dashed border-[#dfd0dc] bg-white px-4 py-5 text-center">
                                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                                        #
                                                    </div>

                                                    <p className="mt-3 text-sm font-medium text-slate-700">
                                                        No labels
                                                        available
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Create a
                                                        project
                                                        label
                                                        first.
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    {selectedLabels.length >
                                                        0 && (
                                                            <div className="mb-4 rounded-lg border border-fuchsia-100 bg-fuchsia-50/60 p-3">
                                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-600">
                                                                    Selected
                                                                </p>

                                                                <div className="flex flex-wrap gap-2">
                                                                    {selectedLabels.map(
                                                                        (
                                                                            label,
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    label.id
                                                                                }
                                                                                className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                                                                            >
                                                                                <span
                                                                                    className="h-2.5 w-2.5 rounded-full"
                                                                                    style={{
                                                                                        backgroundColor:
                                                                                            label.color,
                                                                                    }}
                                                                                />

                                                                                {
                                                                                    label.name
                                                                                }
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                    <div className="flex flex-wrap gap-2">
                                                        {labels.map(
                                                            (
                                                                label,
                                                            ) => {
                                                                const selected =
                                                                    selectedLabelIds.includes(
                                                                        label.id,
                                                                    );

                                                                return (
                                                                    <button
                                                                        key={
                                                                            label.id
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            toggleLabel(
                                                                                label.id,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            saving
                                                                        }
                                                                        className={`group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${selected
                                                                                ? 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 shadow-sm ring-2 ring-fuchsia-100'
                                                                                : 'border-[#eadde7] bg-white text-slate-700 hover:border-[#dfd0dc] hover:bg-[#fffafe] hover:shadow-sm'
                                                                            } disabled:cursor-not-allowed disabled:opacity-50`}
                                                                    >
                                                                        <span
                                                                            className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    label.color,
                                                                            }}
                                                                        />

                                                                        <span>
                                                                            {
                                                                                label.name
                                                                            }
                                                                        </span>

                                                                        <span
                                                                            className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${selected
                                                                                    ? 'bg-fuchsia-600 text-white'
                                                                                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                                                                }`}
                                                                        >
                                                                            {selected
                                                                                ? '✓'
                                                                                : '+'}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            },
                                                        )}
                                                    </div>

                                                    {selectedLabelIds.length >
                                                        0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedLabelIds(
                                                                        [],
                                                                    )
                                                                }
                                                                disabled={
                                                                    saving
                                                                }
                                                                className="mt-4 text-xs font-medium text-slate-400 transition hover:text-red-500 disabled:opacity-50"
                                                            >
                                                                Clear
                                                                all
                                                                labels
                                                            </button>
                                                        )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/*
                         * Edit footer
                         */}

                        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#f3e8f0] bg-white px-6 py-4">
                            <button
                                type="button"
                                onClick={
                                    handleCancelEdit
                                }
                                disabled={saving}
                                className="rounded-lg border border-[#eadde7] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    saving ||
                                    !title.trim()
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-fuchsia-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving && (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                )}

                                {saving
                                    ? 'Saving...'
                                    : 'Save changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    /*
                     * ========================================
                     * DETAIL MODE
                     * ========================================
                     */

                    <>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <div className="space-y-6 px-6 py-6">
                                {/*
                                 * Status + Priority
                                 */}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-lg border border-[#f3e8f0] bg-[#fffafe] p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Status
                                        </p>

                                        <span
                                            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}
                                        >
                                            {task.status.replace(
                                                '_',
                                                ' ',
                                            )}
                                        </span>
                                    </div>

                                    <div className="rounded-lg border border-[#f3e8f0] bg-[#fffafe] p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Priority
                                        </p>

                                        <span
                                            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityStyle}`}
                                        >
                                            {
                                                task.priority
                                            }
                                        </span>
                                    </div>
                                </div>

                                {/*
                                 * Assignee
                                 */}

                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Assignee
                                    </h3>

                                    <div className="mt-2 rounded-lg border border-[#f3e8f0] bg-[#fffafe] p-4">
                                        {task.assignee ? (
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fuchsia-600 text-sm font-bold text-white shadow-sm">
                                                    {getInitials(
                                                        task.assignee,
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-900">
                                                        {getUserName(
                                                            task.assignee,
                                                        )}
                                                    </p>

                                                    {task.assignee
                                                        .email && (
                                                            <p className="mt-0.5 truncate text-xs text-slate-500">
                                                                {
                                                                    task
                                                                        .assignee
                                                                        .email
                                                                }
                                                            </p>
                                                        )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-slate-400">
                                                    ?
                                                </div>

                                                <div>
                                                    <p className="text-sm font-semibold text-slate-600">
                                                        Unassigned
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                        No one is
                                                        assigned
                                                        to this
                                                        task.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/*
                                 * Description
                                 */}

                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Description
                                    </h3>

                                    <div className="mt-2 rounded-lg border border-[#f3e8f0] bg-[#fffafe] p-4">
                                        {task.description ? (
                                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                                {
                                                    task.description
                                                }
                                            </p>
                                        ) : (
                                            <p className="text-sm italic text-slate-400">
                                                No description
                                                provided.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/*
                                 * Labels
                                 */}

                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Labels
                                        </h3>
                                    </div>

                                    <div className="rounded-lg border border-[#f3e8f0] bg-[#fffafe] p-4">
                                        <TaskLabels
                                            taskId={
                                                task.id
                                            }
                                            projectId={
                                                task.projectId
                                            }
                                            canManage={
                                                canManage
                                            }
                                        />
                                    </div>
                                </div>

                                {/*
                                 * Due date
                                 */}

                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Due date
                                    </h3>

                                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-[#f3e8f0] bg-[#fffafe] p-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fuchsia-50 text-fuchsia-600">
                                            📅
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {task.dueDate
                                                    ? task.dueDate
                                                    : 'No due date'}
                                            </p>

                                            <p className="mt-0.5 text-xs text-slate-400">
                                                Task deadline
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/*
                         * Detail footer
                         */}

                        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#f3e8f0] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowDeleteConfirm(
                                        true,
                                    )
                                }
                                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                            >
                                Delete Task
                            </button>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-lg border border-[#eadde7] bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                    Close
                                </button>

                                {canManage && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditing(
                                                true,
                                            )
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg bg-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-fuchsia-700 hover:shadow-sm"
                                    >
                                        <span>
                                            ✎
                                        </span>

                                        Edit Task
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
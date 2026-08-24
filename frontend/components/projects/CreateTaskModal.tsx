'use client';

import {
    FormEvent,
    useEffect,
    useState,
} from 'react';
import { toast } from 'sonner';

type CreateTaskModalProps = {
    projectId: string;
    onClose: () => void;
    onCreated: () => void;
    canManage?: boolean;
};

type TaskStatus =
    | 'TODO'
    | 'IN_PROGRESS'
    | 'REVIEW'
    | 'DONE';

type TaskPriority =
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH'
    | 'URGENT';

type User = {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
};

type ProjectMember = {
    id: string;
    projectId: string;
    userId: string;
    role: string;
    user?: User;
};

type Label = {
    id: string;
    name: string;
    color: string;
};

export default function CreateTaskModal({
    projectId,
    onClose,
    onCreated,
    canManage = false,
}: CreateTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const [status, setStatus] =
        useState<TaskStatus>('TODO');

    const [priority, setPriority] =
        useState<TaskPriority>('MEDIUM');

    const [dueDate, setDueDate] = useState('');

    const [assigneeId, setAssigneeId] =
        useState('');

    const [members, setMembers] =
        useState<ProjectMember[]>([]);

    const [labels, setLabels] =
        useState<Label[]>([]);

    const [selectedLabelIds, setSelectedLabelIds] =
        useState<string[]>([]);

    const [loadingMembers, setLoadingMembers] =
        useState(true);

    const [loadingLabels, setLoadingLabels] =
        useState(true);

    const [loading, setLoading] = useState(false);

    const getToken = () => {
        return localStorage.getItem('accessToken');
    };

    useEffect(() => {
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
                        'Failed to load project members.',
                    );
                    return;
                }

                const memberData =
                    data.data ?? data;

                setMembers(
                    Array.isArray(memberData)
                        ? memberData
                        : memberData.data ?? [],
                );
            } catch (error) {
                console.error(error);

                toast.error(
                    'Unable to load project members.',
                );
            } finally {
                setLoadingMembers(false);
            }
        };

        loadMembers();
    }, [projectId]);

    useEffect(() => {
        const loadLabels = async () => {
            /*
             * Chỉ Manager cần labels ở bước Create.
             * Backend đang bảo vệ attach label bằng
             * TaskProjectManagerGuard.
             */
            if (!canManage) {
                setLoadingLabels(false);
                return;
            }

            try {
                setLoadingLabels(true);

                const token = getToken();

                if (!token) {
                    toast.error(
                        'Your session has expired.',
                    );
                    return;
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/labels`,
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
                        'Failed to load project labels.',
                    );
                    return;
                }

                const labelData =
                    data.data ?? data;

                setLabels(
                    Array.isArray(labelData)
                        ? labelData
                        : labelData.data ?? [],
                );
            } catch (error) {
                console.error(error);

                toast.error(
                    'Unable to load project labels.',
                );
            } finally {
                setLoadingLabels(false);
            }
        };

        loadLabels();
    }, [projectId, canManage]);

    const toggleLabel = (labelId: string) => {
        setSelectedLabelIds((current) => {
            if (current.includes(labelId)) {
                return current.filter(
                    (id) => id !== labelId,
                );
            }

            return [...current, labelId];
        });
    };

    const handleSubmit = async (
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
            setLoading(true);

            const token = getToken();

            if (!token) {
                toast.error(
                    'Your session has expired.',
                );
                return;
            }

            /*
             * 1. Create task
             */
            const response = await fetch(
                '${process.env.NEXT_PUBLIC_API_URL}/tasks',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                        Authorization:
                            `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        projectId,
                        title: title.trim(),
                        description:
                            description.trim() ||
                            undefined,
                        status,
                        priority,
                        dueDate:
                            dueDate || undefined,
                        assigneeId:
                            assigneeId || undefined,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                toast.error(
                    data.message ||
                    'Failed to create task.',
                );
                return;
            }

            const createdTask =
                data.data ?? data;

            /*
             * 2. Attach selected labels
             *
             * Label API requires taskId,
             * therefore this must happen after
             * the task has been created.
             */
            if (
                canManage &&
                selectedLabelIds.length > 0
            ) {
                const labelResults =
                    await Promise.allSettled(
                        selectedLabelIds.map(
                            async (labelId) => {
                                const labelResponse =
                                    await fetch(
                                        `${process.env.NEXT_PUBLIC_API_URL}/tasks/${createdTask.id}/labels/${labelId}`,
                                        {
                                            method: 'POST',
                                            headers: {
                                                Authorization:
                                                    `Bearer ${token}`,
                                            },
                                        },
                                    );

                                if (
                                    !labelResponse.ok
                                ) {
                                    const labelData =
                                        await labelResponse.json();

                                    throw new Error(
                                        labelData.message ||
                                        'Failed to attach label.',
                                    );
                                }
                            },
                        ),
                    );

                const failedLabels =
                    labelResults.filter(
                        (result) =>
                            result.status ===
                            'rejected',
                    );

                if (failedLabels.length > 0) {
                    toast.warning(
                        'Task created, but some labels could not be attached.',
                    );
                }
            }

            toast.success(
                'Task created successfully!',
            );

            onCreated();
            onClose();
        } catch (error) {
            console.error(
                'Create task failed:',
                error,
            );

            toast.error(
                'Unable to connect to the server.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !loading
                ) {
                    onClose();
                }
            }}
        >
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden border border-pink-100 bg-white shadow-2xl">

                {/* Header */}
                <div className="flex shrink-0 items-start justify-between border-b border-pink-100 bg-[#fff7fa] px-6 py-5">
                    <div>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-pink-500">
                            // new-task
                        </p>

                        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                            Create Task
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Add a new task to this project.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center border border-slate-200 bg-white font-mono text-lg text-slate-400 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="overflow-y-auto"
                >
                    <div className="space-y-5 p-6">

                        {/* Title */}
                        <div>
                            <label
                                htmlFor="task-title"
                                className="mb-2 block font-mono text-xs font-bold uppercase tracking-wide text-slate-600"
                            >
                                title
                            </label>

                            <input
                                id="task-title"
                                type="text"
                                value={title}
                                onChange={(event) =>
                                    setTitle(
                                        event.target.value,
                                    )
                                }
                                placeholder="e.g. Implement login page"
                                maxLength={200}
                                disabled={loading}
                                autoFocus
                                className="w-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 disabled:bg-slate-50"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                htmlFor="task-description"
                                className="mb-2 block font-mono text-xs font-bold uppercase tracking-wide text-slate-600"
                            >
                                description
                                <span className="ml-1 font-mono font-normal normal-case tracking-normal text-slate-400">
                                    (optional)
                                </span>
                            </label>

                            <textarea
                                id="task-description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value,
                                    )
                                }
                                placeholder="Describe what needs to be done..."
                                rows={4}
                                disabled={loading}
                                className="w-full resize-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 disabled:bg-slate-50"
                            />
                        </div>

                        {/* Status + Priority */}
                        <div className="grid gap-4 sm:grid-cols-2">

                            {/* Status */}
                            <div>
                                <label
                                    htmlFor="task-status"
                                    className="mb-2 block font-mono text-xs font-bold uppercase tracking-wide text-slate-600"
                                >
                                    status
                                </label>

                                <select
                                    id="task-status"
                                    value={status}
                                    onChange={(event) =>
                                        setStatus(
                                            event.target
                                                .value as TaskStatus,
                                        )
                                    }
                                    disabled={loading}
                                    className="w-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100 disabled:bg-slate-50"
                                >
                                    <option value="TODO">
                                        To do
                                    </option>

                                    <option value="IN_PROGRESS">
                                        In progress
                                    </option>

                                    <option value="REVIEW">
                                        Review
                                    </option>

                                    <option value="DONE">
                                        Done
                                    </option>
                                </select>
                            </div>

                            {/* Priority */}
                            <div>
                                <label
                                    htmlFor="task-priority"
                                    className="mb-2 block font-mono text-xs font-bold uppercase tracking-wide text-slate-600"
                                >
                                    priority
                                </label>

                                <select
                                    id="task-priority"
                                    value={priority}
                                    onChange={(event) =>
                                        setPriority(
                                            event.target
                                                .value as TaskPriority,
                                        )
                                    }
                                    disabled={loading}
                                    className="w-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100 disabled:bg-slate-50"
                                >
                                    <option value="LOW">
                                        Low
                                    </option>

                                    <option value="MEDIUM">
                                        Medium
                                    </option>

                                    <option value="HIGH">
                                        High
                                    </option>

                                    <option value="URGENT">
                                        Urgent
                                    </option>
                                </select>
                            </div>
                        </div>

                        {/* Assignee + Due date */}
                        <div className="grid gap-4 sm:grid-cols-2">

                            {/* Assignee */}
                            <div>
                                <label
                                    htmlFor="task-assignee"
                                    className="mb-2 block font-mono text-xs font-bold uppercase tracking-wide text-slate-600"
                                >
                                    assignee
                                    <span className="ml-1 font-mono font-normal normal-case tracking-normal text-slate-400">
                                        (optional)
                                    </span>
                                </label>

                                <select
                                    id="task-assignee"
                                    value={assigneeId}
                                    onChange={(event) =>
                                        setAssigneeId(
                                            event.target
                                                .value,
                                        )
                                    }
                                    disabled={
                                        loading ||
                                        loadingMembers
                                    }
                                    className="w-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100 disabled:bg-slate-50"
                                >
                                    <option value="">
                                        Unassigned
                                    </option>

                                    {members.map(
                                        (member) => (
                                            <option
                                                key={
                                                    member.userId
                                                }
                                                value={
                                                    member.userId
                                                }
                                            >
                                                {member.user
                                                    ?.name ||
                                                    member.user
                                                        ?.email ||
                                                    member.userId}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>

                            {/* Due date */}
                            <div>
                                <label
                                    htmlFor="task-due-date"
                                    className="mb-2 block font-mono text-xs font-bold uppercase tracking-wide text-slate-600"
                                >
                                    due_date
                                    <span className="ml-1 font-mono font-normal normal-case tracking-normal text-slate-400">
                                        (optional)
                                    </span>
                                </label>

                                <input
                                    id="task-due-date"
                                    type="date"
                                    value={dueDate}
                                    onChange={(event) =>
                                        setDueDate(
                                            event.target
                                                .value,
                                        )
                                    }
                                    disabled={loading}
                                    className="w-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100 disabled:bg-slate-50"
                                />
                            </div>
                        </div>

                        {/* Labels */}
                        {canManage && (
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="block font-mono text-xs font-bold uppercase tracking-wide text-slate-600">
                                        labels
                                    </label>

                                    <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">
                                        optional
                                    </span>
                                </div>

                                {loadingLabels ? (
                                    <div className="h-12 animate-pulse border border-slate-200 bg-slate-50" />
                                ) : labels.length === 0 ? (
                                    <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                        No labels available
                                        in this project.
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2 border border-slate-200 bg-slate-50 p-3">
                                        {labels.map(
                                            (label) => {
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
                                                            loading
                                                        }
                                                        className={`inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-xs font-semibold transition ${selected
                                                                ? 'border-pink-500 bg-pink-50 text-pink-600'
                                                                : 'border-slate-200 bg-white text-slate-600 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600'
                                                            }`}
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

                                                        {selected && (
                                                            <span className="text-pink-500">
                                                                ✓
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 justify-end gap-3 border-t border-pink-100 bg-[#fff7fa] px-6 py-4">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="inline-flex items-center justify-center border border-slate-200 bg-white px-4 py-2.5 font-mono text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !title.trim()
                            }
                            className="inline-flex items-center justify-center gap-2 border border-pink-500 bg-pink-500 px-4 py-2.5 font-mono text-xs font-bold text-white transition hover:bg-pink-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="h-4 w-4 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />

                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                        />
                                    </svg>

                                    creating...
                                </>
                            ) : (
                                <>
                                    <span className="text-base leading-none">
                                        +
                                    </span>

                                    new-task
                                </>
                            )}
                        </button>

                    </div>
                </form>
            </div>
        </div>
    );
}
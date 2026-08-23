'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Label = {
    id: string;
    name: string;
    color: string;
};

type TaskLabel = {
    id: string;
    taskId: string;
    labelId: string;
    label: Label;
};

type TaskLabelsProps = {
    taskId: string;
    projectId: string;
    canManage?: boolean;
};

export default function TaskLabels({
    taskId,
    projectId,
    canManage = false,
}: TaskLabelsProps) {
    const [taskLabels, setTaskLabels] = useState<TaskLabel[]>([]);
    const [projectLabels, setProjectLabels] = useState<Label[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);

    const getToken = () => {
        return localStorage.getItem('accessToken');
    };

    const loadLabels = async () => {
        try {
            setLoading(true);

            const token = getToken();

            if (!token) {
                toast.error('Your session has expired.');
                return;
            }

            const [taskLabelsResponse, projectLabelsResponse] =
                await Promise.all([
                    fetch(
                        `http://localhost:3000/tasks/${taskId}/labels`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    ),

                    fetch(
                        `http://localhost:3000/projects/${projectId}/labels`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    ),
                ]);

            const taskLabelsData =
                await taskLabelsResponse.json();

            const projectLabelsData =
                await projectLabelsResponse.json();

            if (!taskLabelsResponse.ok) {
                throw new Error(
                    taskLabelsData.message ||
                        'Failed to load task labels.',
                );
            }

            if (!projectLabelsResponse.ok) {
                throw new Error(
                    projectLabelsData.message ||
                        'Failed to load project labels.',
                );
            }

            setTaskLabels(
                taskLabelsData.data ?? taskLabelsData,
            );

            setProjectLabels(
                projectLabelsData.data ?? projectLabelsData,
            );
        } catch (error) {
            console.error(error);

            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Unable to load labels.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLabels();
    }, [taskId, projectId]);

    const handleAttach = async (labelId: string) => {
        if (!canManage) {
            return;
        }

        try {
            setProcessing(labelId);

            const token = getToken();

            if (!token) {
                toast.error('Your session has expired.');
                return;
            }

            const response = await fetch(
                `http://localhost:3000/tasks/${taskId}/labels/${labelId}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const data = await response.json();

            if (!response.ok) {
                toast.error(
                    data.message ||
                        'Failed to attach label.',
                );
                return;
            }

            const newTaskLabel = data.data ?? data;

            setTaskLabels((current) => [
                ...current,
                newTaskLabel,
            ]);

            setShowAdd(false);

            toast.success('Label added.');
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to connect to the server.',
            );
        } finally {
            setProcessing(null);
        }
    };

    const handleRemove = async (labelId: string) => {
        if (!canManage) {
            return;
        }

        try {
            setProcessing(labelId);

            const token = getToken();

            if (!token) {
                toast.error('Your session has expired.');
                return;
            }

            const response = await fetch(
                `http://localhost:3000/tasks/${taskId}/labels/${labelId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.ok) {
                let message = 'Failed to remove label.';

                try {
                    const data = await response.json();
                    message = data.message || message;
                } catch {
                    // DELETE response may not contain JSON.
                }

                toast.error(message);
                return;
            }

            setTaskLabels((current) =>
                current.filter(
                    (item) => item.labelId !== labelId,
                ),
            );

            toast.success('Label removed.');
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to connect to the server.',
            );
        } finally {
            setProcessing(null);
        }
    };

    const attachedLabelIds = new Set(
        taskLabels.map((item) => item.labelId),
    );

    const availableLabels = projectLabels.filter(
        (label) => !attachedLabelIds.has(label.id),
    );

    if (loading) {
        return (
            <div className="border-t border-pink-100 pt-5">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-4 w-16 animate-pulse bg-pink-100" />
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="h-7 w-20 animate-pulse bg-pink-50"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="border-t border-pink-100 pt-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-pink-500">
                            #
                        </span>

                        <h3 className="font-mono text-sm font-bold text-gray-900">
                            Labels
                        </h3>

                        {taskLabels.length > 0 && (
                            <span className="font-mono text-[11px] text-gray-400">
                                [{taskLabels.length}]
                            </span>
                        )}
                    </div>

                    {!canManage && (
                        <p className="mt-1 font-mono text-[11px] text-gray-400">
                            // view only
                        </p>
                    )}
                </div>

                {canManage && availableLabels.length > 0 && (
                    <button
                        type="button"
                        onClick={() =>
                            setShowAdd((current) => !current)
                        }
                        className="border border-pink-200 bg-pink-50 px-3 py-1.5 font-mono text-xs font-semibold text-pink-600 transition hover:border-pink-300 hover:bg-pink-100"
                    >
                        {showAdd
                            ? 'cancel'
                            : '+ add-label'}
                    </button>
                )}
            </div>

            {/* Current labels */}
            <div className="mt-4 flex flex-wrap gap-2">
                {taskLabels.length === 0 ? (
                    <div className="w-full border border-dashed border-pink-200 bg-pink-50/50 px-4 py-4">
                        <p className="font-mono text-xs text-gray-400">
                            // no labels assigned
                        </p>

                        {canManage &&
                            availableLabels.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAdd(true)
                                    }
                                    className="mt-2 font-mono text-xs font-semibold text-pink-600 transition hover:text-pink-700"
                                >
                                    + add first label
                                </button>
                            )}
                    </div>
                ) : (
                    taskLabels.map((taskLabel) => {
                        const isRemoving =
                            processing ===
                            taskLabel.labelId;

                        return (
                            <div
                                key={taskLabel.id}
                                className="inline-flex items-center gap-2 border border-gray-200 bg-white px-2.5 py-1.5 shadow-sm transition hover:border-pink-200"
                            >
                                <span
                                    className="h-2.5 w-2.5 shrink-0"
                                    style={{
                                        backgroundColor:
                                            taskLabel.label.color,
                                    }}
                                />

                                <span className="font-mono text-xs font-semibold text-gray-700">
                                    {taskLabel.label.name}
                                </span>

                                {canManage && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRemove(
                                                taskLabel.labelId,
                                            )
                                        }
                                        disabled={isRemoving}
                                        className="flex h-5 w-5 items-center justify-center font-mono text-xs text-gray-400 transition hover:bg-pink-50 hover:text-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-label={`Remove ${taskLabel.label.name}`}
                                    >
                                        {isRemoving
                                            ? '...'
                                            : '×'}
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add label panel */}
            {canManage && showAdd && (
                <div className="mt-4 border border-pink-200 bg-pink-50/60 p-4">
                    <div className="mb-3">
                        <p className="font-mono text-xs font-bold text-gray-800">
                            // add label
                        </p>

                        <p className="mt-1 font-mono text-[11px] text-gray-400">
                            Select a label from this project.
                        </p>
                    </div>

                    {availableLabels.length === 0 ? (
                        <div className="border border-gray-200 bg-white px-3 py-3">
                            <p className="font-mono text-xs text-gray-500">
                                All project labels are already
                                attached.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {availableLabels.map((label) => {
                                const isAdding =
                                    processing === label.id;

                                return (
                                    <button
                                        key={label.id}
                                        type="button"
                                        onClick={() =>
                                            handleAttach(
                                                label.id,
                                            )
                                        }
                                        disabled={
                                            processing !== null
                                        }
                                        className="group flex items-center gap-3 border border-gray-200 bg-white px-3 py-2.5 text-left transition hover:border-pink-300 hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <span
                                            className="h-3 w-3 shrink-0"
                                            style={{
                                                backgroundColor:
                                                    label.color,
                                            }}
                                        />

                                        <span className="min-w-0 flex-1 truncate font-mono text-xs font-semibold text-gray-700 group-hover:text-pink-700">
                                            {label.name}
                                        </span>

                                        {isAdding && (
                                            <span className="font-mono text-[10px] text-pink-500">
                                                adding...
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
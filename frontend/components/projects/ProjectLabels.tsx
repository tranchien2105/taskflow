'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Label = {
    id: string;
    name: string;
    color: string;
};

type ProjectLabelsProps = {
    projectId: string;
    canManage: boolean;
};

const API_URL = 'http://localhost:3000';

export default function ProjectLabels({
    projectId,
    canManage,
}: ProjectLabelsProps) {
    const [labels, setLabels] = useState<Label[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingLabel, setEditingLabel] =
        useState<Label | null>(null);

    const [name, setName] = useState('');
    const [color, setColor] = useState('#EC4899');

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const token =
        typeof window !== 'undefined'
            ? localStorage.getItem('accessToken')
            : null;

    const fetchLabels = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(
                `${API_URL}/projects/${projectId}/labels`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error(
                    'Failed to load labels',
                );
            }

            const data = await response.json();

            setLabels(data.data ?? data);
        } catch (err) {
            console.error(err);

            setError('Unable to load labels.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabels();
    }, [projectId]);

    const resetForm = () => {
        setName('');
        setColor('#EC4899');
        setEditingLabel(null);
        setShowForm(false);
        setError('');
    };

    const openCreateForm = () => {
        setEditingLabel(null);
        setName('');
        setColor('#EC4899');
        setError('');
        setShowForm(true);
    };

    const openEditForm = (label: Label) => {
        setEditingLabel(label);
        setName(label.name);
        setColor(label.color);
        setError('');
        setShowForm(true);
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (!name.trim()) {
            setError('Label name is required.');
            return;
        }

        try {
            setSaving(true);
            setError('');

            const isEditing = !!editingLabel;

            const url = isEditing
                ? `${API_URL}/projects/${projectId}/labels/${editingLabel.id}`
                : `${API_URL}/projects/${projectId}/labels`;

            const response = await fetch(url, {
                method: isEditing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type':
                        'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: name.trim(),
                    color,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    'Failed to save label',
                );
            }

            const savedLabel =
                data.data ?? data;

            if (isEditing) {
                setLabels((current) =>
                    current.map((label) =>
                        label.id === editingLabel.id
                            ? savedLabel
                            : label,
                    ),
                );

                toast.success(
                    'Label updated successfully.',
                );
            } else {
                setLabels((current) => [
                    savedLabel,
                    ...current,
                ]);

                toast.success(
                    'Label created successfully.',
                );
            }

            resetForm();
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to save label.',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (label: Label) => {
        const confirmed = window.confirm(
            `Delete label "${label.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        try {
            setError('');

            const response = await fetch(
                `${API_URL}/projects/${projectId}/labels/${label.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.ok) {
                const data =
                    await response
                        .json()
                        .catch(() => null);

                throw new Error(
                    data?.message ||
                    'Failed to delete label',
                );
            }

            setLabels((current) =>
                current.filter(
                    (item) =>
                        item.id !== label.id,
                ),
            );

            toast.success(
                'Label deleted successfully.',
            );
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to delete label.',
            );
        }
    };

    return (
        <section className="border border-pink-100 bg-white shadow-sm">
            {/* Header */}
            <div className="border-b border-pink-100 bg-pink-50/40 px-6 py-5 sm:px-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-pink-500">
                                #
                            </span>

                            <h2 className="font-mono text-base font-bold text-gray-900">
                                Project Labels
                            </h2>

                            {!loading && (
                                <span className="font-mono text-[11px] text-gray-400">
                                    [{labels.length}]
                                </span>
                            )}
                        </div>

                        <p className="mt-1 font-mono text-[11px] text-gray-400">
                            // organize tasks with project labels
                        </p>
                    </div>

                    {canManage && (
                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="inline-flex items-center justify-center gap-2 border border-pink-500 bg-pink-500 px-4 py-2.5 font-mono text-xs font-bold text-white transition hover:bg-pink-600 active:translate-y-px"
                        >
                            <span className="text-base leading-none">
                                +
                            </span>

                            new-label
                        </button>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="border-b border-red-100 bg-red-50 px-6 py-3 sm:px-7">
                    <p className="font-mono text-xs text-red-600">
                        error: {error}
                    </p>
                </div>
            )}

            {/* Create / Edit Form */}
            {showForm && canManage && (
                <form
                    onSubmit={handleSubmit}
                    className="border-b border-pink-100 bg-pink-50/30 px-6 py-5 sm:px-7"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-mono text-xs font-bold text-gray-900">
                                {editingLabel
                                    ? '// edit-label'
                                    : '// create-label'}
                            </p>

                            <p className="mt-1 font-mono text-[11px] text-gray-400">
                                Configure label properties.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={resetForm}
                            className="font-mono text-xs text-gray-400 transition hover:text-pink-600"
                        >
                            [cancel]
                        </button>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
                        {/* Name */}
                        <div>
                            <label
                                htmlFor="label-name"
                                className="mb-2 block font-mono text-xs font-bold text-gray-700"
                            >
                                name
                            </label>

                            <input
                                id="label-name"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target
                                            .value,
                                    )
                                }
                                maxLength={50}
                                placeholder="e.g. bug"
                                className="w-full border border-gray-200 bg-white px-3 py-2.5 font-mono text-xs text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                            />
                        </div>

                        {/* Color */}
                        <div>
                            <label
                                htmlFor="label-color"
                                className="mb-2 block font-mono text-xs font-bold text-gray-700"
                            >
                                color
                            </label>

                            <div className="flex h-[38px] items-center border border-gray-200 bg-white px-2">
                                <input
                                    id="label-color"
                                    type="color"
                                    value={color}
                                    onChange={(
                                        event,
                                    ) =>
                                        setColor(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0"
                                />

                                <span className="ml-2 pr-2 font-mono text-[11px] uppercase text-gray-500">
                                    {color}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-4 border border-dashed border-pink-200 bg-white px-4 py-3">
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                            preview
                        </p>

                        <div className="inline-flex items-center gap-2 border border-gray-200 px-2.5 py-1.5">
                            <span
                                className="h-2.5 w-2.5"
                                style={{
                                    backgroundColor:
                                        color,
                                }}
                            />

                            <span className="font-mono text-xs font-semibold text-gray-700">
                                {name.trim() ||
                                    'label-name'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="border border-pink-500 bg-pink-500 px-5 py-2.5 font-mono text-xs font-bold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? 'saving...'
                                : editingLabel
                                    ? 'save-changes'
                                    : 'create-label'}
                        </button>
                    </div>
                </form>
            )}

            {/* Labels */}
            <div className="p-6 sm:p-7">
                {loading ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-[68px] animate-pulse border border-pink-100 bg-pink-50/50"
                            />
                        ))}
                    </div>
                ) : labels.length === 0 ? (
                    <div className="border border-dashed border-pink-200 bg-pink-50/30 px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-pink-200 bg-white font-mono text-lg text-pink-500">
                            #
                        </div>

                        <h3 className="mt-4 font-mono text-sm font-bold text-gray-900">
                            No labels yet
                        </h3>

                        <p className="mt-1 font-mono text-[11px] text-gray-400">
                            // create a label to organize
                            your tasks
                        </p>

                        {canManage && (
                            <button
                                type="button"
                                onClick={
                                    openCreateForm
                                }
                                className="mt-5 font-mono text-xs font-bold text-pink-600 transition hover:text-pink-700"
                            >
                                + create-first-label
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {labels.map((label) => (
                            <div
                                key={label.id}
                                className="group flex items-center justify-between border border-gray-200 bg-white p-4 transition hover:border-pink-200 hover:bg-pink-50/20"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span
                                        className="h-3 w-3 shrink-0"
                                        style={{
                                            backgroundColor:
                                                label.color,
                                        }}
                                    />

                                    <div className="min-w-0">
                                        <p className="truncate font-mono text-xs font-bold text-gray-800">
                                            {label.name}
                                        </p>

                                        <p className="mt-0.5 font-mono text-[9px] uppercase text-gray-400">
                                            {label.color}
                                        </p>
                                    </div>
                                </div>

                                {canManage && (
                                    <div className="ml-3 flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEditForm(
                                                    label,
                                                )
                                            }
                                            className="border border-gray-200 px-2 py-1 font-mono text-[10px] font-semibold text-gray-500 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
                                        >
                                            edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDelete(
                                                    label,
                                                )
                                            }
                                            className="border border-red-100 px-2 py-1 font-mono text-[10px] font-semibold text-red-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                        >
                                            delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {!loading && labels.length > 0 && (
                <div className="border-t border-pink-100 bg-pink-50/30 px-6 py-3 sm:px-7">
                    <p className="font-mono text-[10px] text-gray-400">
                        {`// ${labels.length} ${labels.length === 1
                                ? 'label'
                                : 'labels'
                            } configured`}
                    </p>
                </div>
            )}
        </section>
    );
}
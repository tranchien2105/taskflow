'use client';

type Task = {
    id: string;
    projectId: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    dueDate?: string | null;
    assigneeId?: string | null;
    assignee?: {
        id: string;
        name?: string | null;
        email?: string | null;
        avatar?: string | null;
    } | null;
};

type TaskListProps = {
    tasks: Task[];
    loading?: boolean;
    onTaskClick?: (task: Task) => void;
};

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'DONE':
            return 'bg-emerald-50 text-emerald-700 ring-emerald-200';

        case 'IN_PROGRESS':
            return 'bg-sky-50 text-sky-700 ring-sky-200';

        case 'REVIEW':
            return 'bg-violet-50 text-violet-700 ring-violet-200';

        default:
            return 'bg-slate-100 text-slate-600 ring-slate-200';
    }
};

const getPriorityStyle = (priority: string) => {
    switch (priority) {
        case 'URGENT':
            return 'bg-rose-50 text-rose-700 ring-rose-200';

        case 'HIGH':
            return 'bg-orange-50 text-orange-700 ring-orange-200';

        case 'MEDIUM':
            return 'bg-amber-50 text-amber-700 ring-amber-200';

        default:
            return 'bg-slate-100 text-slate-600 ring-slate-200';
    }
};

const formatStatus = (status: string) => {
    return status.replace('_', ' ');
};

const getAssigneeName = (task: Task) => {
    return task.assignee?.name || task.assignee?.email || 'Unassigned';
};

const getAssigneeInitials = (task: Task) => {
    const name = getAssigneeName(task);

    if (name === 'Unassigned') {
        return '?';
    }

    const parts = name.trim().split(/\s+/).filter(Boolean);

    return parts.length === 1
        ? parts[0].slice(0, 2).toUpperCase()
        : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function TaskList({
    tasks,
    loading = false,
    onTaskClick,
}: TaskListProps) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="h-24 animate-pulse border border-pink-100 bg-white/80"
                    >
                        <div className="flex h-full items-center gap-4 px-5">
                            <div className="h-8 w-8 bg-pink-100" />

                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-1/3 bg-slate-100" />
                                <div className="h-3 w-2/3 bg-slate-100" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="border border-dashed border-pink-200 bg-white/70 px-6 py-14 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center border border-pink-200 bg-pink-50 font-mono text-lg font-bold text-pink-500">
                    {'>'}_
                </div>

                <h3 className="mt-5 font-mono text-sm font-bold text-slate-800">
                    No tasks yet
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                    Create your first task for this project.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tasks.map((task) => (
                <button
                    key={task.id}
                    type="button"
                    onClick={() => onTaskClick?.(task)}
                    className="group block w-full text-left"
                >
                    <div className="relative overflow-hidden border border-slate-200 bg-white/90 px-5 py-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition duration-200 hover:border-pink-300 hover:bg-white hover:shadow-[0_8px_24px_rgba(236,72,153,0.10)]">
                        {/* Pink accent */}
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-pink-300 opacity-0 transition group-hover:opacity-100" />

                        <div className="flex items-start gap-4">
                            {/* Task indicator */}
                            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 font-mono text-xs text-slate-400 transition group-hover:border-pink-200 group-hover:bg-pink-50 group-hover:text-pink-500">
                                #
                            </div>

                            <div className="min-w-0 flex-1">
                                {/* Title + badges */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <h3 className="truncate font-mono text-sm font-semibold text-slate-800 transition group-hover:text-pink-600">
                                            {task.title}
                                        </h3>

                                        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                                            task/{task.id.slice(0, 8)}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 flex-wrap gap-2">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${getStatusStyle(
                                                task.status,
                                            )}`}
                                        >
                                            {formatStatus(
                                                task.status,
                                            )}
                                        </span>

                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${getPriorityStyle(
                                                task.priority,
                                            )}`}
                                        >
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>

                                {/* Description */}
                                {task.description && (
                                    <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500">
                                        {task.description}
                                    </p>
                                )}

                                {/* Footer */}
                                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                                    {task.dueDate && (
                                        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                                            <span className="text-pink-400">
                                                //
                                            </span>

                                            <span>
                                                due:{' '}
                                                {task.dueDate}
                                            </span>
                                        </div>
                                    )}

                                    {!task.dueDate && (
                                        <div className="font-mono text-[11px] text-slate-300">
                                            // no deadline
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                                        <span className={`flex h-6 w-6 items-center justify-center border font-mono text-[10px] font-bold ${task.assignee ? 'border-pink-200 bg-pink-50 text-pink-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                                            {getAssigneeInitials(task)}
                                        </span>

                                        <span className="max-w-36 truncate">
                                            assignee: {getAssigneeName(task)}
                                        </span>
                                    </div>

                                    <div className="ml-auto hidden font-mono text-[11px] text-slate-300 transition group-hover:text-pink-400 sm:block">
                                        open →
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}

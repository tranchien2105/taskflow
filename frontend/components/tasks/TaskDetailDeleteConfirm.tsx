type TaskDetailDeleteConfirmProps = {
    taskTitle: string;
    deleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

export default function TaskDetailDeleteConfirm({
    taskTitle,
    deleting,
    onCancel,
    onConfirm,
}: TaskDetailDeleteConfirmProps) {
    return (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/95 p-6 backdrop-blur-sm">
            <div className="w-full max-w-sm text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center border border-rose-200 bg-rose-50 font-mono text-lg font-bold text-rose-500">!</div>
                <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-rose-500">{'// destructive-action'}</p>
                <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Delete this task?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                    Are you sure you want to delete <span className="font-semibold text-slate-700">&quot;{taskTitle}&quot;</span>?
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <button type="button" onClick={onCancel} disabled={deleting} className="border border-slate-200 bg-white px-4 py-2.5 font-mono text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">cancel</button>
                    <button type="button" onClick={onConfirm} disabled={deleting} className="border border-rose-500 bg-rose-500 px-5 py-2.5 font-mono text-xs font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50">{deleting ? 'deleting...' : 'delete-task'}</button>
                </div>
            </div>
        </div>
    );
}

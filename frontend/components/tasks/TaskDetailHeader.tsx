type TaskDetailHeaderProps = {
    title: string;
    editing: boolean;
    saving: boolean;
    onClose: () => void;
};

export default function TaskDetailHeader({ title, editing, saving, onClose }: TaskDetailHeaderProps) {
    return (
        <div className="flex shrink-0 items-start justify-between border-b border-pink-100 bg-[#fff7fa] px-6 py-5">
            <div className="min-w-0 pr-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-pink-500">{'// '}{editing ? 'edit-task' : 'task-details'}</p>
                <h2 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900">{editing ? 'Update Task' : title}</h2>
            </div>
            <button type="button" onClick={onClose} disabled={saving} className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate-200 bg-white font-mono text-lg text-slate-400 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Close">×</button>
        </div>
    );
}

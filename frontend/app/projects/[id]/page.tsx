'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import Navbar from '@/components/Navbar';
import TaskList from '@/components/tasks/TaskList';
import CreateTaskModal from '@/components/projects/CreateTaskModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import ProjectMembers from '@/components/projects/ProjectMembers';
import ProjectLabels from '@/components/projects/ProjectLabels';
import { useAuth } from '@/contexts/AuthContext';

type Project = {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    status: string;
    priority: string;
    startDate?: string | null;
    dueDate?: string | null;
    createdAt: string;
    updatedAt: string;
};

type Task = {
    id: string;
    projectId: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    dueDate?: string | null;
};

type ProjectMember = {
    id: string;
    projectId: string;
    userId: string;
    role: 'MANAGER' | 'MEMBER';
    user?: {
        id: string;
        name: string;
        email: string;
        avatar?: string | null;
    };
};

export default function ProjectDetailPage() {
    const { user, loading: authLoading } = useAuth();

    const router = useRouter();
    const params = useParams();

    const projectId = params.id as string;

    const [project, setProject] =
        useState<Project | null>(null);

    const [tasks, setTasks] = useState<Task[]>([]);

    const [members, setMembers] =
        useState<ProjectMember[]>([]);

    const [loading, setLoading] = useState(true);

    const [tasksLoading, setTasksLoading] =
        useState(true);

    const [membersLoading, setMembersLoading] =
        useState(true);

    const [showCreateTask, setShowCreateTask] =
        useState(false);

    const [selectedTask, setSelectedTask] =
        useState<Task | null>(null);

    const [canManage, setCanManage] =
        useState(false);

    const fetchProject = async () => {
        try {
            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                router.replace('/login');
                return;
            }

            const response = await fetch(
                `http://localhost:3000/projects/${projectId}`,
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
                        'Failed to load project.',
                );

                return;
            }

            setProject(data.data ?? data);
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to connect to the server.',
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            setTasksLoading(true);

            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                router.replace('/login');
                return;
            }

            const response = await fetch(
                `http://localhost:3000/tasks?projectId=${projectId}`,
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
                        'Failed to load tasks.',
                );

                return;
            }

            const taskData = data.data ?? data;

            setTasks(
                Array.isArray(taskData)
                    ? taskData
                    : taskData.data ?? [],
            );
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to load tasks.',
            );
        } finally {
            setTasksLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            setMembersLoading(true);

            const token =
                localStorage.getItem('accessToken');

            if (!token) {
                router.replace('/login');
                return;
            }

            const response = await fetch(
                `http://localhost:3000/projects/${projectId}/members`,
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

            const memberData = data.data ?? data;

            const memberList: ProjectMember[] =
                Array.isArray(memberData)
                    ? memberData
                    : memberData.data ?? [];

            setMembers(memberList);

            /*
             * Xác định user hiện tại có phải
             * Project Manager hay không.
             */
            const currentMember = memberList.find(
                (member) =>
                    member.userId === user?.userId,
            );

            setCanManage(
                currentMember?.role === 'MANAGER',
            );
        } catch (error) {
            console.error(error);

            toast.error(
                'Unable to load project members.',
            );
        } finally {
            setMembersLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
            return;
        }

        if (user && projectId) {
            fetchProject();
            fetchTasks();
            fetchMembers();
        }
    }, [
        authLoading,
        user,
        projectId,
    ]);

    /*
     * ========================================
     * Loading
     * ========================================
     */

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#fff7fa]">
                <Navbar />

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-6">

                        <div className="h-5 w-40 rounded-md bg-pink-100" />

                        <div className="h-48 border border-pink-100 bg-white" />

                        <div className="h-32 border border-pink-100 bg-white" />

                    </div>
                </main>
            </div>
        );
    }

    /*
     * ========================================
     * Project not found
     * ========================================
     */

    if (!project) {
        return (
            <div className="min-h-screen bg-[#fff7fa]">
                <Navbar />

                <main className="flex min-h-[70vh] items-center justify-center px-4">
                    <div className="text-center">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-red-100 bg-red-50 text-xl font-bold text-red-500">
                            !
                        </div>

                        <h1 className="mt-5 text-xl font-bold text-gray-900">
                            Project not found
                        </h1>

                        <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                            This project may have been
                            deleted or you don't have
                            access to it.
                        </p>

                        <Link
                            href="/projects"
                            className="mt-6 inline-flex rounded-md border border-pink-200 bg-pink-50 px-5 py-2.5 text-sm font-semibold text-pink-600 transition hover:bg-pink-100"
                        >
                            ← Back to projects
                        </Link>

                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fff7fa]">

            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                {/* ========================================
                    Breadcrumb
                ======================================== */}

                <div className="mb-6 flex items-center gap-2 text-sm">

                    <Link
                        href="/projects"
                        className="font-medium text-gray-400 transition hover:text-pink-600"
                    >
                        projects
                    </Link>

                    <span className="text-gray-300">
                        /
                    </span>

                    <span className="font-mono text-xs text-pink-500">
                        {project.slug}
                    </span>

                </div>

                {/* ========================================
                    Project Header
                ======================================== */}

                <section className="border border-pink-100 bg-white shadow-[0_8px_30px_rgba(244,114,182,0.06)]">

                    <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">

                        <div className="flex min-w-0 gap-5">

                            {/* Project icon */}

                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-pink-200 bg-pink-50 font-mono text-xl font-bold text-pink-600">
                                {project.name
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div className="min-w-0">

                                <div className="flex flex-wrap items-center gap-3">

                                    <h1 className="break-words text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                                        {project.name}
                                    </h1>

                                    <span className="border border-emerald-100 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                                        {project.status}
                                    </span>

                                    {canManage && (
                                        <span className="border border-pink-100 bg-pink-50 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-pink-600">
                                            manager
                                        </span>
                                    )}

                                </div>

                                <p className="mt-2 font-mono text-xs text-pink-500">
                                    /{project.slug}
                                </p>

                                <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-500">
                                    {project.description ||
                                        'No description provided.'}
                                </p>

                            </div>

                        </div>

                        {/* Actions */}

                        {canManage && (
                            <div className="flex shrink-0 gap-2">

                                <button
                                    type="button"
                                    className="border border-rose-500 bg-rose-500 px-4 py-2.5 font-mono text-xs font-bold text-white transition hover:bg-rose-600 active:translate-y-px"
                                >
                                    [ edit ]
                                </button>

                                <button
                                    type="button"
                                    className="border border-red-500 bg-red-500 px-4 py-2.5 font-mono text-xs font-bold text-white transition hover:bg-red-600 active:translate-y-px"
                                >
                                    [ delete ]
                                </button>

                            </div>
                        )}

                    </div>

                </section>

                {/* ========================================
                    Stats
                ======================================== */}

                <section className="mt-5 grid gap-px overflow-hidden border border-pink-100 bg-pink-100 sm:grid-cols-2 lg:grid-cols-4">

                    {/* Status */}

                    <div className="bg-white px-5 py-5">

                        <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400">
                            status
                        </p>

                        <p className="mt-2 text-sm font-semibold text-emerald-600">
                            {project.status}
                        </p>

                    </div>

                    {/* Priority */}

                    <div className="bg-white px-5 py-5">

                        <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400">
                            priority
                        </p>

                        <p className="mt-2 text-sm font-semibold text-orange-500">
                            {project.priority}
                        </p>

                    </div>

                    {/* Start date */}

                    <div className="bg-white px-5 py-5">

                        <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400">
                            start_date
                        </p>

                        <p className="mt-2 text-sm font-semibold text-gray-700">
                            {project.startDate ||
                                'Not set'}
                        </p>

                    </div>

                    {/* Due date */}

                    <div className="bg-white px-5 py-5">

                        <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400">
                            due_date
                        </p>

                        <p className="mt-2 text-sm font-semibold text-gray-700">
                            {project.dueDate ||
                                'Not set'}
                        </p>

                    </div>

                </section>

                {/* ========================================
                    Tasks
                ======================================== */}

                <section className="mt-10">

                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                        <div>

                            <div className="flex items-center gap-3">

                                <h2 className="text-xl font-bold text-gray-900">
                                    Tasks
                                </h2>

                                <span className="border border-pink-100 bg-white px-2 py-0.5 font-mono text-xs text-pink-500">
                                    {tasks.length}
                                </span>

                            </div>

                            <p className="mt-1.5 text-sm text-gray-500">
                                Tasks belonging to this project.
                            </p>

                        </div>

                        {canManage && (
                            <button
                                type="button"
                                onClick={() =>
                                    setShowCreateTask(true)
                                }
                                className="border border-rose-500 bg-rose-500 px-4 py-2.5 font-mono text-xs font-bold text-white transition hover:bg-rose-600 active:translate-y-px"
                            >
                                [ + new task ]
                            </button>
                        )}

                    </div>

                    <div className="border border-pink-100 bg-white shadow-[0_8px_30px_rgba(244,114,182,0.04)]">

                        <TaskList
                            tasks={tasks}
                            loading={tasksLoading}
                            onTaskClick={setSelectedTask}
                        />

                    </div>

                </section>

                {/* ========================================
                    Members
                ======================================== */}

                <section className="mt-10">

                    <div className="mb-5">

                        <div className="flex items-center gap-3">

                            <h2 className="text-xl font-bold text-gray-900">
                                Members
                            </h2>

                            <span className="border border-pink-100 bg-white px-2 py-0.5 font-mono text-xs text-pink-500">
                                {members.length}
                            </span>

                        </div>

                        <p className="mt-1.5 text-sm text-gray-500">
                            People working on this project.
                        </p>

                    </div>

                    {membersLoading ? (
                        <div className="h-32 animate-pulse border border-pink-100 bg-white" />
                    ) : (
                        <div className="border border-pink-100 bg-white shadow-[0_8px_30px_rgba(244,114,182,0.04)]">

                            <ProjectMembers
                                projectId={projectId}
                                canManage={canManage}
                            />

                        </div>
                    )}

                </section>

                {/* ========================================
                    Labels
                ======================================== */}

                <section className="mt-10">

                    <div className="mb-5">

                        <div className="flex items-center gap-3">

                            <h2 className="text-xl font-bold text-gray-900">
                                Labels
                            </h2>

                            <span className="font-mono text-xs text-gray-400">
                                project_labels
                            </span>

                        </div>

                        <p className="mt-1.5 text-sm text-gray-500">
                            Organize tasks with project labels.
                        </p>

                    </div>

                    <div className="border border-pink-100 bg-white shadow-[0_8px_30px_rgba(244,114,182,0.04)]">

                        <ProjectLabels
                            projectId={projectId}
                            canManage={canManage}
                        />

                    </div>

                </section>

                {/* ========================================
                    Create Task Modal
                ======================================== */}

                {showCreateTask && (
                    <CreateTaskModal
                        projectId={projectId}
                        canManage={canManage}
                        onClose={() =>
                            setShowCreateTask(false)
                        }
                        onCreated={async () => {
                            setShowCreateTask(false);
                            await fetchTasks();
                        }}
                    />
                )}

                {/* ========================================
                    Task Detail Modal
                ======================================== */}

                {selectedTask && (
                    <TaskDetailModal
                        task={selectedTask}
                        canManage={canManage}
                        onClose={() =>
                            setSelectedTask(null)
                        }
                        onUpdated={(updatedTask) => {
                            setTasks((currentTasks) =>
                                currentTasks.map(
                                    (task) =>
                                        task.id ===
                                            updatedTask.id
                                            ? updatedTask
                                            : task,
                                ),
                            );

                            setSelectedTask(updatedTask);
                        }}
                        onDeleted={(taskId) => {
                            setTasks((currentTasks) =>
                                currentTasks.filter(
                                    (task) =>
                                        task.id !== taskId,
                                ),
                            );

                            setSelectedTask(null);
                        }}
                    />
                )}

            </main>
        </div>
    );
}
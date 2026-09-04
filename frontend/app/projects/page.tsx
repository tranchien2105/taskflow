'use client';

import {
    FormEvent,
    useEffect,
    useState,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import {
    apiFetch,
    UnauthorizedError,
} from '@/lib/api';

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
};

type ProjectListResponse = {
    data: Project[];
};

type CreateProjectResponse = {
    data: Project;
};

export default function ProjectsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [projects, setProjects] = useState<Project[]>(
        [],
    );

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Create modal
    const [showCreateModal, setShowCreateModal] =
        useState(false);

    const [creating, setCreating] = useState(false);

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] =
        useState('');

    const [status, setStatus] =
        useState('PLANNING');

    const [priority, setPriority] =
        useState('MEDIUM');

    /**
     * ========================================
     * Auth guard
     * ========================================
     */
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [authLoading, user, router]);

    /**
     * ========================================
     * Generate slug from project name
     * ========================================
     */
    const generateSlug = (value: string) => {
        return value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-');
    };

    /**
     * ========================================
     * Name change
     * ========================================
     */
    const handleNameChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const value = event.target.value;

        setName(value);
        setSlug(generateSlug(value));
    };

    /**
     * ========================================
     * Fetch projects
     * ========================================
     *
     * Authentication and 401 handling are
     * handled by apiFetch().
     */
    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await apiFetch<
                ProjectListResponse | Project[]
            >('/projects');

            const projectData =
                'data' in response
                    ? response.data
                    : response;

            setProjects(
                Array.isArray(projectData)
                    ? projectData
                    : [],
            );
        } catch (error) {
            /*
             * 401 is already handled inside apiFetch:
             *
             * - remove accessToken
             * - redirect to /login
             *
             * Do not show an Unauthorized toast.
             */
            if (error instanceof UnauthorizedError) {
                return;
            }

            console.error(error);

            const message =
                error instanceof Error
                    ? error.message
                    : 'Unable to connect to the server.';

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * ========================================
     * Load projects after authentication
     * ========================================
     */
    useEffect(() => {
        if (user) {
            fetchProjects();
        }
    }, [user]);

    /**
     * ========================================
     * Create project
     * ========================================
     */
    const handleCreateProject = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (!name.trim()) {
            return;
        }

        if (!slug.trim()) {
            return;
        }

        try {
            setCreating(true);
            setError('');

            const response = await apiFetch<
                CreateProjectResponse | Project
            >('/projects', {
                method: 'POST',
                body: JSON.stringify({
                    name: name.trim(),
                    slug: slug.trim(),
                    description:
                        description.trim() ||
                        undefined,
                    status,
                    priority,
                }),
            });

            const newProject =
                'data' in response
                    ? response.data
                    : response;

            setProjects((currentProjects) => [
                newProject,
                ...currentProjects,
            ]);

            toast.success(
                'Project created successfully!',
            );

            // Reset form
            setName('');
            setSlug('');
            setDescription('');
            setStatus('PLANNING');
            setPriority('MEDIUM');

            setShowCreateModal(false);
        } catch (error) {
            /*
             * 401 is already handled by apiFetch.
             * Don't show a toast for authentication errors.
             */
            if (error instanceof UnauthorizedError) {
                return;
            }

            console.error(error);

            const message =
                error instanceof Error
                    ? error.message
                    : 'Unable to connect to the server.';

            setError(message);
            toast.error(message);
        } finally {
            setCreating(false);
        }
    };

    /**
     * ========================================
     * Loading auth
     * ========================================
     */
    if (authLoading || !user) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#fff7fb]">
                <div className="flex items-center gap-3 font-mono text-xs text-slate-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-fuchsia-600" />
                    loading...
                </div>
            </main>
        );
    }

    return (
        <div className="min-h-screen bg-[#fff7fb] text-slate-900">
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* ================= HEADER ================= */}
                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-fuchsia-600">
                                ~/workspace
                            </span>

                            <span className="font-mono text-[10px] text-slate-300">
                                /
                            </span>

                            <span className="font-mono text-xs text-slate-400">
                                projects
                            </span>
                        </div>

                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Projects
                        </h1>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                            Manage your projects and keep
                            your work organized.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setShowCreateModal(true)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-fuchsia-600 bg-fuchsia-600 px-4 py-2.5 font-mono text-xs font-bold text-white transition hover:border-fuchsia-700 hover:bg-fuchsia-700 active:translate-y-px"
                    >
                        <span className="text-base leading-none">
                            +
                        </span>

                        new-project
                    </button>
                </div>

                {/* ================= ERROR ================= */}
                {error && (
                    <div className="mb-6 flex items-start justify-between gap-4 border border-red-100 bg-red-50 px-4 py-3">
                        <div>
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-red-500">
                                error
                            </p>

                            <p className="mt-1 text-sm text-red-600">
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setError('')}
                            className="shrink-0 font-mono text-xs text-red-400 transition hover:text-red-700"
                        >
                            [close]
                        </button>
                    </div>
                )}

                {/* ================= LOADING ================= */}
                {loading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-52 animate-pulse border border-pink-100 bg-white"
                            />
                        ))}
                    </div>
                )}

                {/* ================= EMPTY ================= */}
                {!loading &&
                    !error &&
                    projects.length === 0 && (
                        <div className="border border-dashed border-pink-200 bg-white px-6 py-16 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center border border-pink-200 bg-pink-50 font-mono text-lg font-bold text-fuchsia-600">
                                /
                            </div>

                            <h2 className="mt-5 text-base font-bold text-slate-900">
                                No projects yet
                            </h2>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                Create your first project
                                and start organizing your
                                tasks.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowCreateModal(true)
                                }
                                className="mt-6 font-mono text-xs font-bold text-fuchsia-600 transition hover:text-fuchsia-700"
                            >
                                + create-first-project
                            </button>
                        </div>
                    )}

                {/* ================= PROJECT LIST ================= */}
                {!loading &&
                    projects.length > 0 && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {projects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    className="group border border-slate-200 bg-white p-5 transition hover:border-fuchsia-200 hover:bg-pink-50/20"
                                >
                                    {/* Top */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-fuchsia-100 bg-fuchsia-50 font-mono text-sm font-bold text-fuchsia-600 transition group-hover:border-fuchsia-200 group-hover:bg-fuchsia-100">
                                            {project.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <span
                                            className={`border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${
                                                project.status ===
                                                'ACTIVE'
                                                    ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                                    : project.status ===
                                                        'COMPLETED'
                                                      ? 'border-violet-100 bg-violet-50 text-violet-600'
                                                      : project.status ===
                                                          'ON_HOLD'
                                                        ? 'border-amber-100 bg-amber-50 text-amber-600'
                                                        : project.status ===
                                                            'ARCHIVED'
                                                          ? 'border-slate-200 bg-slate-50 text-slate-500'
                                                          : 'border-pink-100 bg-pink-50 text-fuchsia-600'
                                            }`}
                                        >
                                            {project.status}
                                        </span>
                                    </div>

                                    {/* Name */}
                                    <h2 className="mt-5 truncate text-base font-bold text-slate-900 transition group-hover:text-fuchsia-700">
                                        {project.name}
                                    </h2>

                                    {/* Slug */}
                                    <p className="mt-1 truncate font-mono text-[10px] text-slate-400">
                                        /{project.slug}
                                    </p>

                                    {/* Description */}
                                    <p className="mt-3 line-clamp-2 min-h-[42px] text-sm leading-5 text-slate-500">
                                        {project.description ||
                                            'No description provided.'}
                                    </p>

                                    {/* Footer */}
                                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            priority
                                        </span>

                                        <span
                                            className={`border px-2 py-1 font-mono text-[10px] font-bold uppercase ${
                                                project.priority ===
                                                'URGENT'
                                                    ? 'border-red-100 bg-red-50 text-red-600'
                                                    : project.priority ===
                                                        'HIGH'
                                                      ? 'border-orange-100 bg-orange-50 text-orange-600'
                                                      : project.priority ===
                                                          'MEDIUM'
                                                        ? 'border-amber-100 bg-amber-50 text-amber-600'
                                                        : 'border-slate-200 bg-slate-50 text-slate-500'
                                            }`}
                                        >
                                            {project.priority}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
            </main>

            {/* ================= CREATE MODAL ================= */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-[2px]">
                    <div className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto border border-pink-100 bg-white shadow-xl">
                        {/* Modal Header */}
                        <div className="border-b border-pink-100 bg-pink-50/40 px-5 py-4 sm:px-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-fuchsia-600">
                                            $
                                        </span>

                                        <h2 className="font-mono text-sm font-bold text-slate-900">
                                            create-project
                                        </h2>
                                    </div>

                                    <p className="mt-1 font-mono text-[10px] text-slate-400">
                                        // add a new project to
                                        your workspace
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCreateModal(
                                            false,
                                        )
                                    }
                                    className="font-mono text-xs text-slate-400 transition hover:text-fuchsia-600"
                                >
                                    [esc]
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleCreateProject}
                            className="px-5 py-5 sm:px-6"
                        >
                            {/* Name */}
                            <div>
                                <label
                                    htmlFor="project-name"
                                    className="mb-2 block font-mono text-xs font-bold text-slate-700"
                                >
                                    name
                                </label>

                                <input
                                    id="project-name"
                                    type="text"
                                    value={name}
                                    onChange={
                                        handleNameChange
                                    }
                                    placeholder="e.g. TaskFlow Web App"
                                    maxLength={150}
                                    required
                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                                />
                            </div>

                            {/* Slug */}
                            <div className="mt-4">
                                <label
                                    htmlFor="project-slug"
                                    className="mb-2 block font-mono text-xs font-bold text-slate-700"
                                >
                                    slug
                                </label>

                                <input
                                    id="project-slug"
                                    type="text"
                                    value={slug}
                                    onChange={(event) =>
                                        setSlug(
                                            event.target
                                                .value,
                                        )
                                    }
                                    placeholder="taskflow-web-app"
                                    maxLength={150}
                                    required
                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                                />

                                <p className="mt-1.5 font-mono text-[10px] text-slate-400">
                                    // generated from project
                                    name
                                </p>
                            </div>

                            {/* Description */}
                            <div className="mt-4">
                                <label
                                    htmlFor="project-description"
                                    className="mb-2 block font-mono text-xs font-bold text-slate-700"
                                >
                                    description
                                </label>

                                <textarea
                                    id="project-description"
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(
                                            event.target
                                                .value,
                                        )
                                    }
                                    placeholder="What is this project about?"
                                    rows={4}
                                    className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                                />
                            </div>

                            {/* Status + Priority */}
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                {/* Status */}
                                <div>
                                    <label
                                        htmlFor="project-status"
                                        className="mb-2 block font-mono text-xs font-bold text-slate-700"
                                    >
                                        status
                                    </label>

                                    <select
                                        id="project-status"
                                        value={status}
                                        onChange={(event) =>
                                            setStatus(
                                                event.target
                                                    .value,
                                            )
                                        }
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                                    >
                                        <option value="PLANNING">
                                            Planning
                                        </option>

                                        <option value="ACTIVE">
                                            Active
                                        </option>

                                        <option value="ON_HOLD">
                                            On Hold
                                        </option>

                                        <option value="COMPLETED">
                                            Completed
                                        </option>

                                        <option value="ARCHIVED">
                                            Archived
                                        </option>
                                    </select>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label
                                        htmlFor="project-priority"
                                        className="mb-2 block font-mono text-xs font-bold text-slate-700"
                                    >
                                        priority
                                    </label>

                                    <select
                                        id="project-priority"
                                        value={priority}
                                        onChange={(event) =>
                                            setPriority(
                                                event.target
                                                    .value,
                                            )
                                        }
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
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

                            {/* Actions */}
                            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCreateModal(
                                            false,
                                        )
                                    }
                                    className="rounded-md border border-slate-200 bg-white px-4 py-2.5 font-mono text-xs font-bold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                >
                                    cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="rounded-md border border-fuchsia-600 bg-fuchsia-600 px-5 py-2.5 font-mono text-xs font-bold text-white transition hover:border-fuchsia-700 hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {creating
                                        ? 'creating...'
                                        : 'create-project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

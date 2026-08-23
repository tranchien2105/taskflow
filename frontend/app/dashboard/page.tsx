'use client';

import Link from 'next/link';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';

import Navbar from '@/components/Navbar';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [loading, user, router]);

    if (loading || !user) {
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
                <div className="mb-8">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-fuchsia-600">
                            ~/workspace
                        </span>

                        <span className="font-mono text-[10px] text-slate-300">
                            /
                        </span>

                        <span className="font-mono text-xs text-slate-400">
                            dashboard
                        </span>
                    </div>

                    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                Welcome back, {user.name}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                Here&apos;s what&apos;s happening
                                with your workspace today.
                            </p>
                        </div>

                        <Link
                            href="/projects"
                            className="inline-flex items-center justify-center gap-2 rounded-md border border-fuchsia-600 bg-fuchsia-600 px-4 py-2.5 font-mono text-xs font-bold text-white transition hover:border-fuchsia-700 hover:bg-fuchsia-700 active:translate-y-px"
                        >
                            <span className="text-base leading-none">
                                +
                            </span>

                            new-project
                        </Link>
                    </div>
                </div>

                {/* ================= STATS ================= */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Projects */}
                    <div className="border border-slate-200 bg-white p-5 transition hover:border-fuchsia-200">
                        <div className="flex items-center justify-between">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                projects
                            </p>

                            <span className="font-mono text-xs text-fuchsia-500">
                                #
                            </span>
                        </div>

                        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                            0
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Total projects
                        </p>
                    </div>

                    {/* Active Tasks */}
                    <div className="border border-slate-200 bg-white p-5 transition hover:border-fuchsia-200">
                        <div className="flex items-center justify-between">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                active-tasks
                            </p>

                            <span className="font-mono text-xs text-fuchsia-500">
                                &gt;
                            </span>
                        </div>

                        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                            0
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Tasks currently in progress
                        </p>
                    </div>

                    {/* Completed */}
                    <div className="border border-slate-200 bg-white p-5 transition hover:border-fuchsia-200">
                        <div className="flex items-center justify-between">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                completed
                            </p>

                            <span className="font-mono text-xs text-emerald-500">
                                ✓
                            </span>
                        </div>

                        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                            0
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Completed tasks
                        </p>
                    </div>

                    {/* Overdue */}
                    <div className="border border-slate-200 bg-white p-5 transition hover:border-red-200">
                        <div className="flex items-center justify-between">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                overdue
                            </p>

                            <span className="font-mono text-xs text-red-500">
                                !
                            </span>
                        </div>

                        <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                            0
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Tasks past their due date
                        </p>
                    </div>
                </div>

                {/* ================= MAIN GRID ================= */}
                <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    {/* ================= GET STARTED ================= */}
                    <section className="border border-pink-100 bg-white">
                        <div className="border-b border-pink-100 bg-pink-50/40 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-fuchsia-600">
                                    $
                                </span>

                                <h2 className="font-mono text-sm font-bold text-slate-900">
                                    get-started
                                </h2>
                            </div>

                            <p className="mt-1 font-mono text-[10px] text-slate-400">
                                // organize your work and keep
                                things moving
                            </p>
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Ready to get things done?
                                    </h3>

                                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                                        Create a project,
                                        organize your tasks,
                                        and keep your team
                                        moving forward.
                                    </p>
                                </div>

                                <div className="shrink-0">
                                    <Link
                                        href="/projects"
                                        className="inline-flex items-center justify-center rounded-md border border-fuchsia-600 bg-fuchsia-600 px-4 py-2.5 font-mono text-xs font-bold text-white transition hover:border-fuchsia-700 hover:bg-fuchsia-700"
                                    >
                                        view-projects
                                    </Link>
                                </div>
                            </div>

                            {/* Progress / workspace status */}
                            <div className="mt-6 border-t border-slate-100 pt-5">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        workspace-status
                                    </span>

                                    <span className="font-mono text-[10px] font-bold text-emerald-600">
                                        ready
                                    </span>
                                </div>

                                <div className="mt-3 h-1.5 w-full bg-slate-100">
                                    <div className="h-1.5 w-1/4 bg-fuchsia-500" />
                                </div>

                                <p className="mt-2 font-mono text-[10px] text-slate-400">
                                    // project workspace is ready
                                    for your next task
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ================= QUICK ACTIONS ================= */}
                    <section className="border border-slate-200 bg-white">
                        <div className="border-b border-slate-100 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-fuchsia-600">
                                    ::
                                </span>

                                <h2 className="font-mono text-sm font-bold text-slate-900">
                                    quick-actions
                                </h2>
                            </div>

                            <p className="mt-1 font-mono text-[10px] text-slate-400">
                                // common workspace actions
                            </p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            <Link
                                href="/projects"
                                className="group flex items-center justify-between px-5 py-4 transition hover:bg-pink-50/40"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-fuchsia-100 bg-fuchsia-50 font-mono text-xs font-bold text-fuchsia-600">
                                        +
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 transition group-hover:text-fuchsia-700">
                                            Create project
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-400">
                                            Start a new workspace
                                        </p>
                                    </div>
                                </div>

                                <span className="font-mono text-xs text-slate-300 transition group-hover:text-fuchsia-500">
                                    →
                                </span>
                            </Link>

                            <Link
                                href="/projects"
                                className="group flex items-center justify-between px-5 py-4 transition hover:bg-pink-50/40"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-500">
                                        #
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 transition group-hover:text-fuchsia-700">
                                            View projects
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-400">
                                            Browse your projects
                                        </p>
                                    </div>
                                </div>

                                <span className="font-mono text-xs text-slate-300 transition group-hover:text-fuchsia-500">
                                    →
                                </span>
                            </Link>
                        </div>
                    </section>
                </div>

                {/* ================= WORKSPACE INFO ================= */}
                <section className="mt-6 border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-fuchsia-600">
                                        //
                                    </span>

                                    <h2 className="font-mono text-sm font-bold text-slate-900">
                                        workspace
                                    </h2>
                                </div>

                                <p className="mt-1 font-mono text-[10px] text-slate-400">
                                    // current workspace information
                                </p>
                            </div>

                            <span className="hidden font-mono text-[10px] text-slate-300 sm:block">
                                taskflow
                            </span>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3">
                        {/* User */}
                        <div className="border-b border-slate-100 p-5 sm:border-r lg:border-b-0">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                current-user
                            </p>

                            <div className="mt-3 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-fuchsia-200 bg-fuchsia-50 font-mono text-sm font-bold text-fuchsia-700">
                                    {user.name
                                        ?.charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                        {user.name}
                                    </p>

                                    <p className="truncate text-xs text-slate-400">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="border-b border-slate-100 p-5 lg:border-r lg:border-b-0">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                system-status
                            </p>

                            <div className="mt-3 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                <span className="font-mono text-xs font-bold text-emerald-600">
                                    operational
                                </span>
                            </div>

                            <p className="mt-2 text-xs text-slate-400">
                                All workspace services are
                                available.
                            </p>
                        </div>

                        {/* Version */}
                        <div className="p-5">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                environment
                            </p>

                            <p className="mt-3 font-mono text-sm font-bold text-slate-800">
                                production-ready
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                                TaskFlow workspace
                            </p>
                        </div>
                    </div>
                </section>

                {/* ================= FOOTER NOTE ================= */}
                <div className="mt-6 flex items-center justify-between border-t border-pink-100 pt-4">
                    <p className="font-mono text-[10px] text-slate-400">
                        // taskflow workspace dashboard
                    </p>

                    <p className="hidden font-mono text-[10px] text-slate-300 sm:block">
                        v1.0
                    </p>
                </div>
            </main>
        </div>
    );
}
'use client';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import ProjectInvitationNotification from '@/components/ProjectInvitationNotification';

export default function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();

    if (!user) {
        return null;
    }

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    return (
        <header className="sticky top-0 z-50 border-b border-violet-200/80 bg-[#f3efff]/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                {/* Logo */}
                <Link
                    href="/dashboard"
                    className="group flex items-center gap-2.5"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-fuchsia-500 bg-fuchsia-500 font-mono text-sm font-bold text-white transition hover:border-fuchsia-600 hover:bg-fuchsia-600">
                        T
                    </div>

                    <div className="leading-none">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-lg font-bold tracking-tight text-slate-900">
                                TaskFlow
                            </span>

                            <span className="hidden font-mono text-[9px] font-semibold uppercase tracking-wider text-fuchsia-600 sm:inline">
                                dev
                            </span>
                        </div>

                        <p className="mt-1 hidden font-mono text-[9px] text-slate-400 sm:block">
                            // task management
                        </p>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-1 md:flex">
                    <Link
                        href="/dashboard"
                        className="group flex items-center gap-2 rounded-md px-3.5 py-2 font-mono text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-fuchsia-700"
                    >
                        <span className="text-slate-400 transition group-hover:text-fuchsia-500">
                            ~/
                        </span>

                        dashboard
                    </Link>

                    <Link
                        href="/projects"
                        className="group flex items-center gap-2 rounded-md px-3.5 py-2 font-mono text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-fuchsia-700"
                    >
                        <span className="text-slate-400 transition group-hover:text-fuchsia-500">
                            ~/
                        </span>

                        projects
                    </Link>
                </nav>

                {/* User */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <ProjectInvitationNotification />
                    {/* User info */}
                    <div className="hidden text-right sm:block">
                        <p className="max-w-[180px] truncate font-mono text-xs font-bold text-slate-800">
                            {user.name}
                        </p>

                        <p className="mt-0.5 max-w-[180px] truncate font-mono text-[10px] text-slate-400">
                            {user.email}
                        </p>
                    </div>

                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-fuchsia-200 bg-white font-mono text-xs font-bold text-fuchsia-600">
                        {user.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Logout */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-md border border-violet-200 bg-white px-3 py-2 font-mono text-[11px] font-semibold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:translate-y-px"
                    >
                        logout
                    </button>
                </div>
            </div>
      
            {/* Mobile Navigation */}
            <div className="border-t border-violet-200/70 md:hidden">
                <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
                    <Link
                        href="/dashboard"
                        className="shrink-0 rounded-md px-3 py-1.5 font-mono text-[11px] font-semibold text-slate-500 transition hover:bg-white hover:text-fuchsia-600"
                    >
                        ~/dashboard
                    </Link>

                    <Link
                        href="/projects"
                        className="shrink-0 rounded-md px-3 py-1.5 font-mono text-[11px] font-semibold text-slate-500 transition hover:bg-white hover:text-fuchsia-600"
                    >
                        ~/projects
                    </Link>
                </nav>
            </div>
        </header>
    );
}
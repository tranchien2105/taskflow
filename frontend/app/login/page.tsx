'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            /**
             * AuthProvider sẽ xử lý toàn bộ authentication flow:
             *
             * 1. POST /auth/login
             * 2. Lấy accessToken
             * 3. Lưu accessToken vào localStorage
             * 4. GET /auth/me
             * 5. setUser(...)
             */
            await login(email, password);

            /**
             * Tại thời điểm này:
             *
             * user đã được set trong AuthContext
             * accessToken đã được lưu
             *
             * → Có thể chuyển sang dashboard.
             */
            router.replace('/dashboard');
        } catch (error) {
            console.error('Login failed:', error);

            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(
                    'Unable to connect to the server. Please try again.',
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#fff7fa] px-4 py-8">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-pink-500 bg-pink-500 font-mono text-xl font-bold text-white">
                        T
                    </div>

                    <div className="flex items-center justify-center gap-2">
                        <h1 className="font-mono text-3xl font-bold tracking-tight text-slate-900">
                            TaskFlow
                        </h1>

                        <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-pink-500">
                            dev
                        </span>
                    </div>

                    <p className="mt-2 font-mono text-[11px] text-slate-400">
                        // task management
                    </p>
                </div>

                {/* Card */}
                <div className="border border-pink-100 bg-white p-8 shadow-[0_8px_30px_rgba(244,114,182,0.06)]">

                    <div className="mb-6">
                        <h2 className="font-mono text-xl font-bold text-slate-900">
                            Welcome back
                        </h2>

                        <p className="mt-1.5 text-sm text-slate-500">
                            Sign in to continue to your workspace.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block font-mono text-xs font-semibold text-slate-600"
                            >
                                email
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="you@example.com"
                                required
                                className="w-full border border-slate-200 bg-white px-4 py-3 font-mono text-xs text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-pink-500 focus:ring-0"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block font-mono text-xs font-semibold text-slate-600"
                            >
                                password
                            </label>

                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={
                                        showPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    placeholder="Enter your password"
                                    required
                                    className="w-full border border-slate-200 bg-white px-4 py-3 pr-12 font-mono text-xs text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-pink-500 focus:ring-0"
                                />

                                {/* Show / Hide password */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (prev) => !prev,
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-pink-50 hover:text-pink-500"
                                    aria-label={
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                >
                                    {showPassword ? (
                                        // Eye off
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.8}
                                            stroke="currentColor"
                                            className="h-5 w-5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3.98 8.223A10.477 10.477 0 0 0 2.25 12c1.5 4.5 5.25 7.5 9.75 7.5 1.65 0 3.18-.39 4.52-1.08M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.5 0 8.25 3 9.75 7.5a10.47 10.47 0 0 1-2.122 3.592M6.228 6.228 3 3m3.228 3.228 4.547 4.547m3.54 3.54L21 21m-9-9a3 3 0 1 0 4.243 4.243M12 12l4.243 4.243"
                                            />
                                        </svg>
                                    ) : (
                                        // Eye
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.8}
                                            stroke="currentColor"
                                            className="h-5 w-5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12Z"
                                            />

                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="3"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full items-center justify-center gap-2 border border-pink-500 bg-pink-500 px-4 py-3 font-mono text-xs font-bold text-white transition hover:bg-pink-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
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

                                    signing-in...
                                </>
                            ) : (
                                <>
                                    <span className="text-base leading-none">
                                        →
                                    </span>

                                    sign-in
                                </>
                            )}
                        </button>
                    </form>

                    {/* Register */}
                    <p className="mt-6 text-center font-mono text-xs text-slate-400">
                        don&apos;t have an account?{' '}

                        <Link
                            href="/register"
                            className="font-bold text-pink-500 transition hover:text-pink-600"
                        >
                            create-account
                        </Link>
                    </p>
                </div>

                <p className="mt-6 text-center font-mono text-[10px] text-slate-400">
                    © 2026 TaskFlow. All rights reserved.
                </p>
            </div>
        </main>
    );
}
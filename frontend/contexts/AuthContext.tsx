'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

import { apiFetch } from '@/lib/api';

type User = {
    userId: string;
    email: string;
    name: string;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    login: (
        email: string,
        password: string,
    ) => Promise<void>;
    logout: () => void;
};

const AuthContext =
    createContext<AuthContextType>({
        user: null,
        loading: true,
        login: async () => {},
        logout: () => {},
    });

export function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] =
        useState<User | null>(null);

    const [loading, setLoading] =
        useState(true);

    /**
     * Logout
     *
     * 1. Remove access token
     * 2. Clear current user
     * 3. Redirect to login
     */
    const logout = (): void => {
        localStorage.removeItem(
            'accessToken',
        );

        setUser(null);

        window.location.href = '/login';
    };

    /**
     * Load current user.
     *
     * apiFetch sẽ tự:
     *
     * 1. Lấy accessToken từ localStorage
     * 2. Gắn Authorization header
     * 3. Gọi /auth/me
     * 4. Nếu 401 → xoá token
     * 5. Redirect /login
     */
    const loadUser = async (): Promise<void> => {
        const data = await apiFetch<{
            data?: User;
        }>('/auth/me');

        const userData =
            data.data ?? data;

        setUser(userData as User);
    };

    /**
     * Login
     *
     * 1. POST /auth/login
     * 2. Get accessToken
     * 3. Save accessToken
     * 4. GET /auth/me
     * 5. Set user
     */
    const login = async (
        email: string,
        password: string,
    ): Promise<void> => {
        const data = await apiFetch<{
            accessToken?: string;
            data?: {
                accessToken?: string;
            };
        }>('/auth/login', {
            method: 'POST',
            auth: false,
            body: JSON.stringify({
                email,
                password,
            }),
        });

        const token =
            data.accessToken ??
            data.data?.accessToken;

        if (!token) {
            throw new Error(
                'Access token was not returned.',
            );
        }

        /**
         * Save access token.
         */
        localStorage.setItem(
            'accessToken',
            token,
        );

        /**
         * Load current user.
         */
        await loadUser();
    };

    /**
     * Initialize authentication.
     *
     * App
     *   ↓
     * localStorage
     *   ↓
     * accessToken
     *   ↓
     * apiFetch('/auth/me')
     *   ↓
     * user
     *
     * Nếu token hết hạn:
     *
     * /auth/me
     *   ↓
     * 401
     *   ↓
     * apiFetch
     *   ↓
     * remove token
     *   ↓
     * /login
     */
    useEffect(() => {
        const initializeAuth =
            async () => {
                const token =
                    localStorage.getItem(
                        'accessToken',
                    );

                /**
                 * No token.
                 */
                if (!token) {
                    setUser(null);
                    setLoading(false);
                    return;
                }

                /**
                 * Token exists.
                 *
                 * Validate token
                 * through /auth/me.
                 */
                try {
                    await loadUser();
                } catch {
                    /**
                     * apiFetch already handles
                     * 401 and redirects to login.
                     *
                     * For other errors, simply
                     * clear current user.
                     */
                    setUser(null);
                } finally {
                    setLoading(false);
                }
            };

        initializeAuth();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
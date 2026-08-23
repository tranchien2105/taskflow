import type { Metadata } from 'next';

import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';

import { AuthProvider } from '@/contexts/AuthContext';

import { Toaster } from 'sonner';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'TaskFlow',
    description: 'TaskFlow project management',

    icons: {
        icon: '/favicon.svg',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full bg-[#fff7fa] text-slate-900">
                <AuthProvider>
                    {children}
                </AuthProvider>

                <Toaster
                    position="top-right"
                    richColors
                    closeButton
                />
            </body>
        </html>
    );
}
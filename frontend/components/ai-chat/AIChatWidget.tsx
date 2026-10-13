'use client';

import { FormEvent, useState } from 'react';
import { apiFetch, UnauthorizedError } from '@/lib/api';

type Message = {
    id: number;
    role: 'assistant' | 'user';
    content: string;
};

type ChatResponse = {
    reply: string;
};

const QUICK_PROMPTS = [
    'Hôm nay mình cần làm gì?',
    'Tóm tắt tiến độ dự án',
    'Có task nào sắp đến hạn?',
];

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            role: 'assistant',
            content:
                'Chào bạn! 👋 Mình là TaskFlow AI Assistant. ' +
                'Mình sẽ giúp bạn quản lý công việc và theo dõi tiến độ dự án.',
        },
    ]);

    async function sendMessage(content: string) {
        const trimmedContent = content.trim();

        if (!trimmedContent || isLoading) {
            return;
        }

        const userMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: trimmedContent,
        };

        setMessages((previous) => [...previous, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const chatData = await apiFetch<ChatResponse>('/ai/chat', {
                method: 'POST',
                body: JSON.stringify({ message: trimmedContent }),
            });

            if (!chatData.reply?.trim()) {
                throw new Error('AI trả về nội dung rỗng.');
            }

            setMessages((previous) => [
                ...previous,
                {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: chatData.reply,
                },
            ]);
        } catch (error) {
            if (error instanceof UnauthorizedError) {
                return;
            }


            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Đã xảy ra lỗi không xác định.';

            setMessages((previous) => [
                ...previous,
                {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: `Xin lỗi, ${errorMessage}`,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSend(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        await sendMessage(input);
    }

    function handleQuickPrompt(prompt: string) {
        if (!isLoading) {
            setInput(prompt);
        }
    }

    return (
        <div className="fixed bottom-5 right-5 z-[100] font-sans sm:bottom-6 sm:right-6">
            {isOpen && (
                <section
                    role="dialog"
                    aria-label="TaskFlow AI Assistant"
                    className="mb-3 flex h-[min(640px,calc(100dvh-108px))] w-[min(410px,calc(100vw-28px))] flex-col overflow-hidden rounded-[26px] border border-pink-100 bg-white shadow-[0_24px_80px_-24px_rgba(112,44,85,0.32)] ring-1 ring-slate-900/[0.03]"
                >
                    {/* Header */}
                    <header className="relative flex items-center justify-between overflow-hidden border-b border-pink-100 bg-gradient-to-br from-white via-pink-50 to-fuchsia-50 px-5 py-4">
                        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full bg-fuchsia-200/30 blur-2xl" />
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-lg shadow-pink-500/20">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
                                    <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
                                    <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
                                </svg>
                            </div>

                            <div className="relative">
                                <h2 className="font-semibold tracking-tight text-slate-900">
                                    TaskFlow <span className="text-fuchsia-600">AI</span>
                                </h2>

                                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
                                    Trợ lý công việc của bạn
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            aria-label="Đóng cửa sổ chat"
                            className="relative rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-5 w-5"
                            >
                                <path d="m18 6-12 12M6 6l12 12" />
                            </svg>
                        </button>
                    </header>

                    {/* Messages */}
                    <div
                        className="flex-1 space-y-5 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-50/70 via-white to-white p-4 sm:p-5"
                        aria-live="polite"
                    >
                        <p className="mx-auto w-fit rounded-full border border-pink-100 bg-white/80 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-400 shadow-sm">
                            Bắt đầu cuộc trò chuyện
                        </p>

                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${
                                    message.role === 'user'
                                        ? 'justify-end'
                                        : 'justify-start'
                                }`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-600">
                                        <span aria-hidden="true">✦</span>
                                    </div>
                                )}

                                <div
                                    className={`max-w-[84%] whitespace-pre-wrap break-words rounded-[20px] px-4 py-3 text-[13px] leading-6 shadow-sm ${
                                        message.role === 'user'
                                            ? 'rounded-br-md bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white shadow-pink-500/15'
                                            : 'rounded-bl-md border border-pink-100/80 bg-white text-slate-700'
                                    }`}
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-600">
                                    <span aria-hidden="true">✦</span>
                                </div>

                                <div
                                    role="status"
                                    className="flex items-center gap-3 rounded-[20px] rounded-bl-md border border-pink-100/80 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm"
                                >
                                    <span>AI đang soạn câu trả lời</span>
                                    <span className="flex gap-1" aria-hidden="true">
                                        <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:-0.25s]" />
                                        <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:-0.12s]" />
                                        <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400" />
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick prompts */}
                    <div className="space-y-2.5 border-t border-pink-100/80 bg-white px-4 pt-3.5">
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Gợi ý cho bạn
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {QUICK_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt}
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleQuickPrompt(prompt)}
                                    className="rounded-full border border-pink-100 bg-white px-3 py-1.5 text-left text-[11px] text-slate-600 transition hover:border-fuchsia-300 hover:bg-fuchsia-50 hover:text-fuchsia-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={handleSend}
                        className="flex items-end gap-2 bg-white px-4 pb-2.5 pt-3"
                    >
                        <input
                            value={input}
                            onChange={(event) =>
                                setInput(event.target.value)
                            }
                            placeholder="Nhập câu hỏi của bạn..."
                            aria-label="Nhập tin nhắn"
                            disabled={isLoading}
                            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-300 focus:bg-white focus:ring-4 focus:ring-fuchsia-100 disabled:opacity-60"
                        />

                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            aria-label="Gửi tin nhắn"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white shadow-md shadow-pink-500/20 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                        >
                            {isLoading ? (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="h-5 w-5 animate-spin"
                                >
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="9"
                                        strokeOpacity="0.25"
                                    />
                                    <path d="M21 12a9 9 0 0 0-9-9" />
                                </svg>
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="h-5 w-5"
                                >
                                    <path d="m22 2-7 20-4-9-9-4Z" />
                                    <path d="M22 2 11 13" />
                                </svg>
                            )}
                        </button>
                    </form>

                    <p className="bg-white pb-3 text-center font-mono text-[9px] uppercase tracking-wider text-slate-300">
                        TaskFlow AI · Luôn sẵn sàng hỗ trợ
                    </p>
                </section>
            )}

            {/* Floating button */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() =>
                        setIsOpen((previous) => !previous)
                    }
                    aria-label={
                        isOpen
                            ? 'Đóng TaskFlow AI'
                            : 'Mở TaskFlow AI'
                    }
                    aria-expanded={isOpen}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-pink-600/30 transition duration-200 hover:scale-105 hover:shadow-xl hover:shadow-pink-600/40 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200"
                >
                    {!isOpen && (
                        <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-400" />
                    )}

                    {isOpen ? (
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-6 w-6"
                        >
                            <path d="m18 6-12 12M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-7 w-7"
                        >
                            <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
                            <path d="M9 12h.01M12 12h.01M15 12h.01" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
}

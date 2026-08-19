import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import { formatDateTime } from '@/utils/tutor';
import { getInitials } from '@/utils/index';
import type { AuthProps, Conversation, Message } from '@/types';

interface Props {
    auth: AuthProps;
    conversation: Conversation;
    messages: Message[];
}

export default function MessagesShow(props: Props) {
    const { auth, conversation, messages } = props;
    const [body, setBody] = useState('');
    const [busy, setBusy] = useState(false);
    const [localMessages, setLocalMessages] = useState<Message[]>(messages);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalMessages(messages);
    }, [messages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [localMessages.length]);

    const send = () => {
        if (!body.trim() || busy) return;
        setBusy(true);
        const currentBody = body;
        setBody('');
        fetch(`/messages/${conversation.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ body: currentBody }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.message) {
                    setLocalMessages((prev) => [...prev, {
                        id: data.message.id,
                        sender_id: data.message.sender_id,
                        body: data.message.body,
                        is_read: data.message.is_read,
                        created_at: data.message.created_at,
                    }]);
                }
            })
            .catch((err) => console.error(err))
            .finally(() => setBusy(false));
    };

    const myId = auth.user?.id;

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title={conversation.counterpart?.name ?? 'Conversation'} />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                <FlashToast />

                <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {conversation.subject && (
                                <span className="badge badge-outline badge-sm border-base-content/20 text-base-content/60">
                                    {conversation.subject}
                                </span>
                            )}
                            {conversation.counterpart && (
                                <span className="flex items-center gap-2 text-sm font-medium text-base-content">
                                    <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white">
                                        {getInitials(conversation.counterpart.name || '?')}
                                    </span>
                                    {conversation.counterpart.name}
                                </span>
                            )}
                        </div>
                        <Link href="/messages" className="btn btn-ghost btn-sm rounded-full gap-2">
                            <ArrowLeft className="size-4" /> All conversations
                        </Link>
                    </div>

                    <div className="card card-border border-base-content/10">
                        <div className="card-body max-h-[60vh] min-h-[40vh] gap-3 overflow-y-auto p-4">
                            {localMessages?.length === 0 && (
                                <p className="m-auto text-sm text-base-content/50">
                                    Say hello to start the conversation.
                                </p>
                            )}
                            {localMessages?.map((message: Message) => {
                                const mine = message.sender_id === myId;
                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                                mine
                                                    ? 'rounded-br-sm bg-primary text-primary-content'
                                                    : 'rounded-bl-sm bg-base-content/5 text-base-content'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap">{message.body}</p>
                                            <p
                                                className={`mt-1 text-[10px] ${
                                                    mine
                                                        ? 'text-primary-content/70'
                                                        : 'text-base-content/40'
                                                }`}
                                            >
                                                {formatDateTime(message.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        <div className="flex gap-2 border-t border-base-content/10 p-3">
                            <input
                                type="text"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') send();
                                }}
                                placeholder="Type a message…"
                                className="input input-bordered w-full rounded-full"
                            />
                            <button
                                onClick={send}
                                disabled={busy || !body.trim()}
                                className="btn btn-primary rounded-full"
                            >
                                <Send className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}
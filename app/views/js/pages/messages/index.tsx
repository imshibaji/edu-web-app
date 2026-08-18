import { Head, Link } from '@inertiajs/react';
import { MessageSquare, Clock, ChevronRight } from 'lucide-react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import { formatDateTime } from '@/utils/tutor';
import { getInitials } from '@/utils/index';
import type { AuthProps, Conversation } from '@/types';

interface Props {
    auth: AuthProps;
    conversations: Conversation[];
}

export default function MessagesIndex(props: Props) {
    const { auth, conversations } = props;

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Messages" />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                <FlashToast />

                <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-base-content">Messages</h1>
                        <p className="text-xs text-base-content/50">
                            Chat with tutors and students about your lessons.
                        </p>
                    </div>

                    {conversations?.length === 0 && (
                        <div className="card card-border border-base-content/10 bg-base-content/4">
                            <div className="card-body items-center py-16 text-center">
                                <MessageSquare className="size-10 text-base-content/40" />
                                <h3 className="font-display mt-3 font-semibold text-base-content">
                                    No conversations yet
                                </h3>
                                <p className="max-w-sm text-sm text-base-content/60">
                                    Message a tutor from their profile, or chat about a booked lesson.
                                </p>
                                <Link href="/#educators" className="btn btn-primary btn-sm mt-3 rounded-full">
                                    Find a Tutor
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-3">
                        {conversations?.map((conversation: Conversation) => (
                            <Link
                                key={conversation.id}
                                href={`/messages/${conversation.id}`}
                                className="card card-border border-base-content/10 transition-colors hover:border-primary/40"
                            >
                                <div className="card-body flex-row items-center gap-4">
                                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-sm font-semibold text-white">
                                        {getInitials(conversation.counterpart?.name || '?')}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-display truncate font-semibold text-base-content">
                                                {conversation.counterpart?.name}
                                            </p>
                                            {conversation.last_message_at && (
                                                <p className="flex shrink-0 items-center gap-1 text-xs text-base-content/50">
                                                    <Clock className="size-3" />
                                                    {formatDateTime(conversation.last_message_at)}
                                                </p>
                                            )}
                                        </div>
                                        <p
                                            className={`truncate text-sm ${
                                                conversation.unread_count > 0
                                                    ? 'font-medium text-base-content'
                                                    : 'text-base-content/60'
                                            }`}
                                        >
                                            {conversation.last_message_preview || 'No messages yet'}
                                        </p>
                                        {conversation.subject && (
                                            <p className="mt-0.5 text-xs text-base-content/40">
                                                {conversation.subject}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {conversation.unread_count > 0 && (
                                            <span className="badge badge-error badge-sm">
                                                {conversation.unread_count}
                                            </span>
                                        )}
                                        <ChevronRight className="size-4 text-base-content/40" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}
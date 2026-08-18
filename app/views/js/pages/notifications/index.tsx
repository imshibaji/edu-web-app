import { Head, router } from '@inertiajs/react';
import { Bell, CheckCheck, CalendarCheck, XCircle, CreditCard, Star, MessageSquare } from 'lucide-react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import { formatDateTime } from '@/utils/tutor';
import type { AppNotification, AuthProps } from '@/types';

interface Props {
    auth: AuthProps;
    notifications: AppNotification[];
    unread_count: number;
}

const TYPE_ICON: Record<string, React.ElementType> = {
    booking_request: CalendarCheck,
    booking_confirmed: CalendarCheck,
    booking_cancelled: XCircle,
    booking_completed: CalendarCheck,
    payment_received: CreditCard,
    payment_failed: CreditCard,
    payout_initiated: CreditCard,
    payout_completed: CreditCard,
    payout_failed: CreditCard,
    profile_approved: CheckCheck,
    profile_rejected: XCircle,
    review_received: Star,
    system: Bell,
    message: MessageSquare,
};

export default function NotificationsIndex(props: Props) {
    const { auth, notifications, unread_count } = props;

    const markAllRead = () => {
        router.post('/notifications/read-all', {}, {
            onError: (err) => console.error(err),
        });
    };

    const markRead = (notification: AppNotification) => {
        if (notification.is_read) return;
        router.post(`/notifications/${notification.id}/read`, {}, {
            onError: (err) => console.error(err),
        });
    };

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Notifications" />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                <FlashToast />

                <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="font-display text-2xl font-bold text-base-content">
                                Notifications
                            </h1>
                            <p className="text-xs text-base-content/50">
                                {unread_count > 0
                                    ? `${unread_count} unread`
                                    : 'You are all caught up'}
                            </p>
                        </div>
                        {unread_count > 0 && (
                            <button
                                onClick={markAllRead}
                                className="btn btn-outline btn-sm rounded-full gap-2"
                            >
                                <CheckCheck className="size-4" /> Mark all read
                            </button>
                        )}
                    </div>

                    {notifications?.length === 0 && (
                        <div className="card card-border border-base-content/10 bg-base-content/4">
                            <div className="card-body items-center py-16 text-center">
                                <Bell className="size-10 text-base-content/40" />
                                <h3 className="font-display mt-3 font-semibold text-base-content">
                                    No notifications yet
                                </h3>
                                <p className="max-w-sm text-sm text-base-content/60">
                                    Booking updates, new messages and reviews will appear here.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-2">
                        {notifications?.map((notification: AppNotification) => {
                            const Icon = TYPE_ICON[notification.type] ?? Bell;
                            return (
                                <button
                                    key={notification.id}
                                    onClick={() => markRead(notification)}
                                    className={`card card-border w-full text-left transition-colors ${
                                        notification.is_read
                                            ? 'border-base-content/10'
                                            : 'border-primary/30 bg-primary/5 hover:border-primary/50'
                                    }`}
                                >
                                    <div className="card-body flex-row items-start gap-3 p-4">
                                        <span
                                            className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                                                notification.is_read
                                                    ? 'bg-base-content/10 text-base-content/50'
                                                    : 'bg-primary/15 text-primary'
                                            }`}
                                        >
                                            <Icon className="size-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p
                                                    className={`font-display text-sm font-semibold ${
                                                        notification.is_read
                                                            ? 'text-base-content/70'
                                                            : 'text-base-content'
                                                    }`}
                                                >
                                                    {notification.title}
                                                </p>
                                                <span className="shrink-0 text-xs text-base-content/40">
                                                    {formatDateTime(notification.created_at)}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-sm text-base-content/60">
                                                {notification.message}
                                            </p>
                                            {!notification.is_read && (
                                                <span className="mt-2 inline-block size-2 rounded-full bg-primary" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}
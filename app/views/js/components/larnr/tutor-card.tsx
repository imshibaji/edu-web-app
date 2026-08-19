import { BadgeCheck, MapPin, Clock, Video, Building2, Star, MessageSquare } from 'lucide-react';
import { router } from '@inertiajs/react';

import Avatar from '@/components/larnr/avatar';
import { displayAmount, getCurrencyCookie } from '@/utils/currency';
import type { Tutor, AuthProps } from '@/types';

const FORMAT_LABELS = {
    ONLINE: 'Online',
    IN_PERSON: 'In-person',
    BOTH: 'Online & In-person',
} as const;

const LEVEL_LABELS = {
    ENTRY: 'Entry',
    MID: 'Mid',
    SENIOR: 'Senior',
} as const;

interface Props {
    tutor: Tutor;
    auth: AuthProps;
}

export default function TutorCard({ tutor, auth }: Props) {
    const rate = displayAmount(tutor.rate, tutor.currency, auth);

    const message = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!auth?.user) {
            router.visit('/auth/login');
            return;
        }
        if (auth.user.role === 'TUTOR') {
            router.get(`/messages?with=${tutor.id}`);
            return;
        }
        try {
            const res = await fetch('/messages/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tutor_id: tutor.id }),
            });
            const data = await res.json();
            if (data.conversation_id) router.get(`/messages/${data.conversation_id}`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div onClick={() => router.visit(`/t/${tutor.username}`)} className="card card-border border-base-content/10 bg-base-content/4 transition-colors hover:border-primary/40 hover:bg-base-content/6">
            <div className="card-body gap-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar
                            src={tutor.avatar}
                            name={tutor.name}
                            className="size-14"
                            textClass="text-base"
                        />
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-display text-lg font-semibold text-base-content">
                                    {tutor.name}
                                </h3>
                                {tutor.verified && (
                                    <BadgeCheck className="size-5 text-primary" />
                                )}
                            </div>
                            <p className="text-sm text-base-content/60">{tutor.headline}</p>
                        </div>
                    </div>

                    <div className="hidden text-right sm:block">
                        <p className="font-display text-lg font-bold text-primary">
                            {tutor.rate > 0 ? `${rate.text}/hr` : 'Rate on request'}
                        </p>
                        {rate.note && (
                            <p className="text-xs text-base-content/50">
                                ≈ {rate.note} · {tutor.currency} to {getCurrencyCookie() || 'INR'}
                            </p>
                        )}
                        {!rate.note && (
                            <p className="text-xs text-base-content/50">
                                {tutor.currency}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-base-content/60">
                    <span className="flex items-center gap-1">
                        <span className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                    key={i}
                                    className={`size-3.5 ${
                                        tutor.rating >= i
                                            ? 'fill-amber-400 text-amber-400'
                                            : tutor.rating >= i - 0.5
                                            ? 'fill-amber-400/50 text-amber-400'
                                            : 'text-base-content/40'
                                    }`}
                                />
                            ))}
                        </span>
                        {tutor.rating.toFixed(1)}
                    </span>
                    {tutor.city && (
                        <span className="flex items-center gap-1">
                            <MapPin className="size-3.5" /> {tutor.city}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        {tutor.format === 'ONLINE' ? (
                            <Video className="size-3.5" />
                        ) : tutor.format === 'IN_PERSON' ? (
                            <Building2 className="size-3.5" />
                        ) : (
                            <Building2 className="size-3.5" />
                        )}
                        {FORMAT_LABELS[tutor.format] ?? tutor.format}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {tutor.slotsAvailable > 0
                            ? `${tutor.slotsAvailable} slot${tutor.slotsAvailable > 1 ? 's' : ''} available`
                            : 'No slots yet'}
                    </span>
                </div>

                <p className="text-sm leading-relaxed text-base-content/60 line-clamp-2">{tutor.bio}</p>

                <div className="flex flex-wrap items-center gap-2">
                    {tutor.subjects.map((s) => {
                        const subj = displayAmount(s.rate_cents, tutor.currency, auth);
                        return (
                            <span
                                key={s.name}
                                className="rounded-full border border-base-content/10 bg-base-content/5 px-3 py-1 text-xs text-base-content/80"
                            >
                                {s.name}
                                {s.rate_cents > 0 && (
                                    <span className="ml-1 font-medium text-primary">
                                        {subj.text}/hr
                                        {subj.note && (
                                            <span className="ml-1 font-normal text-base-content/40">
                                                ({subj.note} · {tutor.currency} to {getCurrencyCookie() || 'INR'})
                                            </span>
                                        )}
                                    </span>
                                )}
                            </span>
                        );
                    })}
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {LEVEL_LABELS[tutor.level as keyof typeof LEVEL_LABELS] ?? tutor.level}
                    </span>
                </div>

                <div className="card-actions mt-1 flex items-center justify-between">
                    <p className="font-display text-lg font-bold text-primary sm:hidden">
                        {tutor.rate > 0 ? `${rate.text}/hr` : 'Rate on request'}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={message}
                            className="btn btn-outline btn-sm rounded-full"
                            aria-label={`Message ${tutor.name}`}
                        >
                            <MessageSquare className="size-4" /> Message
                        </button>
                        <button
                            onClick={() => router.visit(`/t/${tutor.username}`)}
                            className="btn btn-primary btn-sm rounded-full px-5"
                        >
                            Book a Trial Lesson
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
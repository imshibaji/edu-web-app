import { Link } from '@inertiajs/react';
import { LifeBuoy, BookOpen, UserPlus, CreditCard, CalendarDays, ShieldQuestion } from 'lucide-react';

import PublicLayout from '@/components/larnr/public-layout';
import PageHeader from '@/components/larnr/page-header';
import ContentSection from '@/components/larnr/content-section';
import { useAuth } from '@/utils';

const CATEGORIES = [
    {
        icon: BookOpen,
        title: 'Finding a tutor',
        faqs: [
            {
                q: 'How do I find the right tutor?',
                a: 'Browse our tutors page, filter by subject, city and format, and read each educator’s profile. You can book a free trial lesson before committing.',
            },
            {
                q: 'What is a trial lesson?',
                a: 'A trial lesson is a short first session (about 30 minutes) so you can meet the tutor, share your goals, and decide if they are the right fit — free.',
            },
        ],
    },
    {
        icon: UserPlus,
        title: 'Becoming a tutor',
        faqs: [
            {
                q: 'How do I become a tutor on Larnr?',
                a: 'Create an account, complete your profile, and our team will invite you to a short interview. Prepare using our interview prep materials.',
            },
            {
                q: 'How do interviews work?',
                a: 'Interviews are conducted online and cover teaching method, subject mastery and communication. You will be given feedback either way.',
            },
        ],
    },
    {
        icon: CalendarDays,
        title: 'Bookings & lessons',
        faqs: [
            {
                q: 'How do I book a lesson?',
                a: 'Open a tutor’s profile, choose a subject and time from their availability, and confirm your booking. You will get a confirmation with details.',
            },
            {
                q: 'Can I reschedule a lesson?',
                a: 'Yes. Reach out to your tutor through the platform as early as possible. Rescheduling depends on the tutor’s availability.',
            },
        ],
    },
    {
        icon: CreditCard,
        title: 'Payments',
        faqs: [
            {
                q: 'How are tutors paid?',
                a: 'Tutors are paid for completed lessons at the rate shown on their profile. We handle the mechanics and notify you when a payment is processed.',
            },
            {
                q: 'Are there any hidden fees?',
                a: 'No. The rate you see is the rate you pay. We are transparent about pricing, always.',
            },
        ],
    },
    {
        icon: ShieldQuestion,
        title: 'Safety & privacy',
        faqs: [
            {
                q: 'How do you keep students safe?',
                a: 'Every tutor is interviewed and verified before listing. We also review reported concerns and remove educators who do not meet our standards.',
            },
            {
                q: 'Where can I learn more about safety?',
                a: 'See our Trust & Safety page for a full breakdown of how we protect students and educators.',
            },
        ],
    },
];

export default function Help() {
    const auth = useAuth();

    return (
        <PublicLayout auth={auth} title="Help Center">
            <PageHeader
                eyebrow="Help Center"
                title="How can we help?"
                description="Answers to the most common questions about finding tutors, becoming an educator, booking lessons and more."
            />

            <section className="py-10">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="space-y-10">
                        {CATEGORIES.map((cat) => (
                            <div key={cat.title}>
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                                        <cat.icon className="size-4" />
                                    </span>
                                    <h2 className="font-display text-xl font-bold text-base-content">
                                        {cat.title}
                                    </h2>
                                </div>
                                <div className="space-y-3">
                                    {cat.faqs.map((f) => (
                                        <div
                                            key={f.q}
                                            tabIndex={0}
                                            className="collapse collapse-plus border border-base-content/10 bg-base-content/[0.04]"
                                        >
                                            <div className="collapse-title text-sm font-semibold text-base-content">
                                                {f.q}
                                            </div>
                                            <div className="collapse-content">
                                                <p className="text-sm leading-relaxed text-base-content/60">
                                                    {f.a}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <ContentSection>
                <div className="flex flex-col items-center gap-4 text-center">
                    <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                        <LifeBuoy className="size-6" />
                    </span>
                    <h2 className="font-display text-2xl font-bold text-base-content">
                        Still need help?
                    </h2>
                    <p className="max-w-md text-sm text-base-content/60">
                        Our team replies within one business day.
                    </p>
                    <Link href="/contact" className="btn btn-primary rounded-full px-8">
                        Contact support
                    </Link>
                </div>
            </ContentSection>
        </PublicLayout>
    );
}

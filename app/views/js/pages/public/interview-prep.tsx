import { Link } from '@inertiajs/react';
import { ClipboardList, Video, Lightbulb, Star, ArrowRight } from 'lucide-react';

import PublicLayout from '@/components/larnr/public-layout';
import PageHeader from '@/components/larnr/page-header';
import ContentSection from '@/components/larnr/content-section';
import { useAuth } from '@/utils';

const STEPS = [
    {
        icon: ClipboardList,
        title: 'Know your subject',
        text: 'Be ready to teach the topics you claim. Review the syllabus, common student struggles, and prepare clear explanations.',
    },
    {
        icon: Video,
        title: 'Practice your delivery',
        text: 'Record a short mock lesson. Watch it back and refine your pace, energy and clarity. A confident first impression matters.',
    },
    {
        icon: Lightbulb,
        title: 'Plan a trial lesson',
        text: 'Prepare a structured 30-minute trial with a clear objective, an engaging activity, and a measurable takeaway.',
    },
    {
        icon: Star,
        title: 'Win the booking',
        text: 'Follow up with parents and students, share your plan, and let your preparation speak for itself.',
    },
];

export default function InterviewPrep() {
    const auth = useAuth();

    return (
        <PublicLayout auth={auth} title="Interview Prep">
            <PageHeader
                eyebrow="Tutor Interview Preparation"
                title="Ace your tutor interview"
                description="Free coaching materials to help you prepare for your tutor interview and win more students on Larnr."
            />

            <ContentSection title="What we look for">
                <p>
                    Our interview panel evaluates three things: teaching method, subject mastery,
                    and communication. Strong tutors come prepared with a lesson plan, speak
                    clearly, and adapt their approach to the student in front of them.
                </p>
                <p>
                    You do not need to be a polished performer — you need to be a thoughtful
                    teacher. Show us how you explain an idea simply, how you keep a lesson
                    engaging, and how you handle a student who is stuck.
                </p>
            </ContentSection>

            <section className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display text-2xl font-bold text-base-content">
                        How to prepare, step by step
                    </h2>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        {STEPS.map((s, i) => (
                            <div
                                key={s.title}
                                className="card card-border border-base-content/10 bg-base-content/[0.04]"
                            >
                                <div className="card-body">
                                    <div className="flex items-center justify-between">
                                        <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                                            <s.icon className="size-5" />
                                        </span>
                                        <span className="font-display text-4xl font-extrabold text-base-content/10">
                                            {i + 1}
                                        </span>
                                    </div>
                                    <h3 className="font-display mt-3 font-semibold text-base-content">
                                        {s.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-base-content/60">
                                        {s.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <ContentSection title="Sample interview questions">
                <ul className="list-disc space-y-2 pl-5">
                    <li>Walk us through how you would teach a beginner a topic you love.</li>
                    <li>How do you keep a student engaged through an hour-long lesson?</li>
                    <li>Tell us about a time a student was struggling and you helped them succeed.</li>
                    <li>How do you prepare for a first trial lesson?</li>
                    <li>How do you handle feedback from parents or students?</li>
                </ul>
            </ContentSection>

            <section className="py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="card relative overflow-hidden border border-primary/30 bg-gradient-to-r from-primary/20 via-secondary/15 to-secondary/20">
                        <div className="card-body items-center gap-4 py-12 text-center">
                            <h2 className="font-display max-w-xl text-3xl font-bold text-base-content sm:text-4xl">
                                Ready to become an educator?
                            </h2>
                            <p className="max-w-lg text-sm text-base-content/80 sm:text-base">
                                Sign up, complete your profile, and start your interview journey
                                today.
                            </p>
                            <div className="card-actions mt-4 flex flex-wrap justify-center gap-3">
                                <Link href="/auth/register" className="btn btn-primary rounded-full px-8">
                                    Become a Tutor
                                    <ArrowRight className="size-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}

import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Mail, MapPin, Clock, Send } from 'lucide-react';

import PublicLayout from '@/components/larnr/public-layout';
import PageHeader from '@/components/larnr/page-header';
import ContentSection from '@/components/larnr/content-section';
import { useAuth } from '@/utils';

const CONTACT_DETAILS = [
    {
        icon: Mail,
        title: 'Email us',
        text: 'hello@larnr.com',
        sub: 'We reply within 1 business day.',
    },
    {
        icon: Clock,
        title: 'Support hours',
        text: 'Mon – Fri, 9am – 6pm IST',
        sub: 'Emergencies: 24/7 for booked lessons.',
    },
    {
        icon: MapPin,
        title: 'Based in',
        text: 'Remote-first',
        sub: 'Serving students worldwide.',
    },
];

export default function Contact() {
    const auth = useAuth();

    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [processing, setProcessing] = useState(false);

    const update = (key: keyof typeof form) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            '/contact',
            form,
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <PublicLayout auth={auth} title="Contact">
            <PageHeader
                eyebrow="Contact"
                title="We would love to hear from you"
                description="Questions about tutoring, becoming an educator, or partnerships — reach out any time."
            />

            <section className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-5">
                        <div className="space-y-4 lg:col-span-2">
                            {CONTACT_DETAILS.map((d) => (
                                <div
                                    key={d.title}
                                    className="card card-border border-base-content/10 bg-base-content/[0.04]"
                                >
                                    <div className="card-body gap-1">
                                        <div className="flex items-center gap-3">
                                            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                                                <d.icon className="size-5" />
                                            </span>
                                            <div>
                                                <h3 className="font-display text-sm font-semibold text-base-content">
                                                    {d.title}
                                                </h3>
                                                <p className="text-sm text-base-content/80">{d.text}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-base-content/50">{d.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form
                            onSubmit={submit}
                            className="card card-border lg:col-span-3 border-base-content/10 bg-base-content/[0.04]"
                        >
                            <div className="card-body gap-4">
                                <h2 className="font-display text-xl font-bold text-base-content">
                                    Send us a message
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="form-control">
                                        <span className="label-text mb-1 text-xs text-base-content/60">
                                            Your name
                                        </span>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={update('name')}
                                            required
                                            placeholder="Jane Doe"
                                            className="input input-bordered w-full rounded-xl bg-base-100"
                                        />
                                    </label>
                                    <label className="form-control">
                                        <span className="label-text mb-1 text-xs text-base-content/60">
                                            Email address
                                        </span>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={update('email')}
                                            required
                                            placeholder="jane@example.com"
                                            className="input input-bordered w-full rounded-xl bg-base-100"
                                        />
                                    </label>
                                </div>
                                <label className="form-control">
                                    <span className="label-text mb-1 text-xs text-base-content/60">
                                        Message
                                    </span>
                                    <textarea
                                        value={form.message}
                                        onChange={update('message')}
                                        required
                                        rows={5}
                                        placeholder="How can we help?"
                                        className="textarea textarea-bordered w-full rounded-xl bg-base-100"
                                    />
                                </label>
                                <div className="card-actions justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="btn btn-primary rounded-full px-8"
                                    >
                                        {processing ? 'Sending…' : 'Send Message'}
                                        <Send className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            <ContentSection>
                <p className="text-center text-sm text-base-content/50">
                    Prefer email? Write to us directly at{' '}
                    <a href="mailto:hello@larnr.com" className="link link-hover text-primary">
                        hello@larnr.com
                    </a>
                </p>
            </ContentSection>
        </PublicLayout>
    );
}

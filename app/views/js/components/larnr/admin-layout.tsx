import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import type { AuthProps } from '@/types';

const SECTIONS = [
    { key: 'users', label: 'Users', href: '/admin/users' },
    { key: 'tutors', label: 'Tutors', href: '/admin/tutors' },
    { key: 'students', label: 'Students', href: '/admin/students' },
    { key: 'subjects', label: 'Subjects', href: '/admin/subjects' },
    { key: 'payments', label: 'Payments', href: '/admin/payments' },
    { key: 'reviews', label: 'Reviews', href: '/admin/reviews' },
    { key: 'activities', label: 'Activity', href: '/admin/activities' },
] as const;

interface AdminLayoutProps {
    auth: AuthProps;
    section: string;
    title: string;
    heading: string;
    description: string;
    children: ReactNode;
}

export default function AdminLayout({
    auth,
    section,
    title,
    heading,
    description,
    children,
}: AdminLayoutProps) {
    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title={title} />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                <FlashToast />

                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        Admin
                    </span>
                    <h1 className="font-display mt-2 text-2xl font-bold text-base-content">
                        {heading}
                    </h1>
                    <p className="text-sm text-base-content/60">{description}</p>

                    {/* <div className="mt-6 flex flex-wrap gap-2">
                        {SECTIONS.map((item) => {
                            const active = item.key === section;
                            return (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-primary/15 text-primary'
                                            : 'bg-base-content/5 text-base-content/60 hover:bg-base-content/10 hover:text-base-content'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div> */}

                    <div className="mt-6">{children}</div>
                </div>

                <Footer />
            </div>
        </div>
    );
}

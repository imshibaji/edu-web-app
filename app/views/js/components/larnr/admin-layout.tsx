import { Head, Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    Users,
    GraduationCap,
    BookOpen,
    CreditCard,
    Coins,
    ClipboardCheck,
    Activity,
    Shield,
    LayoutDashboard,
} from 'lucide-react';

import Navbar from '@/components/larnr/navbar';
import FlashToast from '@/components/larnr/flash-toast';
import type { AuthProps } from '@/types';

const SECTIONS = [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { key: 'users', label: 'Users', href: '/admin/users', icon: Users },
    { key: 'tutors', label: 'Tutors', href: '/admin/tutors', icon: GraduationCap },
    { key: 'students', label: 'Students', href: '/admin/students', icon: Users },
    { key: 'subjects', label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
    { key: 'payments', label: 'Payments', href: '/admin/payments', icon: CreditCard },
    { key: 'currencies', label: 'Currencies', href: '/admin/currencies', icon: Coins },
    { key: 'reviews', label: 'Reviews', href: '/admin/reviews', icon: ClipboardCheck },
    { key: 'activities', label: 'Activity', href: '/admin/activities', icon: Activity },
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
    const { url } = usePage();

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title={title} />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                <FlashToast />

                <div className="flex">
                    {/* ── Sidebar ───────────────────────────────────── */}
                    <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-64 shrink-0 border-r border-base-content/10 bg-base-200/50 backdrop-blur-xl lg:block">
                        <div className="flex h-full flex-col px-3 py-6">
                            <div className="mb-6 flex items-center gap-2.5 px-3">
                                <span className="grid size-8 place-items-center rounded-lg bg-primary/15">
                                    <Shield className="size-4 text-primary" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                        Admin
                                    </p>
                                </div>
                            </div>

                            <nav className="flex flex-col gap-1">
                                {SECTIONS.map((item) => {
                                    const active = item.key === section;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.key}
                                            href={item.href}
                                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                                active
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-base-content/60 hover:bg-base-content/5 hover:text-base-content'
                                            }`}
                                        >
                                            <Icon className="size-4 shrink-0" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* ── Main content ─────────────────────────────── */}
                    <main className="min-h-[calc(100vh-65px)] flex-1 overflow-y-auto">
                        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-3">
                                <h1 className="font-display text-2xl font-bold text-base-content">
                                    {heading}
                                </h1>
                            </div>
                            <p className="mt-1 text-sm text-base-content/60">{description}</p>

                            {/* Mobile section tabs (shown < lg) */}
                            <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
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
                            </div>

                            <div className="mt-6">{children}</div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

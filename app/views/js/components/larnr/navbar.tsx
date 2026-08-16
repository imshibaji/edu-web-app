import { Link, router, usePage } from '@inertiajs/react';
import { GraduationCap, Menu, ChevronDown, LogOut, LayoutDashboard, User } from 'lucide-react';

import { getInitials } from '@/utils/index';
import { CURRENCIES, setCurrencyCookie, getCurrencyCookie } from '@/utils/currency';
import ThemeToggle from '@/components/larnr/theme-toggle';
import ChangeCurrency from './change-currency';
import type { AuthProps, NavLink } from '@/types';

interface Props {
    auth: AuthProps;
}

export default function Navbar({ auth }: Props) {
    const { url } = usePage();
    const user = auth.user;
    const isTutor = user?.role === 'TUTOR';
    const dashboardHref = isTutor ? '/tutor' : '/dashboard';

    const logout = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        router.post('/auth/logout');
    };

    const navLinks: NavLink[] = isTutor
        ? [
            { label: 'Dashboard', href: '/tutor' },
            { label: 'Availability', href: '/tutor/availability' },
            { label: 'Subjects', href: '/tutor/subjects' },
            { label: 'Enquiries', href: '/tutor/enquiries' },
            { label: 'Profile', href: '/tutor/profile' },
        ]
        : user?.role === 'ADMIN'
        ? [
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Reviews', href: '/admin/reviews' },
            { label: 'Activity', href: '/admin/activities' },
        ]
        : [
            { label: 'Find Tutors', href: '/tutors' },
            { label: 'Subjects', href: '/subjects' },
            { label: 'Interview Prep', href: '/interview-prep' },
            { label: 'About', href: '/about' },
        ];

    const isActive = (href: string): boolean => {
        if (href === '/tutor') return url === '/tutor' || url === '/tutor/';
        return url === href || url.startsWith(href);
    };

    return (
        <header className="sticky top-0 z-40 border-b border-base-content/10 bg-base-100/70 backdrop-blur-xl">
            <div className="navbar mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="navbar-start">
                    <div className="dropdown lg:hidden">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                            <Menu className="size-5" />
                        </div>
                        <ul
                            tabIndex={0}
                            className="dropdown-content menu mt-2 w-56 rounded-box border border-base-content/10 bg-base-200/95 p-2 shadow-2xl backdrop-blur-xl"
                        >
                            {navLinks.map((l) => (
                                <li key={l.href}>
                                    <Link
                                        href={l.href}
                                        className={`text-sm ${
                                            isActive(l.href)
                                                ? 'text-primary'
                                                : 'text-base-content'
                                        }`}
                                    >
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                            <li className="mt-1 border-t border-base-content/10 pt-1">
                                {user ? (
                                    isTutor ? (
                                        <Link href="/tutors" className="text-sm text-base-content">
                                            Browse Tutors
                                        </Link>
                                    ) : (
                                        <Link href={dashboardHref} className="text-sm text-base-content">
                                            Dashboard
                                        </Link>
                                    )
                                ) : (
                                    <Link href="/auth/login" className="text-sm text-base-content">
                                        Log in
                                    </Link>
                                )}
                            </li>
                        </ul>
                    </div>

                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-primary/30">
                            <GraduationCap className="size-5 text-white" />
                        </span>
                        <span className="font-display text-xl font-bold tracking-tight text-base-content">
                            Larnr
                        </span>
                    </Link>
                </div>

                <div className="navbar-center hidden lg:flex">
                    <ul className="flex items-center gap-1">
                        {navLinks.map((l) => (
                            <li key={l.href}>
                                <Link
                                    href={l.href}
                                    className={`rounded-full px-4 py-2 text-sm transition-colors ${
                                        isActive(l.href)
                                            ? 'bg-primary/10 font-medium text-primary'
                                            : 'text-base-content/80 hover:bg-base-content/5 hover:text-base-content'
                                    }`}
                                >
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="navbar-end gap-1">
                    <ChangeCurrency />
                    <ThemeToggle />
                    {user ? (
                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-ghost gap-2 px-1.5">
                                <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white">
                                    {getInitials(user.name || user.email || 'U')}
                                </span>
                                <ChevronDown className="hidden size-4 text-base-content/60 sm:block" />
                            </div>
                            <ul
                                tabIndex={0}
                                className="dropdown-content menu mt-2 w-56 rounded-box border border-base-content/10 bg-base-200/95 p-2 shadow-2xl backdrop-blur-xl"
                            >
                                <li className="pointer-events-none px-4 py-2 text-xs text-base-content/50">
                                    Signed in as {user.email}
                                </li>
                                <li>
                                    <Link href={dashboardHref} className="text-sm">
                                        <LayoutDashboard className="size-4" /> Dashboard
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/settings/profile" className="text-sm">
                                        <User className="size-4" /> Profile settings
                                    </Link>
                                </li>
                                <li>
                                    <span className="block px-4 py-2 text-xs text-base-content/70">
                                        Base currency: {user?.base_currency ?? 'INR'}
                                    </span>
                                </li>
                                <li>
                                    <a href="#" onClick={logout} className="text-sm text-error">
                                        <LogOut className="size-4" /> Sign out
                                    </a>
                                </li>
                            </ul>
                        </div>
                    ) : (
                        <>
                            <Link
                                href="/auth/login"
                                className="hidden rounded-full px-4 py-2 text-sm font-medium text-base-content/80 transition-colors hover:text-base-content sm:block"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/auth/register"
                                className="btn btn-primary rounded-full px-5 text-sm"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
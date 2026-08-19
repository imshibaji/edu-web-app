import { Children, ReactNode, useState } from 'react';
import { Link, usePage, Head } from '@inertiajs/react';
import { LayoutDashboard, CalendarClock, Inbox, BookOpen, MessageSquare, Users, Settings, ChevronLeft, ChevronRight, LogOut, Menu, X, GraduationCap } from 'lucide-react';
import { useAuth } from '@/utils/index';
import Avatar from '@/components/larnr/avatar';

interface Props {
    children: ReactNode;
    title?: string;
}

const LINKS = [
    { href: '/tutor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tutor/availability', label: 'Availability', icon: CalendarClock },
    { href: '/tutor/subjects', label: 'Subjects & Charges', icon: BookOpen },
    { href: '/tutor/enquiries', label: 'Enquiries', icon: Inbox },
    { href: '/tutor/messages', label: 'Messages', icon: MessageSquare },
    { href: '/tutor/students', label: 'My Students', icon: Users },
    { href: '/settings/profile', label: 'Settings', icon: Settings },
];

export default function TutorLayout({ children, title }: Props) {
    const { url } = usePage();
    const auth = useAuth() ?? { user: null };
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const isActive = (href: string) => {
        if (href === '/tutor') return url === '/tutor' || url === '/tutor/';
        return url.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title={title ? `${title} · Tutor Dashboard` : 'Tutor Dashboard'} />

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-base-content/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full bg-base-100 border-r border-base-content/10 transition-all duration-300 lg:relative lg:z-auto ${sidebarCollapsed ? 'w-16' : 'w-64'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                aria-label="Tutor navigation"
            >
                <div className="flex h-full flex-col">
                    {/* Logo/Brand */}
                    <div className="flex h-16 shrink-0 items-center justify-between border-b border-base-content/10 px-4">
                        {!sidebarCollapsed && (
                            <Link href="/tutor" className="flex items-center gap-2.5">
                                <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-primary/30">
                                    <GraduationCap className="size-5 text-white" />
                                </span>
                                <span className="font-display text-xl font-bold text-base-content">Larnr</span>
                            </Link>
                        )}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="flex shrink-0 items-center justify-center rounded-xl p-1.5 text-base-content/50 hover:bg-base-content/5 transition-colors"
                            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {sidebarCollapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Main navigation">
                        <ul className="space-y-1" role="list">
                            {LINKS.map(({ href, label, icon: Icon }) => {
                                const active = isActive(href);
                                return (
                                    <li key={href}>
                                        <Link
                                            href={href}
                                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                                active
                                                    ? 'bg-primary/15 text-primary'
                                                    : 'text-base-content/60 hover:bg-base-content/5 hover:text-base-content'
                                            }`}
                                            aria-current={active ? 'page' : undefined}
                                        >
                                            <Icon className={`size-5 shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''}`} aria-hidden="true" />
                                            {!sidebarCollapsed && <span>{label}</span>}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* User menu at bottom */}
                        <div className="mt-auto pt-4 border-t border-base-content/10">
                            {!sidebarCollapsed && auth.user && (
                                <div className="px-3 pb-3">
                                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-base-content/5">
                                        <Avatar
                                            src={auth.user.avatar}
                                            name={auth.user.name}
                                            className="size-9"
                                            textClass="text-sm"
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-base-content">
                                                {auth.user.name}
                                            </p>
                                            <p className="truncate text-xs text-base-content/50 capitalize">
                                                {auth.user.role?.toLowerCase()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="px-3">
                                <Link
                                    href="/auth/logout"
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-error hover:bg-error/10 ${sidebarCollapsed ? 'justify-center' : ''}`}
                                >
                                    <LogOut className={`size-5 shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''}`} aria-hidden="true" />
                                    {!sidebarCollapsed && <span>Sign out</span>}
                                </Link>
                            </div>
                        </div>
                    </nav>
                </div>
            </aside>

            {/* Main content */}
            <main
                className={`flex-1 min-h-screen lg:ml-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
            >
                {/* Mobile header with sidebar toggle */}
                <header className="lg:hidden sticky top-0 z-30 h-14 bg-base-100 border-b border-base-content/10">
                    <div className="flex h-full items-center justify-between px-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="flex shrink-0 items-center justify-center rounded-xl p-2 text-base-content/50 hover:bg-base-content/5"
                            aria-label="Open sidebar"
                        >
                            <Menu className="size-6" />
                        </button>
                        <span className="font-display text-lg font-bold text-base-content truncate mx-4">
                            Tutor Dashboard
                        </span>
                        <div className="w-10" />
                    </div>
                </header>

                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
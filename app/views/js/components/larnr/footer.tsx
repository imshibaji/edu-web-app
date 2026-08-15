import { Link } from '@inertiajs/react';
import { GraduationCap, AtSign, Globe, Share2, Rss } from 'lucide-react';

interface FooterLink {
    label: string;
    href: string;
}

interface FooterColumn {
    title: string;
    links: FooterLink[];
}

export default function Footer() {
    const columns: FooterColumn[] = [
        {
            title: 'Company',
            links: [
                { label: 'About', href: '/#about' },
                { label: 'Careers', href: '/#about' },
                { label: 'Contact', href: '/#about' },
                { label: 'Privacy Policy', href: '/#about' },
            ],
        },
        {
            title: 'Resources',
            links: [
                { label: 'Find Tutors', href: '/#educators' },
                { label: 'Subjects', href: '/#specialties' },
                { label: 'Tutor Interview Prep', href: '/#interview' },
                { label: 'Become a Tutor', href: '/auth/register' },
            ],
        },
        {
            title: 'Support',
            links: [
                { label: 'Help Center', href: '/#about' },
                { label: 'Terms of Service', href: '/#about' },
                { label: 'Trust & Safety', href: '/#about' },
            ],
        },
    ];

    return (
        <footer className="border-t border-base-content/10 bg-base-200">
            <div className="footer mx-auto max-w-7xl gap-8 px-4 py-14 sm:footer-horizontal sm:px-6 lg:px-8">
                <aside className="max-w-sm">
                    <div className="flex items-center gap-2.5">
                        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                            <GraduationCap className="size-5 text-white" />
                        </span>
                        <span className="font-display text-xl font-bold text-base-content">Larnr</span>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-base-content/60">
                        Connecting students with premium educators worldwide. Quality tutors,
                        verified and interview-prepared, ready for your first trial lesson.
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                        {[AtSign, Globe, Share2, Rss].map((Icon, i) => (
                            <a
                                key={i}
                                href="#"
                                aria-label="social link"
                                className="grid size-9 place-items-center rounded-full border border-base-content/10 text-base-content/60 transition-colors hover:border-primary/50 hover:text-primary"
                            >
                                <Icon className="size-4" />
                            </a>
                        ))}
                    </div>
                </aside>

                {columns.map((col) => (
                    <nav key={col.title}>
                        <h6 className="footer-title text-base-content/80">{col.title}</h6>
                        {col.links.map((l) => (
                            <Link
                                key={l.label}
                                href={l.href}
                                className="link link-hover text-sm text-base-content/60"
                            >
                                {l.label}
                            </Link>
                        ))}
                    </nav>
                ))}
            </div>

            <div className="border-t border-base-content/10 py-6">
                <p className="mx-auto max-w-7xl px-4 text-center text-xs text-base-content/50 sm:px-6 lg:px-8">
                    © {new Date().getFullYear()} Larnr. All rights reserved. Made with care for
                    learners everywhere.
                </p>
            </div>
        </footer>
    );
}
import { Link, usePage } from "@inertiajs/react";
import { LayoutDashboard, CalendarClock, Inbox, BookOpen } from "lucide-react";

const LINKS = [
    { href: "/tutor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tutor/availability", label: "Availability", icon: CalendarClock },
    { href: "/tutor/subjects", label: "Subjects", icon: BookOpen },
    { href: "/tutor/enquiries", label: "Enquiries", icon: Inbox },
];

export default function TutorNav() {
    const { url } = usePage();

    const isActive = (href) => {
        if (href === "/tutor") return url === "/tutor" || url === "/tutor/";
        return url.startsWith(href);
    };

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 rounded-2xl border border-base-content/10 bg-base-content/[0.04] p-1.5">
                {LINKS.map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                                active
                                    ? "bg-primary/15 text-primary"
                                    : "text-base-content/60 hover:bg-base-content/5 hover:text-base-content"
                            }`}
                        >
                            <Icon className="size-4" />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

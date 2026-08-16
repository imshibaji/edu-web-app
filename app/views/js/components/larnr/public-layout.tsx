import { Head } from '@inertiajs/react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import type { AuthProps } from '@/types';

interface Props {
    auth: AuthProps;
    title?: string;
    children: React.ReactNode;
}

export default function PublicLayout({ auth, title, children }: Props) {
    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title={title} />

            <FlashToast />

            {/* ambient background */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
                <div className="absolute top-40 -left-32 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
                <div className="absolute top-64 -right-32 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={auth} />
                {children}
                <Footer />
            </div>
        </div>
    );
}

import { Head, useEffect } from 'react';
import { Loader2, ArrowLeft, CreditCard } from 'lucide-react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import { useAuth } from '@/utils/index';
import type { AuthProps } from '@/types';

export default function PaymentConnect(props: { auth: AuthProps; redirectUrl?: string }) {
    useEffect(() => {
        // Redirect to Stripe Connect onboarding
        if (props.redirectUrl) {
            window.location.href = props.redirectUrl;
        }
    }, [props.redirectUrl]);

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Connect Stripe · Larnr" />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={props.auth} />
                <FlashToast />

                <div className="space-y-6 py-16">
                    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 text-center">
                        <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6 animate-pulse">
                            <CreditCard className="size-12 text-primary" />
                        </div>

                        <h1 className="font-display text-3xl font-bold text-base-content mb-3">
                            Connecting to Stripe...
                        </h1>
                        <p className="text-lg text-base-content/60 mb-8">
                            Redirecting you to Stripe to set up your payout account.
                        </p>

                        <div className="card card-border border-base-content/10 bg-base-content/[0.04] p-6 space-y-4">
                            <div className="flex items-center justify-center gap-3 text-sm text-base-content/60">
                                <Loader2 className="size-5 animate-spin text-primary" />
                                <span>Redirecting to Stripe...</span>
                            </div>
                            <p className="text-sm text-base-content/60">
                                If you are not redirected automatically,{' '}
                                <a
                                    href={props.redirectUrl || '/tutor/profile'}
                                    className="underline text-primary hover:text-primary/80"
                                >
                                    click here
                                </a>
                            </p>
                        </div>

                        <div className="pt-4">
                            <a
                                href="/tutor/profile"
                                className="btn btn-outline rounded-full px-8 border-base-content/15 text-base-content/80 hover:bg-base-content/5"
                            >
                                <ArrowLeft className="size-4 mr-2" />
                                Back to Profile
                            </a>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}
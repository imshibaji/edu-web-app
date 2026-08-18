import { Head } from '@inertiajs/react';
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import { useAuth } from '@/utils/index';
import type { AuthProps } from '@/types';

export default function PaymentSuccess(props: { auth: AuthProps }) {
    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Payment Successful · Larnr" />

            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={props.auth} />
                <FlashToast />

                <div className="space-y-6 py-16">
                    <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 text-center">
                        <div className="flex size-24 items-center justify-center rounded-full bg-success/10 mx-auto mb-6">
                            <CheckCircle2 className="size-12 text-success" />
                        </div>

                        <h1 className="font-display text-3xl font-bold text-base-content mb-3">
                            Payment Successful!
                        </h1>
                        <p className="text-lg text-base-content/60 mb-8">
                            Your trial lesson has been confirmed. The tutor has been notified.
                        </p>

                        <div className="card card-border border-base-content/10 bg-base-content/[0.04] p-6 space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-base-content/60">Status</span>
                                <span className="badge badge-success">Confirmed</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-base-content/60">Funds</span>
                                <span className="text-base-content font-medium">
                                    Held in platform escrow
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-base-content/60">Next step</span>
                                <span className="text-base-content font-medium">
                                    Tutor will confirm the lesson time
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <a
                                href="/dashboard"
                                className="btn btn-primary rounded-full px-8"
                            >
                                <ArrowLeft className="size-4 mr-2" />
                                Go to Dashboard
                            </a>
                            <a
                                href="/tutors"
                                className="btn btn-outline rounded-full px-8 border-base-content/15 text-base-content/80 hover:bg-base-content/5"
                            >
                                Book Another Lesson
                            </a>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}
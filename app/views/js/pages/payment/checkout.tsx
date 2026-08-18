import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { CheckCircle2, CreditCard, Loader2, AlertTriangle, XCircle, ArrowLeft, Shield, Banknote, Calendar, User, GraduationCap, Sparkles, Lock, ArrowRight } from 'lucide-react';

import Navbar from '@/components/larnr/navbar';
import Footer from '@/components/larnr/footer';
import FlashToast from '@/components/larnr/flash-toast';
import { displayAmount } from '@/utils/currency';
import { formatDateTime } from '@/utils/tutor';
import type { AuthProps, BookingProps } from '@/types';

interface Props {
    auth: AuthProps;
    booking: BookingProps & { tutor?: string; subject?: string };
    fees: {
        gross_amount: number;
        currency: string;
        platform_fee: number;
        processing_fee: number;
        tutor_receives: number;
        platform_fee_percent: number;
        processing_fee_percent: number;
        processing_fee_fixed: number;
    };
}

export default function PaymentCheckout(props: Props) {
    const [redirecting, setRedirecting] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        payment_method: 'card',
    });

    const amount = displayAmount(props.booking.amount, props.booking.currency, props.auth);
    const platformFee = displayAmount(props.fees.platform_fee, props.booking.currency, props.auth);
    const processingFee = displayAmount(props.fees.processing_fee, props.booking.currency, props.auth);
    const tutorReceives = displayAmount(props.fees.tutor_receives, props.booking.currency, props.auth);

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setRedirecting(true);
        post(`/payment/checkout/${props.booking.id}`, {
            onSuccess: (page) => {
                if (page.props.url) {
                    window.location.href = page.props.url;
                }
            },
            onError: () => {
                setRedirecting(false);
            },
        });
    };

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <Head title="Payment Checkout · Larnr" />

            {/* Animated background gradient */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[200px]" />
                <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-secondary/10 blur-[200px]" />
            </div>

            <div className="relative z-10">
                <Navbar auth={props.auth} />
                <FlashToast />

                <div className="space-y-8 py-12 pb-16">
                    {/* Header Section */}
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-4 mb-8">
                            <a
                                href="/dashboard"
                                className="btn btn-ghost btn-sm rounded-full hover:bg-base-content/5 transition-colors"
                            >
                                <ArrowLeft className="size-4" />
                            </a>
                            <div>
                                <h1 className="font-display text-3xl font-bold text-base-content">
                                    Payment Checkout
                                </h1>
                                <p className="text-sm text-base-content/60 mt-1">
                                    Complete payment to confirm your trial lesson
                                </p>
                            </div>
                        </div>

                        {/* Main Checkout Grid - Wider for desktop */}
                        <div className="grid gap-8 xl:grid-cols-12">
                            {/* Left Column - Payment Form & Details */}
                            <div className="xl:col-span-7 space-y-6">
                                {/* Booking Summary Card */}
                                <div className="card card-border border-base-content/10 bg-base-100 shadow-xl">
                                    <div className="card-body p-6 sm:p-8 space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
                                                <CreditCard className="size-7" />
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="font-display text-xl font-semibold text-base-content">
                                                    Payment Details
                                                </h2>
                                                <p className="text-sm text-base-content/60 mt-1">
                                                    Secure payment via Stripe • 3D Secure protected
                                                </p>
                                            </div>
                                        </div>

                                        <div className="divider divider-neutral" />

                                        {/* Booking Info Grid */}
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            <div className="p-4 rounded-xl bg-base-100 border border-base-content/5">
                                                <div className="flex items-center gap-2 text-xs text-base-content/50 mb-1">
                                                    <User className="size-3.5" />
                                                    <span>Tutor</span>
                                                </div>
                                                <p className="font-medium text-base-content text-sm">{props.booking.tutor}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-base-100 border border-base-content/5">
                                                <div className="flex items-center gap-2 text-xs text-base-content/50 mb-1">
                                                    <GraduationCap className="size-3.5" />
                                                    <span>Subject</span>
                                                </div>
                                                <p className="font-medium text-base-content text-sm">{props.booking.subject ?? 'General'}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-base-100 border border-base-content/5">
                                                <div className="flex items-center gap-2 text-xs text-base-content/50 mb-1">
                                                    <Calendar className="size-3.5" />
                                                    <span>Scheduled</span>
                                                </div>
                                                <p className="font-medium text-base-content text-sm">{formatDateTime(props.booking.scheduled_at)}</p>
                                            </div>
                                        </div>

                                        <div className="divider divider-neutral" />

                                        {/* Security Badges */}
                                        <div className="flex flex-wrap items-center gap-3 text-xs">
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                                                <Lock className="size-3" />
                                                Stripe 3D Secure
                                            </span>
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success font-medium">
                                                <CheckCircle2 className="size-3" />
                                                PCI DSS Compliant
                                            </span>
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning font-medium">
                                                <Shield className="size-3" />
                                                Encrypted
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Action Card */}
                                <div className="card card-border border-base-content/10 bg-base-100 shadow-xl">
                                    <div className="card-body p-6 sm:p-8 space-y-6">
                                        <h3 className="font-display text-lg font-semibold text-base-content flex items-center gap-2">
                                            <Shield className="size-5 text-primary" />
                                            Secure Payment
                                        </h3>
                                        <p className="text-sm text-base-content/60">
                                            You will be redirected to Stripe's secure payment page to complete the payment.
                                        </p>

                                        {errors?.payment && (
                                            <div className="flex items-center gap-2 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                                                <AlertTriangle className="size-4 shrink-0" />
                                                <span>{errors.payment}</span>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            onClick={submit}
                                            disabled={processing || redirecting}
                                            className="btn btn-primary w-full rounded-full py-4 text-lg font-semibold gap-3 shadow-lg hover:shadow-xl transition-all duration-200"
                                        >
                                            {redirecting ? (
                                                <>
                                                    <Loader2 className="size-6 animate-spin" />
                                                    Redirecting to Stripe Secure Checkout...
                                                </>
                                            ) : processing ? (
                                                <>
                                                    <Loader2 className="size-6 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <CreditCard className="size-6" />
                                                    <span>Pay {amount.text} Now</span>
                                                    <ArrowRight className="size-5" />
                                                </>
                                            )}
                                        </button>

                                        <p className="text-xs text-center text-base-content/50">
                                            By paying, you agree to our{" "}
                                            <a href="/terms" className="underline hover:text-primary">Terms of Service</a>{" "}
                                            and{" "}
                                            <a href="/privacy" className="underline hover:text-primary">Privacy Policy</a>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Order Summary */}
                            <div className="xl:col-span-5">
                                <div className="sticky top-24 space-y-6">
                                    {/* Order Summary Card */}
                                    <div className="card card-border border-base-content/10 bg-base-100 shadow-xl">
                                        <div className="card-body p-6 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-display text-lg font-semibold text-base-content">Order Summary</h3>
                                                <Sparkles className="size-5 text-primary" />
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-base-content/60 flex items-center gap-1.5">
                                                        <CreditCard className="size-4" />
                                                        Lesson
                                                    </span>
                                                    <span className="font-display text-xl font-bold text-base-content">{amount.text}</span>
                                                </div>

                                                <div className="divider divider-neutral" />

                                                <div className="space-y-3 text-sm">
                                                    <div className="flex items-center justify-between p-3 rounded-xl bg-base-100 border border-base-content/5">
                                                        <span className="text-base-content/60 flex items-center gap-1.5">
                                                            <Shield className="size-4" />
                                                            Platform Fee ({props.fees.platform_fee_percent}%)
                                                        </span>
                                                        <span className="font-medium text-base-content">{platformFee.text}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 rounded-xl bg-base-100 border border-base-content/5">
                                                        <span className="text-base-content/60 flex items-center gap-1.5">
                                                            <Banknote className="size-4" />
                                                            Processing Fee ({props.fees.processing_fee_percent}% + {props.fees.processing_fee_fixed}¢)
                                                        </span>
                                                        <span className="font-medium text-base-content">{processingFee.text}</span>
                                                    </div>
                                                </div>

                                                <div className="divider divider-neutral" />

                                                {/* Total - Highlighted */}
                                                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                                                                <Banknote className="size-5" />
                                                            </div>
                                                            <div>
                                                <p className="text-xs text-base-content/50">Tutor Receives</p>
                                                <p className="font-display text-xl font-bold text-success">{tutorReceives.text}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-base-content/50 mt-1">After platform & processing fees</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security & Guarantees Card */}
                                    <div className="card card-border border-base-content/10 bg-base-100 shadow-xl">
                                        <div className="card-body p-6 space-y-4">
                                            <h4 className="font-display text-sm font-semibold text-base-content flex items-center gap-2">
                                                <Sparkles className="size-4 text-primary" />
                                                Your Guarantees
                                            </h4>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/10">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/20 text-success">
                                                        <CheckCircle2 className="size-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-base-content">Secure Stripe Checkout</p>
                                                        <p className="text-xs text-base-content/60">PCI DSS Level 1 certified payment processing</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                                                        <GraduationCap className="size-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-base-content">Tutor Paid After Lesson</p>
                                                        <p className="text-xs text-base-content/60">Funds released only after lesson completion</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/5 border border-warning/10">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/20 text-warning">
                                                        <XCircle className="size-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-base-content">Full Refund Guarantee</p>
                                                        <p className="text-xs text-base-content/60">Automatic refund if tutor cancels or no-show</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}
import { Head, Link, useForm } from '@inertiajs/react';
import { GraduationCap, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

import ThemeToggle from '@/components/larnr/theme-toggle';

interface Props {
    errors: Record<string, string>;
    success?: string | null;
    email?: string;
}

export default function ForgotPassword(props: Props) {
    const { data, setData, post, processing, errors } = useForm<{ email: string }>({
        email: props.email ?? '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/auth/forgot-password');
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-base-100 px-4 py-10">
            <Head title="Forgot password" />

            <div className="absolute right-4 top-4 z-20">
                <ThemeToggle />
            </div>

            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
                <div className="absolute bottom-0 -right-32 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-md rounded-3xl border border-base-content/10 bg-base-content/[0.04] p-8 shadow-2xl backdrop-blur-xl sm:p-10">
                <div className="flex flex-col items-center">
                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-primary/30">
                            <GraduationCap className="size-5 text-white" />
                        </span>
                        <span className="font-display text-2xl font-bold text-base-content">Larnr</span>
                    </Link>
                    <h1 className="font-display mt-6 text-2xl font-bold text-base-content">
                        Forgot your password?
                    </h1>
                    <p className="mt-1 text-sm text-base-content/60">
                        Enter your email and we&apos;ll send you a link to reset it.
                    </p>
                </div>

                {props.success && (
                    <div className="alert alert-success mt-6 rounded-xl py-2.5 text-sm">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <span>{props.success}</span>
                    </div>
                )}

                {(errors.email || errors.general) && (
                    <div className="alert alert-error mt-6 rounded-xl py-2.5 text-sm">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>{errors.email || errors.general}</span>
                    </div>
                )}

                <form onSubmit={submit} className="mt-6 space-y-4">
                    <div className="fieldset">
                        <legend className="fieldset-legend">Email</legend>
                        <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                            <Mail className="size-4 text-base-content/50" />
                            <input
                                type="email"
                                name="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                        </label>
                        {errors.email && (
                            <span className="text-xs text-error">{errors.email}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary mt-2 w-full rounded-full"
                        disabled={processing}
                    >
                        {processing ? 'Sending...' : 'Send reset link'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-base-content/60">
                    Remembered it?{' '}
                    <Link href="/auth/login" className="font-medium text-primary hover:text-primary">
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
}
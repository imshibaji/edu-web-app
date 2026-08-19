import { Head, Link, useForm } from '@inertiajs/react';
import { GraduationCap, Lock, Mail, AlertCircle } from 'lucide-react';

import ThemeToggle from '@/components/larnr/theme-toggle';

interface Props {
    token: string;
    errors: Record<string, string>;
    email?: string;
}

export default function ResetPassword(props: Props) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        token: string;
        email: string;
        password: string;
        password_confirmation: string;
    }>({
        token: props.token,
        email: props.email ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/auth/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-base-100 px-4 py-10">
            <Head title="Reset password" />

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
                        Set a new password
                    </h1>
                    <p className="mt-1 text-sm text-base-content/60">
                        Choose a strong password for your account.
                    </p>
                </div>

                {(errors.general || errors.password) && (
                    <div className="alert alert-error mt-6 rounded-xl py-2.5 text-sm">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>{errors.general || errors.password}</span>
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
                                autoComplete="username"
                                placeholder="you@example.com"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="fieldset">
                        <legend className="fieldset-legend">New password</legend>
                        <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                            <Lock className="size-4 text-base-content/50" />
                            <input
                                type="password"
                                name="password"
                                autoComplete="new-password"
                                placeholder="At least 8 characters"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                        </label>
                        {errors.password && (
                            <span className="text-xs text-error">{errors.password}</span>
                        )}
                    </div>

                    <div className="fieldset">
                        <legend className="fieldset-legend">Confirm new password</legend>
                        <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                            <Lock className="size-4 text-base-content/50" />
                            <input
                                type="password"
                                name="password_confirmation"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary mt-2 w-full rounded-full"
                        disabled={processing}
                    >
                        {processing ? 'Resetting...' : 'Reset password'}
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
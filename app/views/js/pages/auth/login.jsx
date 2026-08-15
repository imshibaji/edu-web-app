import { Head, Link, useForm } from "@inertiajs/react";
import { GraduationCap, Mail, Lock, AlertCircle } from "lucide-react";

import ThemeToggle from "@/components/larnr/theme-toggle.jsx";

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post("/auth/login", {
            onFinish: () => reset("password"),
        });
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-base-100 px-4 py-10">
            <Head title="Log in" />

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
                        Welcome back
                    </h1>
                    <p className="mt-1 text-sm text-base-content/60">
                        Sign in to continue your learning journey
                    </p>
                </div>

                {(errors.auth || errors?.email) && (
                    <div className="alert alert-error mt-6 rounded-xl py-2.5 text-sm">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>{errors.auth || errors.email}</span>
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
                                onChange={(e) => setData("email", e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="fieldset">
                        <legend className="fieldset-legend">Password</legend>
                        <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                            <Lock className="size-4 text-base-content/50" />
                            <input
                                type="password"
                                name="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={data.password}
                                onChange={(e) => setData("password", e.target.value)}
                            />
                        </label>
                        {errors.password && (
                            <span className="text-xs text-error">{errors.password}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary mt-2 w-full rounded-full"
                        disabled={processing}
                    >
                        {processing ? "Signing in..." : "Log in"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-base-content/60">
                    Don't have an account?{" "}
                    <Link
                        href="/auth/register"
                        className="font-medium text-primary hover:text-primary"
                    >
                        Sign up
                    </Link>
                </div>

                <div className="mt-8 text-center text-xs text-base-content/40">
                    Demo accounts: demo@larnr.app · tutor1@larnr.app · admin@larnr.app (all
                    password: password)
                </div>
            </div>
        </div>
    );
}

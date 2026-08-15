import { Head, Link, useForm } from "@inertiajs/react";
import {
    GraduationCap,
    User,
    Mail,
    Phone,
    Lock,
    GraduationCap as TutorIcon,
    UserRound,
    AlertCircle,
} from "lucide-react";

import ThemeToggle from "@/components/larnr/theme-toggle.jsx";

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        fullName: "",
        email: "",
        phoneNumber: "",
        role: "STUDENT",
        password: "",
        confirmPassword: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post("/auth/register", {
            onFinish: () => reset("password", "confirmPassword"),
        });
    };

    const roles = [
        { value: "STUDENT", label: "I'm a Student", icon: UserRound, desc: "Find tutors & book lessons" },
        { value: "TUTOR", label: "I'm a Tutor", icon: TutorIcon, desc: "Teach & grow your students" },
    ];

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-base-100 px-4 py-10">
            <Head title="Create account" />

            <div className="absolute right-4 top-4 z-20">
                <ThemeToggle />
            </div>

            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
                <div className="absolute bottom-0 -left-32 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
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
                        Create your account
                    </h1>
                    <p className="mt-1 text-sm text-base-content/60">
                        Join premium educators and learners worldwide
                    </p>
                </div>

                {(errors.auth || Object.keys(errors).length > 0) && (
                    <div className="alert alert-error mt-6 rounded-xl py-2.5 text-sm">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>
                            {errors.auth ||
                                "Please fix the highlighted fields and try again."}
                        </span>
                    </div>
                )}

                <form onSubmit={submit} className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        {roles.map((r) => (
                            <button
                                key={r.value}
                                type="button"
                                onClick={() => setData("role", r.value)}
                                className={`rounded-2xl border p-3 text-left transition-colors ${
                                    data.role === r.value
                                        ? "border-primary bg-primary/15"
                                        : "border-base-content/10 bg-base-content/5 hover:border-base-content/25"
                                }`}
                            >
                                <r.icon
                                    className={`size-5 ${
                                        data.role === r.value
                                            ? "text-primary"
                                            : "text-base-content/60"
                                    }`}
                                />
                                <p className="mt-1.5 text-sm font-medium text-base-content">{r.label}</p>
                                <p className="text-xs text-base-content/50">{r.desc}</p>
                            </button>
                        ))}
                    </div>

                    <div className="fieldset">
                        <legend className="fieldset-legend">Full name</legend>
                        <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                            <User className="size-4 text-base-content/50" />
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Your full name"
                                value={data.fullName}
                                onChange={(e) => setData("fullName", e.target.value)}
                            />
                        </label>
                        {errors.fullName && (
                            <span className="text-xs text-error">{errors.fullName}</span>
                        )}
                    </div>

                    <div className="fieldset">
                        <legend className="fieldset-legend">Email</legend>
                        <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                            <Mail className="size-4 text-base-content/50" />
                            <input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                            />
                        </label>
                        {errors.email && (
                            <span className="text-xs text-error">{errors.email}</span>
                        )}
                    </div>

                    <div className="fieldset">
                        <legend className="fieldset-legend">Phone (optional)</legend>
                        <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                            <Phone className="size-4 text-base-content/50" />
                            <input
                                type="tel"
                                name="phoneNumber"
                                placeholder="+91 98765 43210"
                                value={data.phoneNumber}
                                onChange={(e) => setData("phoneNumber", e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="fieldset">
                            <legend className="fieldset-legend">Password</legend>
                            <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                                <Lock className="size-4 text-base-content/50" />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                />
                            </label>
                            {errors.password && (
                                <span className="text-xs text-error">{errors.password}</span>
                            )}
                        </div>

                        <div className="fieldset">
                            <legend className="fieldset-legend">Confirm</legend>
                            <label className="input w-full rounded-xl border-base-content/10 bg-base-content/5">
                                <Lock className="size-4 text-base-content/50" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    value={data.confirmPassword}
                                    onChange={(e) =>
                                        setData("confirmPassword", e.target.value)
                                    }
                                />
                            </label>
                            {errors.confirmPassword && (
                                <span className="text-xs text-error">
                                    {errors.confirmPassword}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary mt-2 w-full rounded-full"
                        disabled={processing}
                    >
                        {processing ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-base-content/60">
                    Already have an account?{" "}
                    <Link
                        href="/auth/login"
                        className="font-medium text-primary hover:text-primary"
                    >
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
}

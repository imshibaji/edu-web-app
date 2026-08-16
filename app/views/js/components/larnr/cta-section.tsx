import { ArrowRight } from 'lucide-react';
import { Link } from '@inertiajs/react';

import type { AuthProps } from '@/types';

interface Props {
    auth: AuthProps;
}

export default function CtaSection({ auth }: Props) {
    return (
        <section className="py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="card relative overflow-hidden border border-primary/30 bg-gradient-to-r from-primary/20 via-secondary/15 to-secondary/20">
                    <div className="card-body items-center gap-4 py-14 text-center">
                        <h2 className="font-display max-w-xl text-3xl font-bold text-base-content sm:text-4xl">
                            Ready to start your learning journey?
                        </h2>
                        <p className="max-w-lg text-sm text-base-content/80 sm:text-base">
                            Book a free trial lesson with a premium educator today. No commitment,
                            just great teaching.
                        </p>
                        <div className="card-actions mt-4 flex flex-wrap justify-center gap-3">
                            <Link
                                href={auth?.user ? '/dashboard' : '/auth/register'}
                                className="btn btn-primary rounded-full px-8"
                            >
                                {auth?.user ? 'Go to Dashboard' : 'Get Started'}
                                <ArrowRight className="size-4" />
                            </Link>
                            <Link
                                href="/#educators"
                                className="btn btn-ghost rounded-full px-8 text-base-content/80"
                            >
                                Browse Educators
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

interface Props {
    title?: string;
    eyebrow?: string;
    children: React.ReactNode;
}

export default function ContentSection({ title, eyebrow, children }: Props) {
    return (
        <section className="py-10">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                {eyebrow && (
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        {eyebrow}
                    </span>
                )}
                {title && (
                    <h2 className="font-display mt-2 mb-6 text-2xl font-bold text-base-content">
                        {title}
                    </h2>
                )}
                <div className="space-y-4 text-base leading-relaxed text-base-content/70">
                    {children}
                </div>
            </div>
        </section>
    );
}

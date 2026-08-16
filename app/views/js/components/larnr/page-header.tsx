interface Props {
    eyebrow?: string;
    title: string;
    description?: string;
}

export default function PageHeader({ eyebrow, title, description }: Props) {
    return (
        <section className="relative overflow-hidden">
            <div className="mx-auto max-w-4xl px-4 pt-16 pb-10 text-center sm:px-6 sm:pt-24 lg:px-8">
                {eyebrow && (
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        {eyebrow}
                    </span>
                )}
                <h1 className="font-display mt-4 text-4xl font-extrabold leading-tight tracking-tight text-base-content sm:text-5xl">
                    {title}
                </h1>
                {description && (
                    <p className="mx-auto mt-5 max-w-2xl text-base text-base-content/60 sm:text-lg">
                        {description}
                    </p>
                )}
            </div>
        </section>
    );
}

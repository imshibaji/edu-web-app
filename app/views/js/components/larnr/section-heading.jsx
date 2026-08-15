export default function SectionHeading({ eyebrow, title, description }) {
    return (
        <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {eyebrow}
            </span>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
                {title}
            </h2>
            {description && <p className="mt-4 text-base text-base-content/60">{description}</p>}
        </div>
    );
}
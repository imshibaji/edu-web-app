import { getInitials, avatarSrc } from "@/utils/index.jsx";

export default function Avatar({ src, name, className = "size-14", textClass = "text-base" }) {
    const resolved = avatarSrc(src);

    if (!resolved) {
        return (
            <span
                className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 font-bold text-white ${textClass} ${className}`}
            >
                {getInitials(name || "U")}
            </span>
        );
    }

    return (
        <img
            src={resolved}
            alt={name || "Avatar"}
            className={`shrink-0 rounded-2xl object-cover ${className}`}
        />
    );
}

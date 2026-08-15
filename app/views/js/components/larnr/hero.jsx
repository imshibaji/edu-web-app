import { Search,
    MapPin,
    Video,
    Building2,
    BadgeCheck,
    Users,
    Clock,
    ShieldCheck,
    Globe,
    GraduationCap,
    BookOpenCheck,
    MessageCircle,
    Sparkles,
    ArrowRight,
    ChevronRight,
    TrendingUp } from "lucide-react";
import { displayAmount, getCurrencyCookie, convertCents, RATES, SYMBOLS } from "@/utils/currency.jsx";
import { usePage } from "@inertiajs/react";
import { useState } from "react";

const FORMATS = [
    { value: "", label: "All formats" },
    { value: "ONLINE", label: "Online" },
    { value: "IN_PERSON", label: "In-person" },
    { value: "BOTH", label: "Online & In-person" },
];

export default function Hero(props) {
    const { tutors, total, cities, cityBreakdown, specialties, subjects, stats, filters, auth } =
        props;
    const router = usePage().props.router;

    const [query, setQuery] = useState(filters.keyword);
    const [city, setCity] = useState(filters.city);
    const [format, setFormat] = useState(filters.format);
    const [level, setLevel] = useState(filters.experience);


    return (
        <section className="relative overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 lg:px-8">
                <div className="mx-auto max-w-5xl text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
                        <Sparkles className="size-3.5" />
                        Connecting students with premium educators worldwide
                    </span>

                    <h1 className="font-display mt-6 text-4xl font-extrabold leading-tight tracking-tight text-base-content sm:text-6xl">
                        Find Premium{" "}
                        <span className="bg-gradient-to-r from-primary via-secondary to-secondary bg-clip-text text-transparent">
                            Tutors & Mentors
                        </span>
                    </h1>

                    <p className="mx-auto mt-5 max-w-xl text-base text-base-content/60 sm:text-lg">
                        Handpicked, interview-prepared educators for school subjects,
                        exam prep, and beyond. Book a free trial lesson today.
                    </p>

                    {/* Search bar */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            router.get("/", {
                                keyword: query,
                                city,
                                format,
                                experience: level,
                                perPage,
                            });
                        }}
                        className="mt-8 flex flex-col gap-3 rounded-2xl border border-base-content/10 bg-base-content/5 p-3 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:rounded-full"
                    >
                        <div className="flex flex-1 items-center gap-2 px-3">
                            <Search className="size-5 shrink-0 text-primary" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by subject, tutor, or keyword..."
                                className="w-full bg-transparent py-2.5 text-sm text-base-content placeholder:text-base-content/50 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 border-base-content/10 px-3 sm:border-l">
                            <MapPin className="size-5 shrink-0 text-primary" />
                            <select
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full cursor-pointer bg-transparent py-2.5 text-sm text-base-content/80 focus:outline-none sm:w-40"
                            >
                                <option value="" className="bg-base-200">
                                    All cities
                                </option>
                                {cities.map((c) => (
                                    <option key={c} value={c} className="bg-base-200">
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 border-base-content/10 px-3 sm:border-l">
                            {format === "ONLINE" ? (
                                <Video className="size-5 shrink-0 text-primary" />
                            ) : (
                                <Building2 className="size-5 shrink-0 text-primary" />
                            )}
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                                className="w-full cursor-pointer bg-transparent py-2.5 text-sm text-base-content/80 focus:outline-none sm:w-44"
                            >
                                {FORMATS.map((f) => (
                                    <option key={f.value} value={f.value} className="bg-base-200">
                                        {f.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary rounded-full px-6">
                            Search
                        </button>
                    </form>

                    {/* quick stat chips */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-base-content/50">
                        <span className="flex items-center gap-1.5">
                            <Users className="size-4 text-primary" />
                            <strong className="text-base-content/80">{stats.totalTutors}</strong>{" "}
                            educators
                        </span>
                        <span className="flex items-center gap-1.5">
                            <BadgeCheck className="size-4 text-success" />
                            <strong className="text-base-content/80">
                                {stats.verifiedCount}
                            </strong>{" "}
                            verified
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Globe className="size-4 text-info" />
                            <strong className="text-base-content/80">
                                {stats.citiesCount}
                            </strong>{" "}
                            cities
                        </span>
                        <span className="flex items-center gap-1.5">
                            <TrendingUp className="size-4 text-amber-400" />
                            from{" "}
                            <strong className="text-base-content/80">
                                {/* {getCurrencyCookie() === 'INR' ? '₹' : SYMBOLS[getCurrencyCookie()]}{Math.round(stats.avgRate / 100)} */}
                                {getCurrencyCookie() === 'INR' ? '₹'+Math.round(stats.avgRate / 100) : displayAmount(Math.round(stats.avgRate / 100), getCurrencyCookie()).text}
                            </strong>
                            /hr avg
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
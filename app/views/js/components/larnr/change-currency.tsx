import { ChevronDown } from 'lucide-react';

import { router, usePage } from '@inertiajs/react';
import { CURRENCIES, setCurrencyCookie, getCurrencyCookie } from '@/utils/currency';

export default function ChangeCurrency() {
    const { url } = usePage();
    console.log(url);

    return (
        <div className="flex items-center gap-2">
            <span className="block text-xs text-base-content/60 mb-0">Currency</span>
            <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost gap-1 px-2">
                    <span className="text-xs font-medium text-base-content">
                        {getCurrencyCookie() || 'INR'}
                    </span>
                    <ChevronDown className="size-3 opacity-60" />
                </div>
                <ul
                    className="dropdown-content menu mt-2 w-56 rounded-box border border-base-content/10 bg-base-200/95 p-2 shadow-2xl backdrop-blur-xl"
                >
                    {CURRENCIES.map((c) => (
                        <li key={c.code} className="px-4 py-1 text-sm">
                            <button onClick={(e) => {
                                e.preventDefault();
                                setCurrencyCookie(c.code);
                                router.visit(url);
                            }}
                            >
                                {c.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
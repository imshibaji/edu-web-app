import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

type Params = Record<string, string>;

export function useAdminQuery(route: string, initial: Params = {}) {
    const [params, setParams] = useState<Params>(() => ({
        per_page: '20',
        page: '1',
        ...initial,
    }));
    const mountedRef = useRef(false);

    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            return;
        }

        const timer = setTimeout(() => {
            router.get(route, params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 350);

        return () => clearTimeout(timer);
    }, [params, route]);

    const setFilter = (
        patch: Params | ((p: Params) => Params),
    ) => {
        setParams((p) => {
            const next = typeof patch === 'function' ? patch(p) : { ...p, ...patch };
            return { ...next, page: '1' };
        });
    };

    return { params, setParams, setFilter };
}

import { useState } from 'react';
import { router } from '@inertiajs/react';

import { useTutorFilters, type TutorFilterHandlers } from '@/hooks/use-tutor-filters';
import type { AuthProps, Tutor, TutorFilter } from '@/types';

export interface UseHomePage extends TutorFilterHandlers {
    selectedTutor: Tutor | null;
    openBook: (tutor: Tutor) => void;
    closeBook: () => void;
}

export function useHomePage(filters: TutorFilter, auth: AuthProps): UseHomePage {
    const filterHandlers = useTutorFilters(filters, '/');

    const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);

    const openBook = (tutor: Tutor) => {
        if (auth?.user) {
            setSelectedTutor(tutor);
        } else {
            router.visit('/auth/login');
        }
    };

    const closeBook = () => setSelectedTutor(null);

    return {
        ...filterHandlers,
        selectedTutor,
        openBook,
        closeBook,
    };
}

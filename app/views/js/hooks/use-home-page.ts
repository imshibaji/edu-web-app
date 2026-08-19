import { useTutorFilters, type TutorFilterHandlers } from '@/hooks/use-tutor-filters';
import type { TutorFilter } from '@/types';

export type UseHomePage = TutorFilterHandlers;

export function useHomePage(filters: TutorFilter): UseHomePage {
    return useTutorFilters(filters, '/');
}
import type { CurrencyCode } from '@/utils/currency';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'TUTOR' | 'ADMIN';
    base_currency?: string;
}

export interface AuthProps {
    user: AuthUser | null;
}

export interface NavLink {
    label: string;
    href: string;
}

export interface TutorProfile {
    name: string;
    headline: string;
    verified: boolean;
    avatar: string | null;
    rate: number;
    currency: string;
    rating: number;
    city: string | null;
    format: 'ONLINE' | 'IN_PERSON' | 'BOTH';
    level: string;
}

export interface TutorSubject {
    id: string;
    name: string;
    rate_cents: number;
}

export interface AvailableSlot {
    id: string;
    start: string;
    end: string;
}

export interface Tutor {
    id: string;
    name: string;
    headline: string;
    verified: boolean;
    avatar: string | null;
    rate: number;
    currency: string;
    rating: number;
    city: string | null;
    format: 'ONLINE' | 'IN_PERSON' | 'BOTH';
    slotsAvailable: number;
    bio: string;
    subjects: TutorSubject[];
    level: string;
}

export interface CityBreakdownItem {
    city: string;
    count: number;
}

export interface SpecialtyItem {
    name: string;
    count: number;
}

export interface SubjectItem {
    id: string;
    name: string;
}

export interface TutorStats {
    totalTutors: number;
    verifiedCount: number;
    activeNow: number;
    avgRate: number;
    citiesCount: number;
}

export interface TutorFilter {
    keyword: string;
    city: string;
    format: string;
    experience: string;
    perPage: number;
}

export interface HomeProps {
    tutors: Tutor[];
    total: number;
    cities: string[];
    cityBreakdown: CityBreakdownItem[];
    specialties: SpecialtyItem[];
    subjects: SubjectItem[];
    stats: TutorStats;
    filters: TutorFilter;
    auth: AuthProps;
}

export interface SubjectsProps {
    specialties: SpecialtyItem[];
    subjects: SubjectItem[];
    totalTutors: number;
    citiesCount: number;
    auth: AuthProps;
}

export interface Booking {
    id: string;
    tutor: string;
    subject?: string;
    status: string;
    created_at: string;
    scheduled_at: string;
    amount: number;
    currency: string;
    notes?: string;
}

export interface Profile {
    name: string;
    phone?: string;
}

export interface Stats {
    tutors: number;
    students: number;
    bookings: number;
    pending: number;
    activityToday: number;
}

export interface ActivityItem {
    id: string;
    type: string;
    description: string;
    created_at: string;
    ip_address?: string;
    actor: {
        name: string;
        role: string;
    };
}

export interface DashboardProps {
    role: string;
    auth: AuthProps;
    bookings?: Booking[];
    profile?: Profile;
    stats?: Stats;
    activities?: ActivityItem[];
}

export interface Enquiry {
    id: string;
    student: string;
    subject?: string;
    scheduled_at: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    notes?: string;
}

export interface TutorProfileData {
    full_name: string;
    headline: string;
    bio: string;
    city: string;
    format: string;
    experience_level: string;
    hourly_rate: number;
    currency: string;
    avatar_url?: string | null;
}

export interface TutorIndexProps {
    profile: TutorProfile;
    subjects: TutorSubject[];
    stats: {
        slots: number;
        open: number;
        enquiries: number;
        pending: number;
    };
    recentEnquiries: Enquiry[];
    pendingReview: boolean;
    auth: AuthProps;
}

export interface TutorAvailabilityProps {
    profile: {
        name: string;
    };
    slots: Array<{
        id: string;
        start: string;
        end: string;
        booked: boolean;
    }>;
    auth: AuthProps;
}

export interface CatalogSubject {
    id: string;
    name: string;
}

export interface TutorSubjectsProps {
    profile: {
        name: string;
        currency: string;
    };
    subjects: TutorSubject[];
    catalog: CatalogSubject[];
    errors: Record<string, string>;
    auth: AuthProps;
}

export interface TutorEnquiriesProps {
    profile: {
        name: string;
    };
    enquiries: Enquiry[];
    auth: AuthProps;
}

export interface TutorProfileProps {
    profile: TutorProfileData;
    pending?: TutorProfileData | null;
    errors: Record<string, string>;
}

export interface Review {
    id: string;
    tutorName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
    reviewed_at?: string;
    reviewer?: string;
    live: Record<string, string | number | null> | null;
    proposed: Record<string, string | number | null>;
}

export interface AdminReviewsProps {
    reviews: Review[];
    errors: Record<string, string>;
}

export interface Activity {
    id: string;
    type: string;
    description: string;
    created_at: string;
    ip_address?: string;
    actor: {
        name: string;
        role: string;
    };
}

export interface PaginationMeta {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
}

export interface AdminActivitiesProps {
    activities: Activity[];
    role: string;
    search: string;
    counts: Record<string, number>;
    pagination: PaginationMeta;
}

export interface AdminUser {
    id: string;
    email: string;
    role: 'STUDENT' | 'TUTOR' | 'ADMIN';
    name: string | null;
    is_active: boolean;
    created_at: string;
}

export interface AdminUsersProps {
    users: AdminUser[];
    role: string;
    search: string;
    counts: Record<string, number>;
    pagination: PaginationMeta;
}

export interface AdminSubject {
    id: string;
    name: string;
    tutor_count: number;
}

export interface AdminSubjectsProps {
    subjects: AdminSubject[];
    errors: Record<string, string>;
}

export interface AdminTutor {
    id: string;
    name: string;
    email: string | null;
    headline: string | null;
    city: string | null;
    rate: number;
    currency: string;
    rating: number;
    verified: boolean;
    active: boolean;
    subjects: string[];
    slots: number;
    created_at: string;
}

export interface AdminTutorsProps {
    tutors: AdminTutor[];
    search: string;
    verified: string;
    counts: Record<string, number>;
    pagination: PaginationMeta;
}

export interface AdminStudent {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    bookings: number;
    active: boolean;
    created_at: string;
}

export interface AdminStudentsProps {
    students: AdminStudent[];
    search: string;
    counts: Record<string, number>;
    pagination: PaginationMeta;
}

export interface AdminTransaction {
    id: string;
    type: string;
    status: string;
    amount: number;
    currency: string;
    platform_fee: number;
    student: string;
    tutor: string;
    subject: string | null;
    created_at: string;
}

export interface AdminPaymentsProps {
    transactions: AdminTransaction[];
    status: string;
    type: string;
    pagination: PaginationMeta;
    summary: {
        total_amount: number;
        platform_fees: number;
        base_currency: string;
        success_count: number;
        pending_count: number;
    };
}

export type CurrencyCodeType = CurrencyCode;

export interface DisplayAmountResult {
    text: string;
    note: string | null;
    native: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeName = 'larnr-day' | 'larnr';
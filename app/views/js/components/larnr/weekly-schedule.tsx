import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Info } from 'lucide-react';
import type { AvailableSlot } from '@/types';

interface WeeklyScheduleProps {
    slots: AvailableSlot[];
    selectedSlotId: string | null;
    onSelectSlot: (slotId: string) => void;
}

function parseSlotDate(value: string): Date {
    if (!value) return new Date(NaN);
    const trimmed = value.trim();
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
        return new Date(trimmed);
    }
    return new Date(trimmed.replace(' ', 'T') + 'Z');
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateRange(start: Date): string {
    const end = addDays(start, 6);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = start.toLocaleDateString(undefined, opts);
    const endStr = end.toLocaleDateString(undefined, { ...opts, year: 'numeric' });
    return `${startStr} – ${endStr}`;
}

export default function WeeklySchedule({ slots, selectedSlotId, onSelectSlot }: WeeklyScheduleProps) {
    const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

    const weekDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = addDays(weekStart, i);
            const daySlots = slots.filter((slot) => {
                const slotDate = parseSlotDate(slot.start);
                return isSameDay(slotDate, day) && !slot.booked;
            });
            days.push({ date: day, slots: daySlots });
        }
        return days;
    }, [weekStart, slots]);

    const totalWeekSlots = weekDays.reduce((sum, d) => sum + d.slots.length, 0);

    const prevWeek = () => setWeekStart((d) => addDays(d, -7));
    const nextWeek = () => setWeekStart((d) => addDays(d, 7));

    const now = new Date();

    return (
        <section className="card card-border border-base-content/10 bg-base-content/4">
            <div className="card-body gap-4">
                <h2 className="font-display text-xl font-bold text-base-content">Schedule</h2>

                {/* Info banner */}
                <div className="flex items-start gap-2 rounded-xl bg-base-content/5 p-3 text-xs text-base-content/70">
                    <Info className="size-4 mt-0.5 shrink-0 text-base-content/40" />
                    <p>Choose the time for your first lesson. The timings are displayed in your local timezone.</p>
                </div>

                {/* Week navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={prevWeek}
                            className="btn btn-ghost btn-sm btn-square"
                        >
                            <ChevronLeft className="size-5" />
                        </button>
                        <button
                            type="button"
                            onClick={nextWeek}
                            className="btn btn-ghost btn-sm btn-square"
                        >
                            <ChevronRight className="size-5" />
                        </button>
                        <span className="flex items-center gap-1.5 text-sm font-medium text-base-content">
                            {formatDateRange(weekStart)}
                            <ChevronDown className="size-4 text-base-content/50" />
                        </span>
                    </div>
                </div>

                {/* Day columns */}
                {totalWeekSlots === 0 ? (
                    <div className="py-6 text-center text-sm text-base-content/50">
                        No available slots this week. Check other weeks or message the tutor.
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-2">
                        {weekDays.map(({ date, slots: daySlots }) => {
                            const isToday = isSameDay(date, now);
                            const maxSlots = Math.max(daySlots.length, 3);
                            const barWidth = Math.min(daySlots.length * 20, 100);

                            return (
                                <div key={date.toISOString()} className="min-w-0">
                                    {/* Day header */}
                                    <div className={`text-center ${isToday ? 'font-bold text-primary' : 'text-base-content/70'}`}>
                                        <p className="text-[10px] uppercase tracking-wide">
                                            {date.toLocaleDateString(undefined, { weekday: 'short' })}
                                        </p>
                                        <p className={`text-sm ${isToday ? 'text-primary' : ''}`}>
                                            {date.getDate()}
                                        </p>
                                    </div>

                                    {/* Availability bar */}
                                    <div className="mt-1 flex justify-center">
                                        <div
                                            className="h-1 rounded-full bg-primary/40"
                                            style={{ width: `${barWidth}%`, minWidth: daySlots.length > 0 ? '8px' : '0' }}
                                        />
                                    </div>

                                    {/* Slots */}
                                    <div className="mt-2 space-y-1.5" style={{ minHeight: `${maxSlots * 28}px` }}>
                                        {daySlots.map((slot) => {
                                            const slotTime = parseSlotDate(slot.start);
                                            const isSelected = selectedSlotId === slot.id;

                                            return (
                                                <button
                                                    key={slot.id}
                                                    type="button"
                                                    onClick={() => onSelectSlot(slot.id)}
                                                    className={`block w-full rounded-lg border px-1.5 py-1 text-center text-xs font-medium transition-colors ${
                                                        isSelected
                                                            ? 'border-primary bg-primary text-white'
                                                            : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
                                                    }`}
                                                >
                                                    {formatTime(slotTime)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}

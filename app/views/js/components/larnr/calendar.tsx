import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';

function parseSlotDate(value: string): Date {
    if (!value) return new Date(NaN);
    const trimmed = value.trim();
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
        return new Date(trimmed);
    }
    return new Date(trimmed.replace(' ', 'T') + 'Z');
}

interface CalendarProps {
    value: Date;
    onChange: (date: Date) => void;
    slots: Array<{ id: string; start: string; end: string; booked?: boolean }>;
    onAddSlot?: (date: Date, start: string, end: string) => void;
    mode: 'tutor' | 'student';
    disabled?: boolean;
    minDate?: Date;
}

export default function Calendar({
    value,
    onChange,
    slots,
    onAddSlot,
    mode,
    disabled = false,
    minDate,
}: CalendarProps) {
    const [viewDate, setViewDate] = useState(value);
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

    const daysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const firstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDateKey = (date: Date) => (isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);

    const slotsByDate: Record<string, Array<{ id: string; start: string; end: string; booked?: boolean }>> = {};
    slots.forEach((slot) => {
        const startDate = parseSlotDate(slot.start);
        if (isNaN(startDate.getTime())) return;
        const key = formatDateKey(startDate);
        if (!slotsByDate[key]) slotsByDate[key] = [];
        slotsByDate[key].push(slot);
    });

    const isCurrentMonth = (day: number) => {
        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        return date.getMonth() === viewDate.getMonth();
    };

    const getSlotsForDate = (date: Date) => slotsByDate[formatDateKey(date)] || [];

    const handleDayClick = (day: number) => {
        if (!isCurrentMonth(day)) return;
        const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        if (minDate && clickedDate < minDate) return;
        if (mode === 'tutor' && onAddSlot) {
            setSelectedSlot(clickedDate);
        } else if (mode === 'student') {
            onChange(clickedDate);
        }
    };

    const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
    const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="card card-border border-base-content/10 bg-base-content/4">
            <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="btn btn-ghost btn-sm btn-circle"
                        aria-label="Previous month"
                        disabled={disabled}
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <h3 className="font-display font-semibold text-base-content">
                        {viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="btn btn-ghost btn-sm btn-circle"
                        aria-label="Next month"
                        disabled={disabled}
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-medium text-base-content/50 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d}>{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: firstDayOfMonth(viewDate) }, (_, i) => (
                        <div key={`empty-${i}`} className="h-9" />
                    ))}

                    {Array.from({ length: daysInMonth(viewDate) }, (_, i) => {
                        const day = i + 1;
                        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                        const isToday = date.getTime() === today.getTime();
                        const isPast = date < today && !isToday;
                        const isCurrentMonthDay = isCurrentMonth(day);
                        const daySlots = getSlotsForDate(date);
                        const hasOpenSlot = daySlots.some((s) => !s.booked);

                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDayClick(day)}
                                disabled={disabled || !isCurrentMonthDay || (mode === 'tutor' && isPast) || (minDate && date < minDate)}
                                className={`
                                    relative h-9 rounded-lg transition-colors ${
                                        !isCurrentMonthDay
                                            ? 'text-base-content/20'
                                            : isPast
                                            ? 'text-base-content/40'
                                            : 'text-base-content'
                                    }
                                    ${isToday ? 'ring-2 ring-primary' : ''}
                                    ${hasOpenSlot ? 'bg-primary/10' : ''}
                                    ${selectedSlot?.getTime() === date.getTime() ? 'ring-2 ring-primary bg-primary/5' : ''}
                                    hover:bg-primary/5
                                `}
                            >
                                <span className="flex items-center justify-center h-full">{day}</span>
                                {hasOpenSlot && (
                                    <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                                        mode === 'tutor' ? 'bg-primary' : 'bg-success'
                                    }`} />
                                )}
                                {daySlots.length > 0 && (
                                    <div className="absolute top-1 right-1 flex gap-0.5">
                                        {daySlots.slice(0, 3).map((s) => (
                                            <span
                                                key={s.id}
                                                className={`w-1.5 h-1.5 rounded ${
                                                    s.booked ? 'bg-error' : 'bg-success'
                                                }`}
                                            />
                                        ))}
                                        {daySlots.length > 3 && (
                                            <span className="w-3 h-1.5 text-[6px] text-center text-base-content/50">+{daySlots.length - 3}</span>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {selectedSlot && mode === 'tutor' && onAddSlot && (
                    <div className="mt-4 p-3 rounded-xl border border-primary/25 bg-primary/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-base-content">
                                    {selectedSlot.toLocaleDateString(undefined, {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </p>
                                <p className="text-xs text-base-content/60">Select time range below</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedSlot(null)}
                                className="btn btn-ghost btn-xs"
                            >
                                ×
                            </button>
                        </div>
                        <AddSlotTimePicker
                            date={selectedSlot}
                            onAdd={(start, end) => onAddSlot(selectedSlot, start, end)}
                            onCancel={() => setSelectedSlot(null)}
                        />
                    </div>
                )}

                {mode === 'student' && (
                    <div className="mt-4 space-y-2">
                        {slotsByDate[formatDateKey(value)]?.map((slot) => {
                            const start = parseSlotDate(slot.start);
                            const end = parseSlotDate(slot.end);
                            return (
                                <div
                                    key={slot.id}
                                    className={`card card-border border-base-content/10 bg-base-content/4 flex items-center justify-between p-3 ${
                                        slot.booked ? 'opacity-50' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`status ${slot.booked ? 'status-error' : 'status-success'}`} />
                                        <div>
                                            <p className="text-sm font-medium text-base-content">
                                                {start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} –{' '}
                                                {end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    {slot.booked ? (
                                        <span className="badge badge-warning badge-sm">Booked</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => onChange(start)}
                                            className="btn btn-primary btn-sm rounded-full"
                                        >
                                            Select
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

interface AddSlotTimePickerProps {
    date: Date;
    onAdd: (start: string, end: string) => void;
    onCancel: () => void;
}

function AddSlotTimePicker({ date, onAdd, onCancel }: AddSlotTimePickerProps) {
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');

    const handleAdd = () => {
        const start = new Date(date);
        const [sh, sm] = startTime.split(':').map(Number);
        start.setHours(sh, sm, 0, 0);

        const end = new Date(date);
        const [eh, em] = endTime.split(':').map(Number);
        end.setHours(eh, em, 0, 0);

        if (end <= start) {
            alert('End time must be after start time');
            return;
        }

        const toISO = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19);
        onAdd(toISO(start), toISO(end));
    };

    return (
        <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-base-content/70">
                <span>Start</span>
                <input
                    type="time"
                    className="input input-sm w-20"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                />
            </label>
            <label className="flex items-center gap-1 text-xs text-base-content/70">
                <span>End</span>
                <input
                    type="time"
                    className="input input-sm w-20"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                />
            </label>
            <button type="button" onClick={handleAdd} className="btn btn-primary btn-sm rounded-full">
                <Plus className="size-3" /> Add
            </button>
            <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">
                Cancel
            </button>
        </div>
    );
}
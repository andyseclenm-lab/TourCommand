import React, { useMemo, useEffect, useRef, useState } from 'react';
import { CheckCircle, MoreHorizontal, Circle, PieChart, Calendar } from 'lucide-react';
import { Event, EventType } from '../types';
import { useNavigate } from 'react-router-dom';

interface DashboardCalendarListProps {
    events: Event[];
}

const DashboardCalendarList: React.FC<DashboardCalendarListProps> = ({ events }) => {
    const navigate = useNavigate();
    const currentDate = new Date();
    const listRef = useRef<HTMLDivElement>(null);

    // Helper to parser date string
    const parseDateString = (dateStr: string) => {
        if (!dateStr) return new Date(); // Fallback
        if (dateStr.includes('T')) return new Date(dateStr); // ISO

        const months: Record<string, number> = {
            'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
        };

        const cleanStr = dateStr.toLowerCase().replace(/,/g, '').replace(/\./g, '');
        const parts = cleanStr.split(/[\s-]+/);

        // Attempt parse DD MMM YYYY or YYYY-MM-DD
        let day = currentDate.getDate();
        let month = currentDate.getMonth();
        let year = currentDate.getFullYear();

        if (parts[0].length === 4) { // YYYY-MM-DD
            return new Date(dateStr);
        }

        // 27 feb 2026
        if (parts.length >= 3) {
            day = parseInt(parts[0]);
            const mStr = parts[1].substring(0, 3);
            month = months[mStr] !== undefined ? months[mStr] : 0;
            year = parseInt(parts[parts.length - 1]);
        }
        // Handle Ranges like "27 Jul - 05 Ago 2026"? For now simple check
        else if (dateStr.includes('-')) {
            // If range, try parsing first part + year from end?
            // Fallback to current year if ambiguous
        }

        const d = new Date(year, month, day);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    // Filter and Sort events
    const sortedEvents = useMemo(() => {
        // Filter out tours (containers)
        const validEvents = events.filter(e => e.type !== EventType.TOUR);

        return [...validEvents].sort((a, b) => {
            return parseDateString(a.dateRange).getTime() - parseDateString(b.dateRange).getTime();
        });
    }, [events]);

    // Determine "Active" event (Next upcoming or today)
    const activeEventId = useMemo(() => {
        const now = new Date();
        // Find first event that is either today or in future
        const upcoming = sortedEvents.find(e => {
            const d = parseDateString(e.dateRange);
            // Compare dates (ignoring time)
            d.setHours(23, 59, 59, 999);
            return d >= now;
        });
        return upcoming?.id || null; // Return first found or null
    }, [sortedEvents]);

    // Scroll to active event on mount
    useEffect(() => {
        if (activeEventId && listRef.current) {
            // slight delay to ensure render
            setTimeout(() => {
                const el = document.getElementById(`event-row-${activeEventId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [activeEventId]);

    // Determine header date based on active event or first event
    const headerDate = useMemo(() => {
        let targetDate = currentDate;
        if (activeEventId) {
            const active = sortedEvents.find(e => e.id === activeEventId);
            if (active) targetDate = parseDateString(active.dateRange);
        } else if (sortedEvents.length > 0) {
            targetDate = parseDateString(sortedEvents[0].dateRange);
        }
        return targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    }, [activeEventId, sortedEvents]);


    const getStatusIcon = (event: Event, isPast: boolean, isActive: boolean) => {
        if (isActive) return <CheckCircle size={18} className="text-green-500 fill-current" />;
        if (isPast) return <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>;
        return <Circle size={14} className="text-gray-600" />;
    };

    return (
        <div className="flex flex-col h-full bg-[#1e293b]/80 rounded-3xl overflow-hidden border border-white/10 shadow-xl backdrop-blur-md">
            {/* Header */}
            <div className="bg-[#0f172a] px-5 py-4 border-b border-white/10 flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-mono">{headerDate}</h3>
            </div>

            {/* List */}
            <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {sortedEvents.map((event) => {
                    const eventDate = parseDateString(event.dateRange);
                    const isPast = eventDate < new Date(new Date().setHours(0, 0, 0, 0));
                    const isActive = event.id === activeEventId;

                    // Format Date MM/DD
                    const monthStr = (eventDate.getMonth() + 1).toString().padStart(2, '0');
                    const dayStr = eventDate.getDate().toString().padStart(2, '0');

                    return (
                        <div
                            key={event.id}
                            id={`event-row-${event.id}`}
                            onClick={() => navigate('/venue', { state: { eventData: event } })}
                            className={`
                        group relative flex items-center gap-4 px-5 py-3 cursor-pointer transition-all duration-200 border-l-[3px]
                        ${isActive ? 'bg-white/5 border-red-500' : 'hover:bg-white/5 border-transparent'}
                    `}
                        >
                            {/* Date Column */}
                            <div className={`font-mono font-bold text-xs tracking-tight w-10 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-400'}`}>
                                {monthStr}/{dayStr}
                            </div>

                            {/* Content Column */}
                            <div className="flex-1 min-w-0 flex flex-col">
                                <span className={`text-sm font-bold truncate leading-tight ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                    {event.title}
                                </span>
                                <span className="text-[11px] text-gray-500 truncate italic font-medium mt-0.5">
                                    {event.location}
                                </span>
                            </div>

                            {/* Status/Action Column */}
                            <div className="flex items-center justify-center w-6">
                                {isActive && <div className="p-1"><CheckCircle size={16} className="text-green-500 fill-current" /></div>}
                                {!isActive && isPast && <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>}
                                {!isActive && event.type === EventType.DAY_OFF && <span className="text-[10px] text-gray-600 font-mono">OFF</span>}
                                {!isActive && !isPast && event.type !== EventType.DAY_OFF && <PieChart size={14} className="text-blue-500 opacity-50" />}
                            </div>
                        </div>
                    );
                })}

                {sortedEvents.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500 gap-2">
                        <Calendar size={32} className="opacity-20" />
                        <span className="text-sm italic">No scheduled events</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardCalendarList;

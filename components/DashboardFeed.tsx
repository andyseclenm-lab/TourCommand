import React, { useMemo } from 'react';
import { Bell, AlertTriangle, AlertCircle, Clock, Plane, Bus, Train, CheckCircle2 } from 'lucide-react';
import { useTour } from '../context/TourContext';
import { useNavigate } from 'react-router-dom';
import { TransportItem, Note } from '../types';

interface AlertItem {
    id: string;
    type: 'note' | 'transport';
    title: string;
    subtitle?: string;
    date?: string; // For notes
    urgencyLevel: 'high' | 'medium'; // To style colors
    icon: React.ReactNode;
}

const DashboardFeed: React.FC = () => {
    const { notes, transportList } = useTour();
    const navigate = useNavigate();

    const alerts = useMemo(() => {
        const items: AlertItem[] = [];

        // 1. Critical/Urgent Notes
        const urgentNotes = notes.filter(n => n.urgency === 'Crítico' || n.urgency === 'Urgente');
        urgentNotes.forEach(note => {
            items.push({
                id: `note-${note.id}`,
                type: 'note',
                title: note.title,
                subtitle: note.content,
                date: note.date,
                urgencyLevel: note.urgency === 'Crítico' ? 'high' : 'medium',
                icon: note.urgency === 'Crítico' ? <AlertCircle size={18} /> : <AlertTriangle size={18} />,
            });
        });

        // 2. Delayed Transport
        const delayedTransport = transportList.filter(t => t.status === 'Delayed');
        delayedTransport.forEach(transport => {
            let Icon = Plane;
            if (transport.type === 'train') Icon = Train;
            if (transport.type === 'bus') Icon = Bus;

            items.push({
                id: `transport-${transport.id}`,
                type: 'transport',
                title: `${transport.type === 'flight' ? 'Vuelo' : transport.type === 'train' ? 'Tren' : 'Bus'} Retrasado`,
                subtitle: `${transport.provider} ${transport.number}: ${transport.origin} -> ${transport.destination}`,
                urgencyLevel: 'high', // Delayed transport is usually high urgency
                icon: <Icon size={18} />,
            });
        });

        // Sort: High urgency first
        return items.sort((a, b) => {
            if (a.urgencyLevel === 'high' && b.urgencyLevel !== 'high') return -1;
            if (a.urgencyLevel !== 'high' && b.urgencyLevel === 'high') return 1;
            return 0;
        });
    }, [notes, transportList]);

    return (
        <div className="flex flex-col h-full bg-[#1e293b]/50 rounded-3xl overflow-hidden border border-white/10 shadow-xl backdrop-blur-sm">
            {/* Header */}
            <div className="bg-[#1e293b] px-6 py-4 border-b border-white/10 flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-lg font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={18} /> AVISOS
                </h3>
                {alerts.length > 0 && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-mono animate-pulse">
                        {alerts.length}
                    </span>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {alerts.length > 0 ? alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`group flex gap-4 p-4 mb-2 rounded-xl border transition-all cursor-default
                            ${alert.urgencyLevel === 'high'
                                ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                                : 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10'
                            }`}
                    >
                        {/* Icon Column */}
                        <div className="mt-1">
                            <div className={`p-2 rounded-full transition-colors ${alert.urgencyLevel === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                                }`}>
                                {alert.icon}
                            </div>
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-sm font-bold transition-colors ${alert.urgencyLevel === 'high' ? 'text-red-200' : 'text-orange-200'
                                    }`}>
                                    {alert.title}
                                </h4>
                            </div>

                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                {alert.subtitle}
                            </p>

                            {/* Visual Indicator of Alert Type */}
                            <div className="flex gap-2 mt-2">
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${alert.type === 'transport'
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                    {alert.type === 'transport' ? 'Logística' : 'Nota'}
                                </span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4 opacity-50 pb-8">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 size={32} className="text-green-500" />
                        </div>
                        <span className="text-sm font-medium">Sin avisos urgentes</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardFeed;

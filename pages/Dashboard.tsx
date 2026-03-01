import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, Search, Plane, Bed, CheckCircle,
  MoreVertical, Plus, Calendar, ArrowRight,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTour } from '../context/TourContext';
import { Event } from '../types';

import DashboardCalendarList from '../components/DashboardCalendarList';
import DashboardFeed from '../components/DashboardFeed';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { events } = useTour();

  // Logic to find nearest active event
  const nearestEvent = useMemo(() => {
    if (events.length === 0) return null;
    // For now, just take the first one. In future, parse dates.
    return events[0];
  }, [events]);

  const handleEventClick = (event: Event) => {
    navigate('/venue', {
      state: {
        eventData: event
      }
    });
  };

  return (
    <div className="flex flex-col h-full pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-6 px-6 pb-4 border-b border-border md:bg-transparent md:backdrop-blur-none md:border-b-0 md:static">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:hidden">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                alt="User"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/50"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted">Buenas noches,</span>
              <h2 className="text-sm font-bold leading-tight text-text">Alex Morgan</h2>
            </div>
          </div>

          <div className="hidden md:block">
            <h1 className="text-2xl font-bold text-text">Panel de Control</h1>
            <p className="text-sm text-muted">Resumen de operaciones en tiempo real.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:flex-none md:w-80">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={18} className="text-muted" />
              </div>
              <input
                type="text"
                className="block w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border border-border bg-surface text-text placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm outline-none transition-all"
                placeholder="Buscar..."
              />
            </div>

            <button
              onClick={() => navigate('/create')}
              className="hidden md:flex items-center gap-2 bg-primary hover:bg-blue-600 text-text px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-lg shadow-blue-900/20"
            >
              <Plus size={18} />
              <span>Nuevo</span>
            </button>

            <button className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-border hover:bg-primary/5 text-text transition-colors">
              <Bell size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 overflow-y-auto">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full">

          {/* LEFT COLUMN: Nearest Event */}
          <div className="flex flex-col gap-6">

            {/* Section Title */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text flex items-center gap-2">
                <MapPin className="text-primary" size={20} /> Evento Más Cercano
              </h2>
              <button onClick={() => navigate('/venues')} className="text-xs text-muted hover:text-text transition-colors">
                Ver calendario completo
              </button>
            </div>

            {/* Main Event Card */}
            {nearestEvent ? (
              <article
                onClick={() => handleEventClick(nearestEvent)}
                className="group relative w-full flex-1 min-h-[400px] bg-surface rounded-3xl overflow-hidden border border-border shadow-2xl cursor-pointer hover:border-primary/50 transition-all duration-300 flex flex-col justify-end"
              >
                {/* Background Image with Gradient */}
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${nearestEvent.image}")` }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>

                {/* Top Badges (Absolute positioned) */}
                <div className="absolute top-6 left-6 flex gap-2 z-10">
                  <span className="bg-red-500 text-text px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> {nearestEvent.status}
                  </span>
                  <span className="bg-black/50 backdrop-blur-md text-text px-3 py-1 rounded-full text-xs font-bold border border-border">
                    {nearestEvent.type}
                  </span>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 p-6 md:p-8 mt-auto w-full">

                  <div className="mb-6 md:mb-8 mt-12 md:mt-0">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-text mb-2 leading-tight drop-shadow-xl">{nearestEvent.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-gray-200 text-sm md:text-base font-medium">
                      <span className="flex items-center gap-1.5"><Calendar size={18} className="text-primary" /> {nearestEvent.dateRange}</span>
                      <span className="hidden md:inline w-1 h-1 bg-gray-500 rounded-full"></span>
                      <span className="flex items-center gap-1.5"><MapPin size={18} className="text-primary" /> {nearestEvent.location}</span>
                    </div>
                  </div>

                  {/* Logistics Dashboard within Card */}
                  <div className="bg-primary/5 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-border grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                    {/* Travel Status */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-muted uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><Plane size={14} /> Viaje</span>
                        <span className="text-text">{nearestEvent.logistics?.travel || 0}%</span>
                      </div>
                      <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${nearestEvent.logistics?.travel || 0}%` }}></div>
                      </div>
                    </div>

                    {/* Hotel Status */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-muted uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><Bed size={14} /> Hotel</span>
                        <span className="text-text">{nearestEvent.logistics?.hotel || 0}%</span>
                      </div>
                      <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${nearestEvent.logistics?.hotel || 0}%` }}></div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-end">
                      <button className="w-full py-2 bg-primary hover:bg-blue-600 text-text font-bold rounded-xl transition-colors text-xs flex items-center justify-center gap-2">
                        Gestionar Evento <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ) : (
              <div className="w-full flex-1 min-h-[300px] bg-surface rounded-3xl border border-border flex flex-col items-center justify-center p-8 text-center border-dashed">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                  <Calendar size={32} className="text-muted" />
                </div>
                <h3 className="text-xl font-bold text-text mb-2">No hay eventos activos</h3>
                <p className="text-muted mb-6 max-w-sm">Empieza creando tu primer evento para gestionar la logística de la gira.</p>
                <button
                  onClick={() => navigate('/create')}
                  className="bg-primary hover:bg-blue-600 text-text px-6 py-3 rounded-xl font-bold transition-colors shadow-lg"
                >
                  Crear Evento
                </button>
              </div>
            )}
          </div>

          {/* CENTER COLUMN: Feed */}
          <div className="h-full">
            <DashboardFeed />
          </div>

          {/* RIGHT COLUMN: Calendar List */}
          <div className="h-full">
            <DashboardCalendarList events={events} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
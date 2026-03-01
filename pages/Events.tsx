import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, MapPin, ChevronRight, Music, Filter, Mic2, Tent, LayoutGrid, List, Trash2 } from 'lucide-react';
import { useTour } from '../context/TourContext';
import { Event } from '../types';

const Events: React.FC = () => {
  const navigate = useNavigate();
  const { events, deleteEvent } = useTour();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const filteredEvents = events.filter(event => {
    // Hide sub-events (tour stops) from main list
    if (event.parent_id) return false;

    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.artist && event.artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === 'all' || event.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleEventClick = (event: Event) => {
    if (event.type === 'Tour') {
      navigate('/cities', { state: { tourId: event.id, eventData: event } });
    } else {
      navigate('/venue', { state: { eventData: event } });
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'active': return 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]';
      case 'planning': return 'bg-blue-500 text-white';
      case 'upcoming': return 'bg-purple-500 text-white';
      case 'completed': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
      case 'tour': return <MapPin size={14} />;
      case 'festival': return <Tent size={14} />;
      case 'concert': return <Mic2 size={14} />;
      default: return <Music size={14} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background min-h-screen pb-24 md:pb-8 relative">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-white/5 md:static md:bg-transparent md:border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 px-6 md:pt-6">
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Eventos</h1>
            <p className="text-sm text-gray-400">Gestiona tus giras, conciertos y festivales.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={16} className="text-gray-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="block w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border border-white/5 bg-surface text-white placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Buscar evento..."
              />
            </div>
            <button
              onClick={() => navigate('/create')}
              className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-900/20 whitespace-nowrap"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nuevo Evento</span>
            </button>
          </div>
        </div>

        {/* Controls Bar: Filters & View Toggle */}
        <div className="px-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['all', 'Tour', 'Concert', 'Festival'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${filterType === type
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {type === 'all' ? 'Todos' : type}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-surface border border-white/10 p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="Vista de Lista"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="Vista de Cuadrícula"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className={viewMode === 'grid'
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "flex flex-col gap-4 max-w-5xl mx-auto"
        }>
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event)}
              className={`group bg-surface rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/20 cursor-pointer flex ${viewMode === 'list' ? 'flex-col sm:flex-row' : 'flex-col h-full'} relative`}
            >
              {/* Image Section */}
              <div
                className={`${viewMode === 'list' ? 'h-48 sm:h-auto sm:w-72 shrink-0' : 'h-48 w-full'} bg-cover bg-center relative`}
                style={{ backgroundImage: `url("${event.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3'}")` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-surface/10"></div>
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(event.status)}`}>
                    {event.status.toLowerCase() === 'active' && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>}
                    {event.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`¿Estás seguro de que quieres eliminar el evento "${event.title}" y todo su contenido?`)) {
                        deleteEvent(event.id);
                      }
                    }}
                    className="p-1.5 bg-black/60 rounded-full text-gray-300 hover:text-red-400 hover:bg-black/80 transition-colors"
                    title="Eliminar Evento"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {viewMode === 'grid' && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                        {getTypeIcon(event.type)} {event.type}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white leading-tight drop-shadow-md">{event.title}</h3>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className={`p-5 flex-1 flex flex-col gap-4 ${viewMode === 'list' ? 'justify-center' : ''}`}>

                {/* List View Title Block */}
                {viewMode === 'list' && (
                  <div className="mb-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-white/5 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 flex items-center gap-1 w-fit">
                        {getTypeIcon(event.type)} {event.type}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white leading-tight">{event.title}</h3>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Music size={14} className="text-primary" />
                    <span className="font-medium">{event.artist || 'Artista'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={14} />
                    <span>{event.dateRange || 'Fecha por definir'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin size={14} />
                    <span>{event.location || 'Ubicación pendiente'}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-primary font-bold hover:underline">Ver Detalles</span>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Calendar size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay eventos creados</p>
            <p className="text-sm cursor-pointer hover:text-white transition-colors" onClick={() => navigate('/create')}>¡Crea el primero ahora!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Events;
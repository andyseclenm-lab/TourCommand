import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic2, MapPin, Tent, User, Calendar as CalendarIcon, Building2, Globe, Plus, Trash2, Check, ArrowRight } from 'lucide-react';
import CreatableSelect from '../components/CreatableSelect';
import { useTour } from '../context/TourContext';
import { EventType, EventStatus, Event } from '../types';

// Data Sets for Autocomplete
const ARTISTS = ['The Weeknd', 'Dua Lipa', 'Coldplay', 'Rosalía', 'Travis Scott', 'Taylor Swift', 'Bad Bunny', 'Metallica'];
const CITIES = ['Madrid', 'Barcelona', 'London', 'Paris', 'Berlin', 'New York', 'Los Angeles', 'Tokyo', 'Mexico City', 'Buenos Aires'];
const COUNTRIES = ['España', 'United Kingdom', 'France', 'Germany', 'United States', 'Japan', 'Mexico', 'Argentina', 'Italy'];

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { venues, createEvent, customOptions, addCustomOption } = useTour();
  const [selectedType, setSelectedType] = useState<string>('tour');

  const artistOptions = Array.from(new Set([...ARTISTS, ...(customOptions?.filter(o => o.type === 'artist').map(o => o.value) || [])]));
  const cityOptions = Array.from(new Set([...CITIES, ...(customOptions?.filter(o => o.type === 'city').map(o => o.value) || [])]));
  const countryOptions = Array.from(new Set([...COUNTRIES, ...(customOptions?.filter(o => o.type === 'country').map(o => o.value) || [])]));

  // Extract venue names for autocomplete
  const venueOptions = venues.map(v => v.name);

  // Form Data
  const [formData, setFormData] = useState({
    projectName: '',
    artistName: '',
    startDate: '',
    endDate: '',
    venue: '', // Only for Single
    city: '',  // Only for Single
    country: '' // Only for Single
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    setErrorMsg('');
  };

  const handleSelectChange = (field: string, value: string) => {
    if (field === 'artistName' && !ARTISTS.includes(value)) addCustomOption('artist', value);
    if (field === 'city' && !CITIES.includes(value)) addCustomOption('city', value);
    if (field === 'country' && !COUNTRIES.includes(value)) addCustomOption('country', value);

    if (field === 'venue') {
      const selectedVenue = venues.find(v => v.name === value);
      if (selectedVenue) {
        setFormData(prev => ({ ...prev, venue: value, city: selectedVenue.city, country: selectedVenue.country }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  const handleCreate = async () => {
    setErrorMsg('');
    if (!formData.projectName || !formData.startDate || !formData.endDate || !formData.artistName) {
      setErrorMsg('Por favor completa los campos principales (Nombre, Artista, Fechas).');
      return;
    }

    if (selectedType === 'single' && (!formData.city || !formData.country)) {
      setErrorMsg('Por favor indica la ciudad y el país para el evento único.');
      return;
    }

    setIsLoading(true);

    try {
      const newEventBase = {
        title: formData.projectName,
        dateRange: `${formData.startDate} - ${formData.endDate}`,
        location: selectedType === 'single' ? `${formData.city}, ${formData.country}` : 'Global',
        type: selectedType === 'tour' ? EventType.TOUR : EventType.CONCERT,
        status: EventStatus.PLANNING,
        artist: formData.artistName,
        image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        logistics: { travel: 0, hotel: 0, tech: 0 }
      };

      const createdEvent = await createEvent(newEventBase);

      if (createdEvent) {
        if (selectedType === 'tour') {
          navigate('/cities', { state: { tourId: createdEvent.id, eventData: createdEvent } });
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMsg('No se pudo crear el evento. Revisa la conexión o intenta nuevamente.');
      }
    } catch (err: any) {
      console.error("Creation error:", err);
      setErrorMsg('Ocurrió un error inesperado al crear el evento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-6 z-10 shrink-0 border-b border-white/5 sticky top-0 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex w-10 h-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
          >
            <ArrowLeft className="text-white" size={20} />
          </button>
          <h1 className="text-white text-xl font-bold leading-tight tracking-tight">Crear Nuevo Evento</h1>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex h-10 items-center justify-center rounded-lg px-4 hover:bg-white/10 transition-colors"
        >
          <span className="text-gray-400 text-sm font-semibold hover:text-white transition-colors">Cancelar</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 pb-32">

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
              Configura tu Evento
            </h2>
            <p className="text-gray-400">
              Define los detalles principales para comenzar a organizar.
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            {/* 1. Tipo de Evento */}
            <div className="mb-10 space-y-4">
              <h3 className="text-lg font-bold text-white">1. Tipo de Evento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'single', label: 'Concierto Único', icon: <Mic2 size={24} className="text-white" />, img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
                  { id: 'tour', label: 'Gira', icon: <MapPin size={24} className="text-white" />, img: 'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedType(option.id)}
                    className={`group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-4 shadow-sm transition-all cursor-pointer bg-surface hover:-translate-y-1 ${selectedType === option.id ? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/10' : 'border-transparent hover:border-white/10'}`}
                  >
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-black/30">
                      <div className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundImage: `url(${option.img})` }}></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 bg-white/10 backdrop-blur-md p-2 rounded-lg">{option.icon}</div>
                    </div>
                    <div className="w-full text-left">
                      <span className={`text-sm font-bold ${selectedType === option.id ? 'text-primary' : 'text-gray-200'}`}>{option.label}</span>
                    </div>

                    {selectedType === option.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-surface animate-in zoom-in duration-200">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields Container */}
            <div className="space-y-8 bg-surface p-6 md:p-8 rounded-2xl border border-white/5">

              {/* 2. Nombre del Proyecto */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  2. Información del Proyecto
                </h3>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300" htmlFor="projectName">Nombre del Proyecto</label>
                    <input
                      id="projectName"
                      type="text"
                      value={formData.projectName}
                      onChange={handleInputChange}
                      className="block w-full rounded-xl border border-white/10 bg-[#0c0c1a] py-3.5 px-4 text-white shadow-sm placeholder:text-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder={selectedType === 'single' ? "ej: Concierto en el Bernabéu" : "ej: Gira de Verano 2024"}
                    />
                  </div>

                  {/* 3. Nombre del Artista (Autocomplete) */}
                  <CreatableSelect
                    label="Nombre del Artista"
                    value={formData.artistName}
                    onChange={(val) => handleSelectChange('artistName', val)}
                    options={artistOptions}
                    placeholder="ej: The Weeknd"
                    icon={<User className="h-5 w-5" />}
                  />

                  {/* --- Conditional Fields for Single Concert --- */}
                  {selectedType === 'single' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="md:col-span-2">
                        <CreatableSelect
                          label="Recinto / Venue"
                          value={formData.venue}
                          onChange={(val) => handleSelectChange('venue', val)}
                          options={venueOptions}
                          placeholder="ej: Estadio Santiago Bernabéu"
                          icon={<Building2 className="h-5 w-5" />}
                        />
                      </div>
                      <div>
                        <CreatableSelect
                          label="Ciudad"
                          value={formData.city}
                          onChange={(val) => handleSelectChange('city', val)}
                          options={cityOptions}
                          placeholder="ej: Madrid"
                          icon={<MapPin className="h-5 w-5" />}
                        />
                      </div>
                      <div>
                        <CreatableSelect
                          label="País"
                          value={formData.country}
                          onChange={(val) => handleSelectChange('country', val)}
                          options={countryOptions}
                          placeholder="ej: España"
                          icon={<Globe className="h-5 w-5" />}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-white/5"></div>

              {/* 3. Fechas Globales */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  3. Fechas {selectedType === 'tour' ? 'Globales de la Gira' : 'del Evento'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300" htmlFor="startDate">Fecha de Inicio</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="block w-full rounded-xl border border-white/10 bg-[#0c0c1a] py-3.5 pl-12 pr-4 text-white shadow-sm focus:ring-2 focus:ring-primary outline-none transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300" htmlFor="endDate">Fecha de Fin</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="block w-full rounded-xl border border-white/10 bg-[#0c0c1a] py-3.5 pl-12 pr-4 text-white shadow-sm focus:ring-2 focus:ring-primary outline-none transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-end pt-4 border-t border-white/5 space-y-4">
            {errorMsg && (
              <div className="w-full md:w-auto px-4 py-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm font-medium animate-in slide-in-from-bottom-2">
                {errorMsg}
              </div>
            )}
            <button
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full md:w-auto rounded-xl bg-primary px-8 py-4 text-center text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-600 focus:outline-none transition-all active:scale-[0.98] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 uppercase tracking-wide flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  CREANDO...
                </>
              ) : (
                'FINALIZAR Y CREAR'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateEvent;
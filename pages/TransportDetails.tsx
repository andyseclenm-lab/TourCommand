import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plane, MapPin, Clock, Calendar, AlertCircle, CheckCircle, 
  Share2, MoreVertical, RefreshCw, Navigation, Ticket, Luggage, User, PlaneTakeoff, PlaneLanding
} from 'lucide-react';
import { useTour } from '../context/TourContext';

const TransportDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transportList } = useTour();
  
  // Find item
  const item = transportList.find(t => t.id === id);
  
  // Simulation State
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(65); // % of journey
  const [lastUpdated, setLastUpdated] = useState('Hace 1 min');
  const [altitude, setAltitude] = useState('35,000 ft');
  const [speed, setSpeed] = useState('540 mph');

  // Simulate Live Updates
  useEffect(() => {
    const interval = setInterval(() => {
        // Randomly fluctuate speed/altitude slightly to look "live"
        setAltitude(`${Math.floor(34500 + Math.random() * 1000).toLocaleString()} ft`);
        setSpeed(`${Math.floor(535 + Math.random() * 10)} mph`);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
        setLoading(false);
        setLastUpdated('Justo ahora');
        setProgress(prev => Math.min(prev + 5, 100)); // Simulate journey progression
    }, 1500);
  };

  if (!item) {
    return (
        <div className="flex h-screen items-center justify-center flex-col gap-4">
            <p className="text-gray-400">Transporte no encontrado</p>
            <button onClick={() => navigate('/logistics')} className="text-primary hover:underline">Volver</button>
        </div>
    );
  }

  const isFlight = item.type === 'flight';

  return (
    <div className="flex flex-col h-full bg-background min-h-screen pb-24 md:pb-8 relative">
      
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between p-4 px-6 md:pt-6">
           <div className="flex items-center gap-4">
             <button 
                  onClick={() => navigate('/logistics')}
                  className="flex w-10 h-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-white/10"
              >
                  <ArrowLeft size={20} className="text-white" />
              </button>
              <div>
                  <h1 className="text-xl font-bold text-white leading-tight">
                      {isFlight ? 'Detalles de Vuelo' : 'Detalles de Viaje'}
                  </h1>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                      {isFlight ? <Plane size={12}/> : <Navigation size={12}/>} {item.provider} • {item.number}
                  </p>
              </div>
           </div>
           
           <div className="flex gap-2">
             <button 
                onClick={handleRefresh}
                className={`flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-white/5 hover:bg-white/10 text-white transition-all ${loading ? 'animate-spin' : ''}`}
             >
                <RefreshCw size={18} />
             </button>
             <button className="flex items-center justify-center w-10 h-10 rounded-full bg-surface border border-white/5 hover:bg-white/10 text-white transition-colors">
                <Share2 size={18} />
             </button>
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Live Status Card */}
            <div className="bg-surface rounded-2xl border border-white/5 overflow-hidden shadow-lg shadow-black/20">
                {/* Map Placeholder */}
                <div className="relative h-48 w-full bg-gray-900 overflow-hidden group">
                    {/* Simulated Map Background */}
                    <div className="absolute inset-0 opacity-40 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-3.7038,40.4168,4.0,0/800x400@2x?access_token=pk.eyJ1IjoidGVtcCIsImEiOiJtem1wIn0.1')] bg-cover bg-center grayscale mix-blend-luminosity"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
                    
                    {/* Live Badge */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                            {progress < 100 ? 'En Tránsito' : 'Llegado'}
                        </span>
                    </div>

                    <div className="absolute top-4 right-4 text-xs text-gray-400 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg">
                        Actualizado: {lastUpdated}
                    </div>

                    {/* Plane/Vehicle Icon Animation */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-12">
                         <div className="relative w-full h-0.5 bg-white/20 rounded-full">
                             <div className="absolute left-0 top-0 h-full bg-primary shadow-[0_0_10px_#1313ec]" style={{ width: `${progress}%` }}></div>
                             <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear" style={{ left: `${progress}%` }}>
                                 <div className="bg-primary p-2 rounded-full shadow-lg shadow-black/50 border-2 border-surface transform rotate-90 relative -top-0.5">
                                    {isFlight ? <Plane size={16} className="text-white" /> : <Navigation size={16} className="text-white" />}
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Status Info */}
                <div className="p-6">
                    <div className="flex justify-between items-end mb-6">
                        <div className="text-left">
                            <span className="text-3xl font-bold text-white block">{item.origin}</span>
                            <span className="text-sm text-gray-400 bg-white/5 px-2 py-0.5 rounded">Terminal 4</span>
                        </div>
                         <div className="text-center px-4 hidden sm:block">
                            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">{item.duration}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-white block">{item.destination}</span>
                            <span className="text-sm text-gray-400 bg-white/5 px-2 py-0.5 rounded">Terminal 7</span>
                        </div>
                    </div>

                    {/* Flight Metrics */}
                    <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-6">
                        <div className="text-center border-r border-white/5">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Altitud</p>
                            <p className="text-lg font-mono text-white">{altitude}</p>
                        </div>
                        <div className="text-center border-r border-white/5">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Velocidad</p>
                            <p className="text-lg font-mono text-white">{speed}</p>
                        </div>
                         <div className="text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Est. Llegada</p>
                            <p className="text-lg font-mono text-green-400">{item.arrivalTime}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Details Card */}
                <div className="bg-surface rounded-2xl border border-white/5 p-6 space-y-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Ticket size={20} className="text-primary" /> Información de Reserva
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                            <span className="text-sm text-gray-400">Referencia (PNR)</span>
                            <span className="font-mono font-bold text-white text-lg tracking-wider">XJ9-22K</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-[#0c0c1a] border border-white/5">
                                <span className="text-xs text-gray-500 uppercase block mb-1">Asiento</span>
                                <span className="font-bold text-white">4A</span>
                            </div>
                            <div className="p-3 rounded-xl bg-[#0c0c1a] border border-white/5">
                                <span className="text-xs text-gray-500 uppercase block mb-1">Clase</span>
                                <span className="font-bold text-white">Business</span>
                            </div>
                            <div className="p-3 rounded-xl bg-[#0c0c1a] border border-white/5">
                                <span className="text-xs text-gray-500 uppercase block mb-1">Puerta (Gate)</span>
                                <span className="font-bold text-white text-lg text-primary">B22</span>
                            </div>
                             <div className="p-3 rounded-xl bg-[#0c0c1a] border border-white/5">
                                <span className="text-xs text-gray-500 uppercase block mb-1">Equipaje</span>
                                <span className="font-bold text-white flex items-center gap-1"><Luggage size={14}/> 2 Pcs</span>
                            </div>
                        </div>
                        
                        <div className="pt-2">
                             <p className="text-xs text-gray-500 mb-2">Pasajeros asignados:</p>
                             <div className="flex items-center -space-x-2">
                                <img className="w-8 h-8 rounded-full border-2 border-surface" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" alt=""/>
                                <img className="w-8 h-8 rounded-full border-2 border-surface" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" alt=""/>
                                <div className="w-8 h-8 rounded-full border-2 border-surface bg-gray-700 flex items-center justify-center text-xs font-bold">+3</div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Timeline Card */}
                <div className="bg-surface rounded-2xl border border-white/5 p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                        <Clock size={20} className="text-primary" /> Cronograma
                    </h3>
                    
                    <div className="relative pl-4 space-y-8 border-l border-white/10 ml-2">
                        {/* Event 1 */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-gray-600 border-2 border-surface"></div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-400">Check-In</span>
                                <span className="text-xs text-gray-500">08:00 AM • Mostrador 42-45</span>
                            </div>
                        </div>

                         {/* Event 2 */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-green-500 border-2 border-surface"></div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                    Salida <CheckCircle size={12} className="text-green-500"/>
                                </span>
                                <span className="text-xs text-gray-400">{item.departureTime} • {item.origin}</span>
                            </div>
                        </div>

                        {/* Event 3 - Active */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-surface shadow-[0_0_10px_#1313ec]"></div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-primary">En Vuelo</span>
                                <span className="text-xs text-gray-300">Tiempo restante: 2h 15m</span>
                            </div>
                        </div>

                        {/* Event 4 */}
                        <div className="relative">
                             <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-background border-2 border-gray-600"></div>
                            <div className="flex flex-col opacity-50">
                                <span className="text-sm font-bold text-white">Aterrizaje</span>
                                <span className="text-xs text-gray-400">{item.arrivalTime} • {item.destination}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            
            <div className="flex justify-center pt-4">
                <button className="text-sm text-red-400 hover:text-red-300 font-bold flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-500/10 transition-colors">
                    Reportar Incidencia
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default TransportDetails;
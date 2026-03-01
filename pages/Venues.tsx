import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, MapPin, Users, Building2, MoreVertical, X, Save, Globe, Phone, Mail, FileText, Upload, Trash2 } from 'lucide-react';
import { useTour } from '../context/TourContext';
import { Venue } from '../types';
import CreatableSelect from '../components/CreatableSelect';

// Mock Data Sets for Autocomplete
const CITIES = ['Madrid', 'Barcelona', 'London', 'Paris', 'Berlin', 'New York', 'Los Angeles', 'Tokyo', 'Mexico City', 'Buenos Aires'];
const COUNTRIES = ['España', 'United Kingdom', 'France', 'Germany', 'United States', 'Japan', 'Mexico', 'Argentina', 'Italy'];

const Venues: React.FC = () => {
  const navigate = useNavigate();
  const { venues, addVenue } = useTour();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Venue>>({
    name: '',
    city: '',
    country: '',
    capacity: '',
    address: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    image: '',
    technicalRiderUrl: ''
  });

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // In a real app, you would upload to a server/storage bucket here.
        // For this demo, we simulate it by storing the filename.
        setFormData({ ...formData, technicalRiderUrl: file.name });
    }
  };

  const clearFile = () => {
      setFormData({ ...formData, technicalRiderUrl: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveVenue = (e: React.FormEvent) => {
    e.preventDefault();
    const newVenue: Venue = {
      id: Date.now().toString(),
      name: formData.name || 'Nuevo Recinto',
      city: formData.city || 'Ciudad',
      country: formData.country || 'País',
      capacity: formData.capacity || 'N/A',
      address: formData.address,
      contactName: formData.contactName || '',
      contactEmail: formData.contactEmail || '',
      contactPhone: formData.contactPhone || '',
      technicalRiderUrl: formData.technicalRiderUrl,
      image: formData.image || 'https://images.unsplash.com/photo-1514306191717-452ec28c7f91?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    };
    addVenue(newVenue);
    setIsModalOpen(false);
    setFormData({ name: '', city: '', country: '', capacity: '', address: '', contactName: '', contactEmail: '', contactPhone: '', image: '', technicalRiderUrl: '' });
  };

  const filteredVenues = venues.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background min-h-screen pb-24 md:pb-8 relative">
      
      {/* Create Venue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-surface border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
             
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                   <Building2 size={20} />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-white">Añadir Recinto</h2>
                   <p className="text-xs text-gray-400">Registra un nuevo espacio en el directorio.</p>
                </div>
             </div>

             <form onSubmit={handleSaveVenue} className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre del Recinto</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary placeholder-gray-600" placeholder="ej: Wizink Center" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <CreatableSelect 
                        label="Ciudad"
                        value={formData.city || ''}
                        onChange={(val) => setFormData({...formData, city: val})}
                        options={CITIES}
                        placeholder="Madrid"
                        icon={<MapPin size={16} />}
                        required
                     />
                  </div>
                  <div>
                     <CreatableSelect 
                        label="País"
                        value={formData.country || ''}
                        onChange={(val) => setFormData({...formData, country: val})}
                        options={COUNTRIES}
                        placeholder="España"
                        icon={<Globe size={16} />}
                        required
                     />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dirección</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary placeholder-gray-600" placeholder="Calle, Número, CP" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Capacidad</label>
                      <input type="text" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary placeholder-gray-600" placeholder="15,000" />
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contacto (Nombre)</label>
                       <input type="text" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary placeholder-gray-600" />
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                     <input type="email" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary placeholder-gray-600" />
                  </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                     <input type="tel" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary placeholder-gray-600" />
                  </div>
               </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rider Técnico (PDF)</label>
                  
                  <input 
                    type="file" 
                    accept=".pdf" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />

                  {!formData.technicalRiderUrl ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border border-dashed border-white/20 bg-[#0c0c1a] hover:bg-white/5 rounded-xl px-4 py-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 group"
                      >
                         <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload size={18} className="text-gray-400 group-hover:text-primary" />
                         </div>
                         <p className="text-sm text-gray-400">Haz clic para subir el Rider Técnico</p>
                         <p className="text-xs text-gray-600">Formato PDF (Máx. 10MB)</p>
                      </div>
                  ) : (
                      <div className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                                  <FileText size={16} />
                              </div>
                              <span className="text-sm text-white truncate">{formData.technicalRiderUrl}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={clearFile}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                          >
                              <Trash2 size={16} />
                          </button>
                      </div>
                  )}
               </div>

               <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mt-4">
                  <Save size={18} /> Guardar Recinto
               </button>
             </form>
           </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-white/5 md:static md:bg-transparent md:border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 px-6 md:pt-6">
           <div className="flex items-center gap-4">
             <button 
                  onClick={() => navigate('/dashboard')}
                  className="flex w-10 h-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-white/10 md:hidden"
              >
                  <ArrowLeft size={20} />
              </button>
              <div>
                  <h1 className="text-2xl font-bold text-white leading-tight">Directorio de Recintos</h1>
                  <p className="text-sm text-gray-400">Gestiona y consulta información técnica de los venues.</p>
              </div>
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
                  placeholder="Buscar recinto o ciudad..." 
                />
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-900/20 whitespace-nowrap"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Añadir</span>
              </button>
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.length > 0 ? (
               filteredVenues.map((venue) => (
                  <div 
                     key={venue.id}
                     onClick={() => navigate(`/venues/${venue.id}`)}
                     className="group bg-surface rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/20 cursor-pointer flex flex-col h-full"
                  >
                     <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url("${venue.image}")` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                           <h3 className="text-xl font-bold text-white leading-tight">{venue.name}</h3>
                           <p className="text-sm text-gray-300 flex items-center gap-1">
                              <MapPin size={12} className="text-primary" /> {venue.city}, {venue.country}
                           </p>
                        </div>
                     </div>
                     <div className="p-5 flex-1 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                           <div className="bg-[#0c0c1a] p-2 rounded-lg border border-white/5">
                              <span className="block text-[10px] text-gray-500 font-bold uppercase">Capacidad</span>
                              <span className="text-white font-semibold flex items-center gap-1"><Users size={12} /> {venue.capacity}</span>
                           </div>
                           <div className="bg-[#0c0c1a] p-2 rounded-lg border border-white/5">
                              <span className="block text-[10px] text-gray-500 font-bold uppercase">Rider</span>
                              <span className="text-primary font-semibold flex items-center gap-1"><FileText size={12} /> {venue.technicalRiderUrl ? 'Disponible' : 'N/A'}</span>
                           </div>
                        </div>
                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                           <span className="flex items-center gap-1"><Users size={12} /> Contacto: {venue.contactName}</span>
                           <ArrowLeft size={16} className="rotate-180 text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                     </div>
                  </div>
               ))
            ) : (
               <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                  <Building2 size={48} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium">No se encontraron recintos</p>
               </div>
            )}
         </div>
      </main>
    </div>
  );
};

export default Venues;
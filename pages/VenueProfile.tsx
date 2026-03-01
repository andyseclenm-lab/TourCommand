import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTour } from '../context/TourContext';
import { Venue } from '../types';
import { ArrowLeft, MapPin, Users, Phone, Mail, FileText, Globe, Pencil, Trash2, Save, X, Building2, Download, Upload } from 'lucide-react';
import CreatableSelect from '../components/CreatableSelect';

// Mock Data Sets
const CITIES = ['Madrid', 'Barcelona', 'London', 'Paris', 'Berlin', 'New York', 'Los Angeles'];
const COUNTRIES = ['España', 'United Kingdom', 'France', 'Germany', 'United States'];

const VenueProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { venues, updateVenue, deleteVenue } = useTour();
  
  const [venue, setVenue] = useState<Venue | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Venue>>({});

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
     const found = venues.find(v => v.id === id);
     if (found) {
        setVenue(found);
        setFormData(found);
     } else {
        // Redirect if not found
        // navigate('/venues'); 
     }
  }, [id, venues, navigate]);

  const handleDelete = () => {
     if(confirm("¿Estás seguro de que quieres eliminar este recinto?")) {
        deleteVenue(id!);
        navigate('/venues');
     }
  };

  const handleUpdate = (e: React.FormEvent) => {
     e.preventDefault();
     if(venue) {
        updateVenue({ ...venue, ...formData } as Venue);
        setIsEditModalOpen(false);
     }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setFormData({ ...formData, technicalRiderUrl: file.name });
    }
  };

  const clearFile = () => {
      setFormData({ ...formData, technicalRiderUrl: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!venue) return <div className="p-8 text-center text-gray-500">Cargando recinto...</div>;

  return (
    <div className="flex flex-col h-full bg-background min-h-screen pb-24 md:pb-8 relative">
       
       {/* Edit Modal */}
       {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-surface border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
             <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
             <h2 className="text-xl font-bold text-white mb-6">Editar Recinto</h2>
             
             <form onSubmit={handleUpdate} className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <CreatableSelect 
                        label="Ciudad"
                        value={formData.city || ''}
                        onChange={(val) => setFormData({...formData, city: val})}
                        options={CITIES}
                        placeholder="Ciudad"
                        icon={<MapPin size={16} />}
                     />
                  </div>
                  <div>
                     <CreatableSelect 
                        label="País"
                        value={formData.country || ''}
                        onChange={(val) => setFormData({...formData, country: val})}
                        options={COUNTRIES}
                        placeholder="País"
                        icon={<Globe size={16} />}
                     />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dirección</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Capacidad</label>
                      <input type="text" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contacto (Nombre)</label>
                       <input type="text" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                     <input type="email" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                  </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                     <input type="tel" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
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
                         <p className="text-sm text-gray-400">Haz clic para subir nuevo Rider</p>
                         <p className="text-xs text-gray-600">Formato PDF</p>
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
                  <Save size={18} /> Guardar Cambios
               </button>
             </form>
           </div>
        </div>
       )}

       {/* Banner Image */}
       <div className="relative h-64 md:h-80 w-full bg-gray-900">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${venue.image}")` }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
          
          {/* Header Actions */}
          <div className="absolute top-6 left-6 z-10">
             <button onClick={() => navigate('/venues')} className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/10 transition-colors border border-white/10">
                <ArrowLeft size={20} />
             </button>
          </div>
          
          <div className="absolute top-6 right-6 z-10 flex gap-2">
             <button onClick={() => setIsEditModalOpen(true)} className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold text-sm hover:bg-white/10 transition-colors border border-white/10 flex items-center gap-2">
                <Pencil size={16} /> Editar
             </button>
             <button onClick={handleDelete} className="bg-red-500/80 backdrop-blur-md px-3 py-2 rounded-xl text-white hover:bg-red-600 transition-colors border border-red-500/20">
                <Trash2 size={18} />
             </button>
          </div>

          <div className="absolute bottom-6 left-6 md:left-10 max-w-4xl">
             <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-2 drop-shadow-lg">{venue.name}</h1>
             <div className="flex flex-wrap items-center gap-4 text-gray-200">
                <span className="flex items-center gap-1.5"><MapPin size={18} className="text-primary" /> {venue.city}, {venue.country}</span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                <span className="flex items-center gap-1.5"><Users size={18} className="text-primary" /> {venue.capacity} Pax</span>
             </div>
          </div>
       </div>

       <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             
             {/* Left Column: Info & Map */}
             <div className="space-y-6">
                <div className="bg-surface rounded-2xl border border-white/5 p-6 shadow-lg shadow-black/20">
                   <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Building2 size={18} className="text-primary" /> Detalles
                   </h3>
                   <div className="space-y-4 text-sm">
                      <div>
                         <span className="block text-gray-500 font-bold text-xs uppercase mb-1">Dirección</span>
                         <p className="text-white">{venue.address || 'No especificada'}</p>
                      </div>
                      <div className="h-px bg-white/5"></div>
                      <div>
                         <span className="block text-gray-500 font-bold text-xs uppercase mb-1">Ciudad / País</span>
                         <p className="text-white">{venue.city}, {venue.country}</p>
                      </div>
                      <div className="h-px bg-white/5"></div>
                      <div>
                         <span className="block text-gray-500 font-bold text-xs uppercase mb-1">Capacidad Total</span>
                         <p className="text-white">{venue.capacity}</p>
                      </div>
                   </div>
                </div>

                <div className="bg-surface rounded-2xl border border-white/5 p-6 shadow-lg shadow-black/20">
                   <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Users size={18} className="text-primary" /> Contacto Principal
                   </h3>
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-300">
                         <Users size={24} />
                      </div>
                      <div>
                         <p className="font-bold text-white">{venue.contactName || 'Sin asignar'}</p>
                         <p className="text-xs text-gray-500">Venue Manager / Booking</p>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <a href={`mailto:${venue.contactEmail}`} className="flex items-center gap-3 p-3 bg-[#0c0c1a] rounded-xl border border-white/5 hover:border-primary/50 transition-colors group">
                         <Mail size={16} className="text-gray-400 group-hover:text-white" />
                         <span className="text-sm text-gray-300 group-hover:text-white truncate">{venue.contactEmail || 'No email'}</span>
                      </a>
                      <a href={`tel:${venue.contactPhone}`} className="flex items-center gap-3 p-3 bg-[#0c0c1a] rounded-xl border border-white/5 hover:border-primary/50 transition-colors group">
                         <Phone size={16} className="text-gray-400 group-hover:text-white" />
                         <span className="text-sm text-gray-300 group-hover:text-white">{venue.contactPhone || 'No teléfono'}</span>
                      </a>
                   </div>
                </div>
             </div>

             {/* Right Column: Technical & Files */}
             <div className="md:col-span-2 space-y-6">
                <div className="bg-surface rounded-2xl border border-white/5 p-6 shadow-lg shadow-black/20">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                         <FileText size={18} className="text-primary" /> Documentación Técnica
                      </h3>
                      {venue.technicalRiderUrl && (
                         <button className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors">
                            Actualizar
                         </button>
                      )}
                   </div>

                   {venue.technicalRiderUrl ? (
                      <div className="flex items-center justify-between p-4 bg-[#0c0c1a] rounded-xl border border-white/5 hover:border-primary/50 transition-all group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center">
                               <FileText size={20} />
                            </div>
                            <div>
                               <h4 className="font-bold text-white">Rider Técnico del Recinto</h4>
                               <p className="text-xs text-gray-400">{venue.technicalRiderUrl}</p>
                            </div>
                         </div>
                         <button className="p-2 bg-white/5 rounded-lg text-gray-400 group-hover:text-white hover:bg-white/10 transition-colors">
                            <Download size={20} />
                         </button>
                      </div>
                   ) : (
                      <div className="text-center py-10 bg-[#0c0c1a] rounded-xl border border-white/5 border-dashed">
                         <FileText size={32} className="mx-auto text-gray-600 mb-3" />
                         <p className="text-gray-500 text-sm">No hay rider técnico adjunto.</p>
                         <button onClick={() => setIsEditModalOpen(true)} className="mt-2 text-primary text-xs font-bold hover:underline">Añadir ahora</button>
                      </div>
                   )}
                </div>

                <div className="bg-surface rounded-2xl border border-white/5 p-6 shadow-lg shadow-black/20">
                   <h3 className="text-lg font-bold text-white mb-4">Notas Adicionales</h3>
                   <div className="bg-[#0c0c1a] rounded-xl p-4 border border-white/5 min-h-[100px] text-gray-300 text-sm">
                      {venue.notes || "No hay notas adicionales para este recinto."}
                   </div>
                </div>
             </div>

          </div>
       </main>
    </div>
  );
};

export default VenueProfile;
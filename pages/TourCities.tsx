import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar as CalendarIcon, CheckCircle, ChevronRight, Search, Globe, Music, LayoutGrid, List, ChevronLeft, Plus, X, Save, Building2, Users, Check, Pencil, Trash2, Mail, Phone, Briefcase } from 'lucide-react';
import CreatableSelect from '../components/CreatableSelect';
import EditEventModal from '../components/EditEventModal';
import ShareTourModal from '../components/ShareTourModal';
import { useTour } from '../context/TourContext';
import { Contact, Event, EventType, EventStatus } from '../types';

// Mock Data Sets for Autocomplete
const CITIES_OPT = ['Madrid', 'Barcelona', 'London', 'Paris', 'Berlin', 'New York', 'Los Angeles', 'Tokyo', 'Mexico City', 'Buenos Aires'];
const COUNTRIES_OPT = ['España', 'United Kingdom', 'France', 'Germany', 'United States', 'Japan', 'Mexico', 'Argentina', 'Italy'];
const VENUES_OPT = ['Wizink Center', 'O2 Arena', 'Accor Arena', 'Madison Square Garden', 'Mercedes-Benz Arena', 'San Siro'];
const ROLES = ['Stage Manager', 'Sound Engineer', 'Lighting Designer', 'Tour Manager', 'Production Manager', 'Backliner', 'Driver', 'Catering', 'Rigger'];

// Helper to parser date string for calendar matching
const monthMap: Record<string, number> = {
    'ene': 0, 'enero': 0, 'jan': 0,
    'feb': 1, 'febrero': 1,
    'mar': 2, 'marzo': 2,
    'abr': 3, 'abril': 3, 'apr': 3,
    'may': 4, 'mayo': 4,
    'jun': 5, 'junio': 5,
    'jul': 6, 'julio': 6,
    'ago': 7, 'agosto': 7, 'aug': 7,
    'sep': 8, 'septiembre': 8, 'set': 8,
    'oct': 9, 'octubre': 9,
    'nov': 10, 'noviembre': 10,
    'dic': 11, 'diciembre': 11, 'dec': 11
};

const parseDateString = (dateStr: string) => {
    if (!dateStr) return { day: -1, month: -1, year: -1 };
    // Expected format: "27 feb 2026" or "2026-02-27"
    const cleanStr = dateStr.toLowerCase().replace(/,/g, '').replace(/\./g, '').trim();
    const parts = cleanStr.split(/[\s-]+/);

    let day = -1, month = -1, year = -1;

    if (parts.length >= 3) {
        // Case 1: YYYY-MM-DD (ISO-like) - checks if first part is year (4 digits) and second is numeric
        if (parts[0].length === 4 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
            year = Number(parts[0]);
            month = Number(parts[1]) - 1;
            day = Number(parts[2]);
        }
        // Case 2: DD MMM YYYY (e.g. 27 feb 2026) - checks if last part is year
        else if ((parts[2].length === 4 && !isNaN(Number(parts[2]))) || (parts.length > 2 && parts[parts.length - 1].length === 4)) {

            // Handle cases like "5 mar 2026"
            day = Number(parts[0]);
            year = Number(parts[parts.length - 1]);

            // Find the month part
            const monthPart = parts.find(p => isNaN(Number(p)) && p.length >= 3);
            if (monthPart) {
                // Try strict match first, then startsWith
                let found = monthMap[monthPart];
                if (found === undefined) {
                    const key = Object.keys(monthMap).find(k => monthPart.startsWith(k));
                    if (key) found = monthMap[key];
                }
                if (found !== undefined) month = found;
            }
        }
    }
    return { day, month, year };
};

const TourCities: React.FC = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const tourId = state?.tourId;

    const { events, createEvent, updateEvent, deleteEvent, contacts, tourCrew, addTourCrew, updateTourCrew, removeTourCrew, venues, customOptions, addCustomOption, getUserRole } = useTour();

    const tourData = events.find(e => e.id === tourId) || (state?.eventData as Event | undefined);

    const userRole = getUserRole(tourId || '');
    const canEdit = userRole === 'admin' || userRole === 'editor';
    const canDelete = userRole === 'admin';
    const canShare = userRole === 'admin';

    const cityOptions = Array.from(new Set([...CITIES_OPT, ...(customOptions?.filter(o => o.type === 'city').map(o => o.value) || [])]));
    const countryOptions = Array.from(new Set([...COUNTRIES_OPT, ...(customOptions?.filter(o => o.type === 'country').map(o => o.value) || [])]));

    // Combine hardcoded mock venues with actual database venues
    const availableVenues = Array.from(new Set([
        ...VENUES_OPT,
        ...venues.map(v => v.name)
    ])).sort();

    React.useEffect(() => {
        if (!tourId) {
            navigate('/events');
        }
    }, [tourId, navigate]);

    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [mobileTab, setMobileTab] = useState<'list' | 'calendar'>('list');

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Share Modal State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // City Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCity, setNewCity] = useState<{
        city: string;
        country: string;
        venue: string;
        date: string;
        isDayOff: boolean;
    }>({ city: '', country: '', venue: '', date: '', isDayOff: false });

    // Edit Tour Modal State
    const [isEditTourModalOpen, setIsEditTourModalOpen] = useState(false);

    // Crew Management Modal State
    const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
    const [crewSearch, setCrewSearch] = useState('');
    const [crewModalView, setCrewModalView] = useState<'list' | 'add' | 'edit' | 'group'>('list');
    const [editingCrewMember, setEditingCrewMember] = useState<Partial<Contact>>({});
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');

    // Edit City Modal State
    const [isEditCityModalOpen, setIsEditCityModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    // Filter events
    const filteredEvents = events.filter(e =>
        e.parent_id === tourId &&
        (e.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort events by date
    const sortedEvents = [...filteredEvents].sort((a, b) => {
        const dateA = parseDateString(a.dateRange);
        const dateB = parseDateString(b.dateRange);

        if (dateA.year !== dateB.year) return dateA.year - dateB.year;
        if (dateA.month !== dateB.month) return dateA.month - dateB.month;
        return dateA.day - dateB.day;
    });

    // Filter tour crew
    const filteredTourCrew = tourCrew.filter(c =>
        // Show if explicitly assigned to this tour, OR if it's a legacy global crew (no tourIds)
        ((c.tourIds && c.tourIds.includes(tourId)) || (!c.tourIds?.length && c.isTourCrew)) &&
        (c.name.toLowerCase().includes(crewSearch.toLowerCase()) ||
            c.role.toLowerCase().includes(crewSearch.toLowerCase()))
    );

    const availableGlobalContacts = contacts.filter(c =>
        !tourCrew.some(tc => tc.id === c.id) &&
        (c.name.toLowerCase().includes(crewSearch.toLowerCase()) || c.role.toLowerCase().includes(crewSearch.toLowerCase()))
    );

    const handleCitySelect = (event: Event) => {
        navigate('/venue', {
            state: {
                eventData: event,
                tourData: tourData
            }
        });
    };

    const handleAddCity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCity.city || !newCity.date) return;
        if (!newCity.isDayOff && !newCity.venue) {
            alert("Por favor selecciona un Venue o marca 'Día Libre'.");
            return;
        }

        // Save new user inputs
        if (newCity.city && !CITIES_OPT.includes(newCity.city)) addCustomOption('city', newCity.city);
        if (newCity.country && !COUNTRIES_OPT.includes(newCity.country)) addCustomOption('country', newCity.country);

        // Parse date string (YYYY-MM-DD) manually to avoid UTC conversion issues
        const [year, month, day] = newCity.date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day); // Month is 0-indexed

        const formattedDate = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

        // Create new Event via Context
        const newEvent: Omit<Event, 'id'> = {
            title: newCity.isDayOff ? 'DÍA LIBRE' : (newCity.venue || `Concierto en ${newCity.city}`),
            location: `${newCity.city}, ${newCity.country}`,
            dateRange: formattedDate,
            type: newCity.isDayOff ? EventType.DAY_OFF : EventType.CONCERT,
            status: EventStatus.PLANNING,
            image: newCity.isDayOff
                ? 'https://images.unsplash.com/photo-1483004406488-872f2d483d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                : (tourData?.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'),
            artist: tourData?.artist || 'Artista Principal',
            logistics: { travel: 0, hotel: 0, tech: 0 },
            parent_id: tourId,
            readiness: 0
        };

        await createEvent(newEvent);
        setIsModalOpen(false);
        setNewCity({ city: '', country: '', venue: '', date: '', isDayOff: false });
    };

    // ... (Crew Logic preserved) ...

    // --- Crew Logic (Preserved) ---
    const handleEditCrew = (member: Contact) => {
        setEditingCrewMember(member);
        setCrewModalView('edit');
    };

    const handleDeleteCrew = (id: string) => {
        if (confirm('¿Eliminar a este miembro de la gira?')) removeTourCrew(id, tourId);
    };

    const handleEditCity = (e: React.MouseEvent, event: Event) => {
        e.stopPropagation();
        setEditingEvent(event);
        setIsEditCityModalOpen(true);
    };

    const handleDeleteCity = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('¿Estás seguro de que quieres eliminar esta fecha?')) {
            deleteEvent(id);
        }
    };

    const handleSaveCityEdit = async (updatedEvent: Partial<Event>) => {
        if (editingEvent) {
            await updateEvent({ ...editingEvent, ...updatedEvent });
            setIsEditCityModalOpen(false);
            setEditingEvent(null);
        }
    };

    const handleSaveCrewMember = (e: React.FormEvent) => {
        e.preventDefault();
        const memberToSave = {
            ...editingCrewMember,
            id: editingCrewMember.id || Date.now().toString(),
            avatar: editingCrewMember.avatar || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000) + 1500000000}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80`
        } as Contact;

        if (crewModalView === 'edit') updateTourCrew(memberToSave);
        else addTourCrew(memberToSave, tourId);

        setCrewModalView('list');
        setEditingCrewMember({});
    };

    const handleAddFromGlobal = (contact: Contact) => {
        addTourCrew(contact, tourId);
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupName || selectedContactIds.length === 0) return;

        // Iterate and update
        for (const id of selectedContactIds) {
            const contact = contacts.find(c => c.id === id);
            if (contact) {
                const updatedContact = { ...contact, team: groupName };
                // 1. Update details (Team name)
                await updateTourCrew(updatedContact);
                // 2. Ensure in Tour (Scoping)
                await addTourCrew(updatedContact, tourId);
            }
        }

        setCrewModalView('list');
        setSelectedContactIds([]);
        setGroupName('');
    };

    const toggleContactSelection = (id: string) => {
        setSelectedContactIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    // --- Calendar Logic ---
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let firstDayOfWeek = new Date(year, month, 1).getDay() - 1;
        if (firstDayOfWeek === -1) firstDayOfWeek = 6;
        return { daysInMonth, firstDayOfWeek };
    };

    const changeMonth = (increment: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentMonth(newDate);
    };



    const isEventDate = (day: number) => {
        const targetYear = currentMonth.getFullYear();
        const targetMonth = currentMonth.getMonth(); // 0-indexed

        return events.find(e => {
            if (e.parent_id !== tourId) return false;

            const { day: eDay, month: eMonth, year: eYear } = parseDateString(e.dateRange);
            // Strict match
            return eDay === day && eMonth === targetMonth && eYear === targetYear;
        });
    };

    const { daysInMonth, firstDayOfWeek } = getDaysInMonth(currentMonth);
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className="flex flex-col h-full bg-background min-h-screen relative">

            {/* --- ADD CITY MODAL --- */}
            {tourData && (
                <EditEventModal
                    isOpen={isEditTourModalOpen}
                    onClose={() => setIsEditTourModalOpen(false)}
                    onSave={updateEvent}
                    event={tourData}
                    title="Modificar Gira"
                />
            )}

            {/* --- EDIT CITY MODAL --- */}
            {editingEvent && (
                <EditEventModal
                    isOpen={isEditCityModalOpen}
                    onClose={() => { setIsEditCityModalOpen(false); setEditingEvent(null); }}
                    onSave={handleSaveCityEdit}
                    event={editingEvent}
                    title="Editar Fecha"
                />
            )}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-surface border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in zoom-in duration-200">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Añadir Fecha</h2>
                                <p className="text-xs text-gray-400">Agrega una nueva parada a la gira.</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddCity} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <CreatableSelect
                                        label="Ciudad"
                                        value={newCity.city}
                                        onChange={(val) => setNewCity({ ...newCity, city: val })}
                                        options={cityOptions}
                                        placeholder="Ciudad"
                                        icon={<MapPin size={16} />}
                                        required
                                    />
                                </div>
                                <div>
                                    <CreatableSelect
                                        label="País"
                                        value={newCity.country}
                                        onChange={(val) => setNewCity({ ...newCity, country: val })}
                                        options={countryOptions}
                                        placeholder="País"
                                        icon={<Globe size={16} />}
                                    />
                                </div>
                            </div>



                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    id="isDayOff"
                                    checked={newCity.isDayOff}
                                    onChange={e => setNewCity({ ...newCity, isDayOff: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-600 bg-[#0c0c1a] text-primary focus:ring-offset-0 focus:ring-primary"
                                />
                                <label htmlFor="isDayOff" className="text-sm text-gray-300 select-none cursor-pointer">Es día libre (Day Off)</label>
                            </div>

                            {!newCity.isDayOff && (
                                <div>
                                    <CreatableSelect
                                        label="Recinto / Venue"
                                        value={newCity.venue}
                                        onChange={(val) => setNewCity({ ...newCity, venue: val })}
                                        options={availableVenues}
                                        placeholder="Seleccionar Venue"
                                        icon={<Building2 size={16} />}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fecha</label>
                                <input
                                    required
                                    type="date"
                                    value={newCity.date}
                                    onChange={e => setNewCity({ ...newCity, date: e.target.value })}
                                    className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary [color-scheme:dark]"
                                />
                            </div>

                            <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mt-4">
                                <Save size={18} /> Guardar Fecha
                            </button>
                        </form>
                    </div>
                </div >
            )}

            {/* --- GESTIONAR CREW MODAL (Reusable) --- */}
            {
                isCrewModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-surface border border-white/10 w-full max-w-lg rounded-2xl p-0 shadow-2xl relative animate-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {crewModalView === 'list' ? 'EQUIPO' : crewModalView === 'add' ? 'Añadir Miembro' : crewModalView === 'edit' ? 'Editar Miembro' : 'Crear Grupo'}
                                        </h2>
                                        <p className="text-xs text-gray-400">
                                            {crewModalView === 'list' ? 'Personal asignado a esta gira.' : crewModalView === 'group' ? 'Agrupa contactos en un equipo.' : 'Introduce los datos del miembro.'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => {
                                    if (crewModalView === 'list') setIsCrewModalOpen(false);
                                    else { setCrewModalView('list'); setEditingCrewMember({}); }
                                }} className="text-gray-400 hover:text-white"><X size={24} /></button>
                            </div>

                            {crewModalView === 'list' && (
                                <>
                                    <div className="p-4 border-b border-white/5 flex gap-3">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        </div>
                                        <div className="flex gap-2">
                                            {canEdit && (
                                                <button onClick={() => { setCrewModalView('group'); setSelectedContactIds([]); setGroupName(''); }} className="bg-white/10 hover:bg-white/20 text-white px-3 rounded-xl flex items-center justify-center transition-colors" title="Crear Grupo"><Briefcase size={20} /></button>
                                            )}
                                            {canEdit && (
                                                <button onClick={() => { setCrewModalView('add'); setCrewSearch(''); }} className="bg-primary hover:bg-blue-600 text-white px-3 rounded-xl flex items-center justify-center transition-colors"><Plus size={20} /></button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-2">
                                        {/* Grouped Rendering */}
                                        {(() => {
                                            const deptOrder = ['Artístico', 'Producción', 'Técnico', 'Logística', 'Gestión', 'Otros'];

                                            const grouped = filteredTourCrew.reduce((acc, contact) => {
                                                const team = contact.team || contact.department || 'Otros';
                                                if (!acc[team]) acc[team] = [];
                                                acc[team].push(contact);
                                                return acc;
                                            }, {} as Record<string, typeof filteredTourCrew>);

                                            const sortedKeys = Object.keys(grouped).sort((a, b) => {
                                                const idxA = deptOrder.indexOf(a);
                                                const idxB = deptOrder.indexOf(b);
                                                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                                                if (idxA !== -1) return -1;
                                                if (idxB !== -1) return 1;
                                                return a.localeCompare(b);
                                            });

                                            if (filteredTourCrew.length === 0) return <p className="text-center text-xs text-gray-500 py-4">No hay miembros.</p>;

                                            return sortedKeys.map(team => (
                                                <div key={team} className="mb-4 last:mb-0 animate-in fade-in duration-300">
                                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2 px-2 sticky top-0 bg-[#0c0c1a] py-1 z-10 backdrop-blur-sm border-b border-white/5">{team}</h4>
                                                    <div className="space-y-1">
                                                        {grouped[team].map(contact => (
                                                            <div key={contact.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group">
                                                                <div className="flex items-center gap-3">
                                                                    <img src={contact.avatar || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100'} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-white">{contact.name}</h4>
                                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                            <span>{contact.role}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                                    {canEdit && <button onClick={() => handleEditCrew(contact)} className="p-2 text-gray-400 hover:text-white"><Pencil size={16} /></button>}
                                                                    {canDelete && <button onClick={() => handleDeleteCrew(contact.id)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </>
                            )}

                            {crewModalView === 'add' && (
                                <div className="flex flex-col h-full overflow-hidden">
                                    <div className="p-4 border-b border-white/5 max-h-40 overflow-y-auto">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Contactos Globales</p>
                                        {availableGlobalContacts.map(c => (
                                            <div key={c.id} onClick={() => handleAddFromGlobal(c)} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer">
                                                <img src={c.avatar} className="w-6 h-6 rounded-full" />
                                                <p className="text-xs text-white flex-1">{c.name}</p>
                                                <Plus size={14} />
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={handleSaveCrewMember} className="p-6 pt-2 space-y-4 overflow-y-auto flex-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Nuevo Contacto</p>
                                        <input required type="text" value={editingCrewMember.name || ''} onChange={e => setEditingCrewMember({ ...editingCrewMember, name: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Nombre" />
                                        <input required type="text" value={editingCrewMember.role || ''} onChange={e => setEditingCrewMember({ ...editingCrewMember, role: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Rol" />
                                        <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl mt-4">Crear</button>
                                    </form>
                                </div>
                            )}

                            {crewModalView === 'edit' && (
                                <form onSubmit={handleSaveCrewMember} className="p-6 space-y-4 overflow-y-auto flex-1">
                                    <input required type="text" value={editingCrewMember.name || ''} onChange={e => setEditingCrewMember({ ...editingCrewMember, name: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Nombre" />
                                    <input required type="text" value={editingCrewMember.role || ''} onChange={e => setEditingCrewMember({ ...editingCrewMember, role: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="Rol" />
                                    <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl mt-4">Guardar</button>
                                </form>
                            )}

                            {crewModalView === 'group' && (
                                <div className="flex flex-col h-full overflow-hidden">
                                    <div className="p-4 border-b border-white/5 space-y-3 bg-surface">
                                        <h3 className="text-sm font-bold text-white">1. Define el Equipo</h3>
                                        <input
                                            type="text"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            placeholder="Nombre del Equipo (ej: Audio, Luces)"
                                            className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div className="p-4 overflow-y-auto flex-1">
                                        <h3 className="text-sm font-bold text-white mb-3">2. Selecciona Miembros</h3>
                                        <div className="space-y-2">
                                            {contacts.map(c => (
                                                <div key={c.id} onClick={() => toggleContactSelection(c.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${selectedContactIds.includes(c.id) ? 'bg-primary/10 border-primary' : 'bg-[#0c0c1a] border-white/5 hover:border-white/20'}`}>
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedContactIds.includes(c.id) ? 'bg-primary border-primary' : 'border-gray-500'}`}>
                                                        {selectedContactIds.includes(c.id) && <Check size={12} className="text-white" />}
                                                    </div>
                                                    <img src={c.avatar} className="w-8 h-8 rounded-full object-cover" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-white">{c.name}</p>
                                                        <p className="text-xs text-gray-500">{c.role} {c.team ? `• ${c.team}` : ''}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-white/5 bg-surface">
                                        <button onClick={handleCreateGroup} disabled={!groupName || selectedContactIds.length === 0} className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                                            <Users size={18} /> Crear Equipo ({selectedContactIds.length})
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Header */}
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-white/5 p-4 md:p-6 pb-2 md:pb-6">
                <div className="flex flex-col gap-4 max-w-[1600px] mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="flex w-10 h-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 border border-transparent hover:border-white/10"><ArrowLeft size={20} className="text-white" /></button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{tourData?.title || 'Calendario de Gira'}</h1>
                            <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                                <span className="flex items-center gap-1"><Music size={14} /> {tourData?.artist || 'Gestión Global'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full py-3 pl-10 pr-4 text-sm rounded-xl border border-white/5 bg-surface text-white focus:ring-2 focus:ring-primary outline-none" placeholder="Buscar fecha..." />
                        </div>
                        <div className="flex gap-2 items-center">
                            {canDelete && (
                                <button onClick={() => {
                                    if (confirm('¿Eliminar esta gira y todas sus fechas?')) {
                                        deleteEvent(tourId);
                                        navigate('/events');
                                    }
                                }} className="p-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors" title="Eliminar Gira">
                                    <Trash2 size={18} />
                                </button>
                            )}
                            {canEdit && (
                                <button onClick={() => setIsEditTourModalOpen(true)} className="p-2.5 rounded-xl border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-colors" title="Modificar Gira">
                                    <Pencil size={18} />
                                </button>
                            )}
                            {(canDelete || canEdit) && <div className="h-6 w-px bg-white/10 mx-1"></div>}
                            <button onClick={() => { setIsCrewModalOpen(true); setCrewModalView('list'); }} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2.5 rounded-xl font-bold text-sm"><Users size={18} /> <span className="hidden sm:inline">EQUIPO</span></button>
                            {canShare && <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"><Mail size={18} /> <span className="hidden sm:inline">COMPARTIR</span></button>}
                            {canEdit && <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg"><Plus size={18} /> <span className="hidden sm:inline">Añadir Fecha</span></button>}
                            <div className="flex items-center gap-1 bg-surface border border-white/10 p-1 rounded-lg shrink-0">
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400'}`}><List size={20} /></button>
                                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400'}`}><LayoutGrid size={20} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">

                        {/* LEFT: List of Events */}
                        <div className="lg:col-span-8">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Globe size={18} className="text-primary" /> Fechas ({sortedEvents.length})</h2>
                            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex flex-col gap-4"}>
                                {sortedEvents.map((item) => (
                                    <div key={item.id} onClick={() => handleCitySelect(item)} className={`group relative overflow-hidden rounded-2xl border transition-all cursor-pointer hover:-translate-y-1 bg-surface border-white/5 hover:border-primary/50 ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''}`}>
                                        <div className={`${viewMode === 'list' ? 'h-40 sm:h-auto sm:w-56 shrink-0' : 'h-40'} relative bg-cover bg-center`} style={{ backgroundImage: `url("${item.image}")` }}>
                                            <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md uppercase ${item.type === EventType.DAY_OFF ? 'bg-orange-500/80 text-white' : 'bg-black/60 text-white'}`}>
                                                {item.type === EventType.DAY_OFF ? 'DÍA LIBRE' : item.status}
                                            </div>
                                        </div>
                                        <div className="p-5 relative flex-1 group">
                                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canEdit && (
                                                    <button onClick={(e) => handleEditCity(e, item)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Editar">
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button onClick={(e) => handleDeleteCity(e, item.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors pr-16">{item.location}</h3>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-lg font-bold font-mono text-white flex items-center gap-2">
                                                    {item.dateRange}
                                                    <span className="text-gray-500 text-sm font-sans font-normal">• {item.title}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {sortedEvents.length === 0 && <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl"><p>No hay fechas activas.</p></div>}
                            </div>
                        </div>

                        {/* RIGHT: Calendar */}
                        <div className="lg:col-span-4 hidden lg:block">
                            <div className="sticky top-32 bg-surface rounded-3xl border border-white/5 p-6 shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><CalendarIcon size={20} className="text-primary" /> Calendario</h2>
                                    <div className="flex gap-2">
                                        <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-white/10"><ChevronLeft size={20} /></button>
                                        <span className="text-sm font-bold text-white w-32 text-center py-2">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                                        <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-white/10"><ChevronRight size={20} /></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 gap-1 mb-2 text-center">{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="text-xs font-bold text-gray-500">{d}</div>)}</div>
                                <div className="grid grid-cols-7 gap-2">
                                    {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} className="aspect-square"></div>)}
                                    {Array.from({ length: daysInMonth }).map((_, i) => {
                                        const day = i + 1;
                                        const event = isEventDate(day);
                                        return (
                                            <div key={day} className={`aspect-square rounded-xl flex items-center justify-center relative ${event ? 'bg-primary text-white font-bold cursor-pointer' : 'text-gray-400 hover:bg-white/5'}`} onClick={() => event && handleCitySelect(event)}>
                                                <span className="text-sm">{day}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
            {/* Share Tour Modal */}
            <ShareTourModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                eventId={tourId || ''}
                tourName={tourData?.title || 'Gira'}
            />
        </div>
    );
};

export default TourCities;
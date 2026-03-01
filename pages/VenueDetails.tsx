import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, MapPin, Calendar, Truck, Navigation, Info, FileText,
  Utensils, Download, Mic, DoorOpen, Music, Package, MessageSquare,
  Phone, Mail, Plus, Camera, Trash2, User, Plane, BedDouble, ChevronRight,
  Pencil, X, Save, Globe, Clock, MoreVertical, AlignLeft, Search,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, Users, Briefcase, ClipboardList
} from 'lucide-react';
import EditEventModal from '../components/EditEventModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTour } from '../context/TourContext';
import { ScheduleItem, DocumentItem, Contact } from '../types';

// Helper: Matches "ene", "feb", "mar"... to month index 0-11
const monthMap: Record<string, number> = {
  'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
  'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11,
  'jan': 0, 'apr': 3, 'aug': 7, 'dec': 11,
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
  'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
};

const parseEventDate = (dateStr: string) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.toLowerCase().replace(/,/g, '').trim();
  const parts = cleanStr.split(/[\s-]+/);

  let day = -1, month = -1, year = new Date().getFullYear();

  // Check for "DD MMM YYYY" or "YYYY-MM-DD"
  if (parts.length >= 3) {
    // Iso-like YYYY-MM-DD
    if (parts[0].length === 4 && !isNaN(Number(parts[0]))) {
      year = Number(parts[0]);
      month = Number(parts[1]) - 1;
      day = Number(parts[2]);
    } else {
      // Natural "25 feb 2026"
      day = parseInt(parts[0]);
      const monthStr = parts.find(p => isNaN(Number(p)) && p.length >= 3);
      const yearStr = parts.find(p => !isNaN(Number(p)) && p.length === 4);

      if (monthStr) {
        Object.keys(monthMap).forEach(k => {
          if (monthStr.startsWith(k)) month = monthMap[k];
        });
      }
      if (yearStr) year = parseInt(yearStr);
    }
  }

  if (day !== -1 && month !== -1) {
    return new Date(year, month, day);
  }
  return null;
};

const VenueDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { manualSchedule, transportList, lodgingList, addScheduleItem, deleteScheduleItem, updateScheduleItem, contacts: globalContacts, updateContact, venues, tourCrew, deleteEvent, updateEvent, documents: globalDocuments, addDocument, updateDocument, deleteDocument, events, addEventCrew, removeEventCrew } = useTour();

  // Incoming data from Dashboard or City Selection (ID source)
  const incomingEventData = location.state?.eventData;
  const eventId = incomingEventData?.id;

  // Reactively retrieve the event from Context to ensure we have the latest data
  const liveEvent = useMemo(() => events.find(e => e.id === eventId) || incomingEventData, [events, eventId, incomingEventData]);

  // Filter lists by Event ID
  const filteredTransport = useMemo(() => transportList.filter(t => t.eventId === eventId), [transportList, eventId]);
  const filteredLodging = useMemo(() => lodgingList.filter(l => l.eventId === eventId), [lodgingList, eventId]);
  const filteredManualSchedule = useMemo(() => manualSchedule.filter(s => s.eventId === eventId), [manualSchedule, eventId]);
  const tourData = location.state?.tourData;

  // Derived "Event Crew" (Persisted in Contact.eventIds)
  const dbEventCrew = useMemo(() => {
    if (!liveEvent) return [];
    const eventId = liveEvent.id;
    const tourId = liveEvent.parent_id || tourData?.id;

    return globalContacts.filter(c => {
      const inEvent = c.eventIds?.includes(eventId);
      const inTour = tourId && c.tourIds?.includes(tourId);
      return inEvent || inTour;
    });
  }, [globalContacts, liveEvent, tourData]);

  // Local Venue Contact (Automated, not persisted in DB unless manually added)
  const [venueContact, setVenueContact] = useState<Contact | null>(null);

  const eventCrew = useMemo(() => {
    // Deduplicate: If venueContact is already in dbEventCrew (by ID or Email), don't show twice
    if (venueContact && !dbEventCrew.find(c => c.name === venueContact.name)) {
      return [venueContact, ...dbEventCrew];
    }
    return dbEventCrew;
  }, [dbEventCrew, venueContact]);

  // Initialize tab based on navigation state or default to 'resumen'
  const [activeTab, setActiveTab] = useState<'resumen' | 'horarios' | 'crew'>(location.state?.tab || 'resumen');

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const [bannerImage, setBannerImage] = useState(
    liveEvent?.image || "https://images.unsplash.com/photo-1514306191717-452ec28c7f91?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
  );

  // --- State: Project Data ---
  const [projectData, setProjectData] = useState({
    projectName: liveEvent?.title || 'Evento',
    city: liveEvent?.location || 'Ubicación',
    artist: liveEvent?.artist || '',
    date: liveEvent?.dateRange || 'Fecha',
    capacity: 'Capacidad pendiente',
    venueType: 'Recinto pendiente',
    address: 'Dirección pendiente'
  });

  // --- State: Documents (Persisted via Context) ---
  const documents = globalDocuments.filter(d => d.eventId === liveEvent?.id);
  // Default mocks removed or managed via initialization if needed

  // AUTOMATION LOGIC: Check if current venue exists in DB and populate data
  useEffect(() => {
    if (liveEvent) {
      // Attempt to find venue in DB by name (passed via venueType usually)
      const venueName = (liveEvent as any).venueType; // if extended in future
      const matchedVenue = venues.find(v => v.name === venueName);

      setProjectData(prev => ({
        ...prev,
        projectName: liveEvent.title,
        city: liveEvent.location,
        artist: liveEvent.artist,
        date: liveEvent.dateRange,
        // Automate these from matchedVenue if available
        venueType: matchedVenue ? matchedVenue.name : (prev.venueType),
        capacity: matchedVenue ? `${matchedVenue.capacity} Pax` : prev.capacity,
        address: matchedVenue ? matchedVenue.address || prev.address : prev.address
      }));

      // Set image if provided by event, else fallback to matched venue image
      if (liveEvent.image) setBannerImage(liveEvent.image);
      else if (matchedVenue?.image) setBannerImage(matchedVenue.image);

      // Automate Contact: Add Venue Contact if found to Crew List (locally for this event)
      if (matchedVenue && matchedVenue.contactName) {
        const venueContact: Contact = {
          id: `venue-${matchedVenue.id}`,
          name: matchedVenue.contactName,
          role: 'Venue Contact',
          email: matchedVenue.contactEmail,
          phone: matchedVenue.contactPhone,
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80', // generic
          department: 'Local',
          associatedVenue: matchedVenue.name
        };
        // Add if not exists

        // Set local venue contact
        setVenueContact(venueContact);
        // We don't auto-persist to DB to avoid pollution, but it shows in UI
      }

      // Automate Technical Rider Document
      if (matchedVenue && matchedVenue.technicalRiderUrl) {
        const riderDoc: DocumentItem = {
          id: '9999',
          eventId: liveEvent.id,
          name: `Rider ${matchedVenue.name}`,
          type: 'Technical',
          size: 'PDF',
          version: 'Venue'
        };
        // deduplicate check
        if (!documents.find(d => d.name === riderDoc.name)) {
          addDocument(riderDoc);
        }
      }
    }
  }, [liveEvent, venues]);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [tempProjectData, setTempProjectData] = useState(projectData);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);

  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [tempDoc, setTempDoc] = useState({ name: '', type: 'Technical', version: '', size: '0 MB' });

  // --- State: Contact Search Modal ---
  const [isContactSearchOpen, setIsContactSearchOpen] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState('');

  // --- State: Edit Contact Modal ---
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Partial<Contact>>({});

  // --- State: Schedule Expansion ---
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);

  const toggleScheduleExpand = (id: string) => {
    setExpandedScheduleId(prev => prev === id ? null : id);
  };

  // Filter global contacts based on search term
  const filteredGlobalContacts = useMemo(() => {
    if (!contactSearchTerm) return [];
    const term = contactSearchTerm.toLowerCase();
    return globalContacts.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.city?.toLowerCase().includes(term) ||
      c.associatedVenue?.toLowerCase().includes(term) ||
      c.previousEvents?.some(event => event.toLowerCase().includes(term))
    ).filter(c => !eventCrew.find(ec => ec.id === c.id)); // Exclude already added
  }, [contactSearchTerm, globalContacts, eventCrew]);

  const handleAddEventCrew = (contact: Contact) => {
    // Add persisting to Context
    if (liveEvent?.id) {
      addEventCrew(contact, liveEvent.id);
      setIsContactSearchOpen(false);
      setContactSearchTerm('');
    }
  };

  const handleRemoveEventCrew = (id: string) => {
    // Check if it's the local venue contact
    if (id.startsWith('venue-')) {
      if (confirm("¿Ocultar este contacto del Venue?")) setVenueContact(null);
      return;
    }

    if (confirm("¿Eliminar este miembro de la Crew List de este evento?")) {
      if (liveEvent?.id) {
        removeEventCrew(id, liveEvent.id);
      }
    }
  };

  const openEditContactModal = (contact: Contact) => {
    setEditingContact({ ...contact });
    setIsEditContactModalOpen(true);
  };

  const handleUpdateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact.id) {
      // Update global contact
      updateContact(editingContact as Contact);
      setIsEditContactModalOpen(false);
    }
  };

  const handleBack = () => {
    if (tourData) {
      navigate('/cities', { state: { tourId: tourData.id, eventData: tourData } });
    } else {
      navigate('/dashboard');
    }
  };

  // --- Dynamic Schedule Generation ---
  // Merges manual items with transport/lodging items
  const combinedSchedule = useMemo(() => {
    const generatedEvents: ScheduleItem[] = [];

    // Convert Transport Items to Schedule Events
    filteredTransport.forEach(t => {
      generatedEvents.push({
        id: `transport-${t.id}-dep`,
        startTime: t.departureTime,
        activity: `${t.type === 'flight' ? 'Vuelo' : 'Viaje'} ${t.number} - Salida`,
        location: t.origin,
        type: 'logistics',
        notes: `Destino: ${t.destination} via ${t.provider}`,
        isAutoGenerated: true,
        passengers: t.passengers // Pass through passengers
      });
      generatedEvents.push({
        id: `transport-${t.id}-arr`,
        startTime: t.arrivalTime,
        activity: `${t.type === 'flight' ? 'Vuelo' : 'Viaje'} ${t.number} - Llegada`,
        location: t.destination,
        type: 'logistics',
        notes: `Llegada desde ${t.origin}`,
        isAutoGenerated: true,
        passengers: t.passengers // Pass through passengers
      });
    });

    // Helper functions for date management
    // parseEventDate is now at module scope

    const getDayBadge = (itemTime?: string) => {
      if (!itemTime || !projectData.date) return null;

      const eventDate = parseEventDate(projectData.date);
      if (!eventDate) return null;

      let itemDate: Date | null = null;

      if (itemTime.includes('T') || itemTime.includes('-')) {
        itemDate = new Date(itemTime);
      } else {
        // Time only "15:00" -> Assume same day as event
        return null;
      }

      if (!itemDate || isNaN(itemDate.getTime())) return null;

      // Compare days (ignore time for diff calculation)
      const eventMidnight = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const itemMidnight = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

      const diffTime = itemMidnight.getTime() - eventMidnight.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return null;
      if (diffDays === 1) return <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30 uppercase font-bold ml-2">Day +1</span>;
      if (diffDays > 1) return <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30 uppercase font-bold ml-2">Day +{diffDays}</span>;
      if (diffDays < 0) return <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 uppercase font-bold ml-2">Prev Day</span>;

      return null;
    };

    // Convert Lodging Items to Schedule Events
    filteredLodging.forEach(l => {
      // Helper to construct ISO string from Date + Time
      const getIso = (dateStr?: string, timeStr?: string) => {
        if (!dateStr || !timeStr) return timeStr || '';
        return `${dateStr}T${timeStr}`;
      };

      // Helper to format Date to YYYY-MM-DD Local
      const toLocalIsoDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Resolve Check-In Date (Default to Event Date if missing)
      let resolvedCheckInDate = l.checkInDate;
      let resolvedCheckOutDate = l.checkOutDate;

      // Try to parse event date if check-in is missing
      if (!resolvedCheckInDate && projectData.date) {
        const d = parseEventDate(projectData.date);
        if (d) resolvedCheckInDate = toLocalIsoDate(d);
      }

      // Try to resolve Check-Out Date (Default to Check-In + 1 if missing)
      if (!resolvedCheckOutDate && resolvedCheckInDate) {
        const d = new Date(resolvedCheckInDate);
        d.setDate(d.getDate() + 1); // Check-out next day
        resolvedCheckOutDate = d.toISOString().split('T')[0];
      }

      generatedEvents.push({
        id: `lodging-${l.id}-in`,
        startTime: getIso(resolvedCheckInDate, l.checkIn),
        activity: `Check-In Hotel`,
        location: l.name,
        type: 'hospitality',
        notes: `${l.address} - ${l.rooms} habitaciones`,
        isAutoGenerated: true
      });
      generatedEvents.push({
        id: `lodging-${l.id}-out`,
        startTime: getIso(resolvedCheckOutDate, l.checkOut),
        activity: `Check-Out Hotel`,
        location: l.name,
        type: 'hospitality',
        notes: `Salida de ${l.name}`,
        isAutoGenerated: true
      });
    });

    const getTimestamp = (timeStr: string) => {
      if (!timeStr) return 0;

      let ts = 0;

      // 1. Full ISO Date
      if (timeStr.includes('T') || (timeStr.includes('-') && timeStr.length > 10)) {
        ts = new Date(timeStr).getTime();
      }
      // 2. Time Only (HH:MM) -> Anchor to Event Date
      else if (projectData.date) {
        const eventDate = parseEventDate(projectData.date);
        if (eventDate) {
          const [h, m] = timeStr.split(':').map(Number);
          if (!isNaN(h) && !isNaN(m)) {
            const anchoredDate = new Date(eventDate);
            anchoredDate.setHours(h, m, 0, 0);
            ts = anchoredDate.getTime();
          }
        }
      }

      return isNaN(ts) ? 0 : ts;
    };

    return [...filteredManualSchedule, ...generatedEvents].sort((a, b) => {
      const tA = getTimestamp(a.startTime);
      const tB = getTimestamp(b.startTime);
      return tA - tB;
    });
  }, [filteredManualSchedule, filteredTransport, filteredLodging, projectData.date]);

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleItem, setEditingScheduleItem] = useState<ScheduleItem | null>(null);
  const [tempScheduleItem, setTempScheduleItem] = useState<Partial<ScheduleItem>>({ startTime: '', activity: '', type: 'logistics' });

  // --- Handlers: Banner ---
  const handleImageUpload = () => {
    const newUrl = prompt("Introduce la URL de la nueva imagen:", bannerImage);
    if (newUrl) setBannerImage(newUrl);
  };

  const handleDeleteImage = () => {
    if (confirm("¿Estás seguro de eliminar la imagen de portada?")) {
      setBannerImage("");
    }
  };

  // --- Handlers: Project Data ---
  const openProjectModal = () => {
    setTempProjectData(projectData);
    setIsProjectModalOpen(true);
  };

  const saveProjectData = (e: React.FormEvent) => {
    e.preventDefault();
    setProjectData(tempProjectData);
    if (liveEvent) {
      // Persist core fields to Event
      updateEvent({
        ...liveEvent,
        title: tempProjectData.projectName,
        location: tempProjectData.city,
        dateRange: tempProjectData.date,
        artist: tempProjectData.artist
      });
    }
    setIsProjectModalOpen(false);
  };

  // --- Handlers: Documents ---
  const openDocModal = (doc?: DocumentItem) => {
    if (doc) {
      setEditingDoc(doc);
      setTempDoc({ name: doc.name, type: doc.type, version: doc.version, size: doc.size });
    } else {
      setEditingDoc(null);
      setTempDoc({ name: '', type: 'Technical', version: 'v1.0', size: '2.5 MB' }); // Default values
    }
    setIsDocModalOpen(true);
  };

  const deleteDoc = (id: string) => {
    if (confirm("¿Eliminar este documento?")) {
      deleteDocument(id);
    }
  };

  const saveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDoc) {
      updateDocument({ ...editingDoc, ...tempDoc, eventId: liveEvent?.id } as DocumentItem);
    } else {
      const newDoc: DocumentItem = {
        id: Date.now().toString(),
        eventId: liveEvent?.id,
        name: tempDoc.name,
        type: tempDoc.type as any,
        version: tempDoc.version,
        size: tempDoc.size
      };
      addDocument(newDoc);
    }
    setIsDocModalOpen(false);
  };

  // --- Handlers: Schedule ---
  const openScheduleModal = (item?: ScheduleItem) => {
    if (item?.isAutoGenerated) {
      alert("Este evento se genera automáticamente desde Logística. Edítalo en la pestaña de Transporte o Hospedaje.");
      return;
    }
    if (item) {
      setEditingScheduleItem(item);
      setTempScheduleItem(item);
    } else {
      setEditingScheduleItem(null);
      setTempScheduleItem({ startTime: '', activity: '', location: '', type: 'logistics', notes: '' });
    }
    setIsScheduleModalOpen(true);
  };

  const handleDeleteScheduleItem = (id: string) => {
    // Check if it's auto-generated string id or manual number id
    if (id.startsWith('transport-') || id.startsWith('lodging-')) {
      alert("Este evento se genera automáticamente desde Logística. Elimínalo en la pestaña correspondiente.");
      return;
    }
    if (confirm("¿Eliminar este evento de la agenda?")) {
      deleteScheduleItem(id);
    }
  };

  const saveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingScheduleItem && tempScheduleItem) {
      updateScheduleItem({ ...editingScheduleItem, ...tempScheduleItem } as ScheduleItem);
    } else {
      const newItem: ScheduleItem = {
        id: Date.now().toString(),
        eventId: liveEvent?.id,
        startTime: tempScheduleItem.startTime || '', // Removed '00:00' fallback to avoid data corruption
        endTime: tempScheduleItem.endTime,
        activity: tempScheduleItem.activity || 'Nueva Actividad',
        location: tempScheduleItem.location || 'Venue',
        type: tempScheduleItem.type as any || 'other',
        notes: tempScheduleItem.notes,
        isAutoGenerated: false
      };
      addScheduleItem(newItem);
    }
    setIsScheduleModalOpen(false);
  };

  // --- Render Helpers ---
  const getDocIcon = (type: string) => {
    switch (type) {
      case 'Technical': return <FileText size={24} />;
      case 'Hospitality': return <Utensils size={24} />;
      default: return <FileText size={24} />;
    }
  };

  const getDocColor = (type: string) => {
    switch (type) {
      case 'Technical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Hospitality': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getScheduleIcon = (type: string) => {
    switch (type) {
      case 'logistics': return <Truck size={18} />;
      case 'sound': return <Mic size={18} />;
      case 'show': return <Music size={18} />;
      case 'hospitality': return <Utensils size={18} />;
      default: return <Clock size={18} />;
    }
  };

  const getScheduleColor = (type: string) => {
    switch (type) {
      case 'logistics': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'sound': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'show': return 'text-text bg-primary border-primary/50 shadow-lg shadow-primary/20';
      case 'hospitality': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default: return 'text-muted bg-gray-500/10 border-gray-500/20';
    }
  };

  // Helper functions for date management
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    // If it's a full ISO string, extract time
    if (timeStr.includes('T')) {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    // If it's already HH:MM, return as is
    return timeStr;
  };

  const getDayBadge = (itemTime?: string) => {
    if (!itemTime || !itemTime.includes('T') || !projectData.date) return null;

    const eventDate = parseEventDate(projectData.date);
    const itemDate = new Date(itemTime); // ISO string

    if (!eventDate || isNaN(itemDate.getTime())) return null;

    // Compare days (ignore time) using Local Time
    const eventMidnight = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const itemMidnight = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

    const diffTime = itemMidnight.getTime() - eventMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return null;
    if (diffDays === 1) return <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30 uppercase font-bold ml-2">Day +1</span>;
    if (diffDays > 1) return <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30 uppercase font-bold ml-2">Day +{diffDays}</span>;
    if (diffDays < 0) return <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 uppercase font-bold ml-2">Prev Day</span>;

    return null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-text pb-24 md:pb-8">

      {/* --- MODALS --- */}
      {liveEvent && (
        <EditEventModal
          isOpen={isEditEventModalOpen}
          onClose={() => setIsEditEventModalOpen(false)}
          onSave={updateEvent}
          event={liveEvent}
          title="Modificar Evento"
        />
      )}
      {/* [Existing Modal Code omitted for brevity, logic remains the same] */}
      {isEditContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in zoom-in duration-200">
            <button onClick={() => setIsEditContactModalOpen(false)} className="absolute top-4 right-4 text-muted hover:text-text"><X size={24} /></button>
            <h2 className="text-xl font-bold text-text mb-6">Editar Contacto</h2>
            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Nombre</label>
                <input required type="text" value={editingContact.name} onChange={e => setEditingContact({ ...editingContact, name: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Rol</label>
                  <input required type="text" value={editingContact.role} onChange={e => setEditingContact({ ...editingContact, role: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Dept.</label>
                  <select value={editingContact.department} onChange={e => setEditingContact({ ...editingContact, department: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary">
                    <option value="Producción">Producción</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Promoción">Promoción</option>
                    <option value="Logística">Logística</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Email</label>
                <input type="email" value={editingContact.email} onChange={e => setEditingContact({ ...editingContact, email: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">Teléfono</label>
                <input type="tel" value={editingContact.phone} onChange={e => setEditingContact({ ...editingContact, phone: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-text font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                <Save size={18} /> Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contact Search Modal */}
      {isContactSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start pt-20 justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border w-full max-w-lg rounded-2xl p-0 shadow-2xl relative animate-in slide-in-from-bottom-8 duration-300 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Search className="text-muted" size={20} />
              <input
                autoFocus
                type="text"
                placeholder="Buscar por nombre, venue, ciudad o evento..."
                value={contactSearchTerm}
                onChange={(e) => setContactSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-text placeholder-gray-500"
              />
              <button onClick={() => setIsContactSearchOpen(false)} className="text-muted hover:text-text">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {!contactSearchTerm && (
                <div className="text-center py-8 text-muted text-sm">
                  Escribe para buscar en tu base de datos de contactos.
                </div>
              )}

              {contactSearchTerm && filteredGlobalContacts.length === 0 && (
                <div className="text-center py-8 text-muted text-sm">
                  No se encontraron contactos.
                </div>
              )}

              {filteredGlobalContacts.map(contact => (
                <div key={contact.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors group cursor-pointer" onClick={() => handleAddEventCrew(contact)}>
                  <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-text text-sm">{contact.name}</h4>
                    <p className="text-xs text-primary">{contact.role}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {contact.city && <span className="text-[10px] text-muted bg-black/30 px-1.5 rounded">{contact.city}</span>}
                      {contact.associatedVenue && <span className="text-[10px] text-muted bg-black/30 px-1.5 rounded">{contact.associatedVenue}</span>}
                      {contact.previousEvents?.map((evt, i) => (
                        <span key={i} className="text-[10px] text-muted bg-black/30 px-1.5 rounded truncate max-w-[150px]">{evt}</span>
                      ))}
                    </div>
                  </div>
                  <button className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-text transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-black/20 border-t border-border text-xs text-center text-muted">
              ¿No encuentras a quien buscas? <button onClick={() => { setIsContactSearchOpen(false); navigate('/team'); }} className="text-primary hover:underline">Gestionar equipo</button>
            </div>
          </div>
        </div>
      )}

      {/* Project Data Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in zoom-in duration-200">
            <button onClick={() => setIsProjectModalOpen(false)} className="absolute top-4 right-4 text-muted hover:text-text"><X size={24} /></button>
            <h2 className="text-xl font-bold text-text mb-6">Editar Datos del Proyecto</h2>
            <form onSubmit={saveProjectData} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Nombre del Proyecto</label>
                <input type="text" value={tempProjectData.projectName} onChange={e => setTempProjectData({ ...tempProjectData, projectName: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Ciudad</label>
                <input type="text" value={tempProjectData.city} onChange={e => setTempProjectData({ ...tempProjectData, city: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
              </div>
              <div className="h-px bg-primary/5 my-2"></div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Artista / Grupo</label>
                <input type="text" value={tempProjectData.artist} onChange={e => setTempProjectData({ ...tempProjectData, artist: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Capacidad</label>
                <input type="text" value={tempProjectData.capacity} onChange={e => setTempProjectData({ ...tempProjectData, capacity: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Tipo de Venue</label>
                <input type="text" value={tempProjectData.venueType} onChange={e => setTempProjectData({ ...tempProjectData, venueType: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Dirección</label>
                <input type="text" value={tempProjectData.address} onChange={e => setTempProjectData({ ...tempProjectData, address: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-text font-bold py-3.5 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2">
                <Save size={18} /> Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in zoom-in duration-200">
            <button onClick={() => setIsDocModalOpen(false)} className="absolute top-4 right-4 text-muted hover:text-text"><X size={24} /></button>
            <h2 className="text-xl font-bold text-text mb-6">{editingDoc ? 'Editar Documento' : 'Añadir Documento'}</h2>
            <form onSubmit={saveDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Nombre del Documento</label>
                <input required type="text" placeholder="ej: Rider de Luces" value={tempDoc.name} onChange={e => setTempDoc({ ...tempDoc, name: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Versión</label>
                  <input type="text" placeholder="v1.0" value={tempDoc.version} onChange={e => setTempDoc({ ...tempDoc, version: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Tamaño (Simulado)</label>
                  <input type="text" placeholder="2 MB" value={tempDoc.size} onChange={e => setTempDoc({ ...tempDoc, size: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Tipo</label>
                <select value={tempDoc.type} onChange={e => setTempDoc({ ...tempDoc, type: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary">
                  <option value="Technical">Técnico</option>
                  <option value="Hospitality">Hospitalidad</option>
                  <option value="Other">Otro</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-text font-bold py-3.5 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2">
                <Save size={18} /> {editingDoc ? 'Actualizar' : 'Añadir'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface border border-border w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-in zoom-in duration-200">
            <button onClick={() => setIsScheduleModalOpen(false)} className="absolute top-4 right-4 text-muted hover:text-text"><X size={24} /></button>
            <h2 className="text-xl font-bold text-text mb-6">{editingScheduleItem ? 'Editar Evento' : 'Añadir Evento'}</h2>
            <form onSubmit={saveSchedule} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Inicio</label>
                  <input required type="datetime-local" value={tempScheduleItem.startTime} onChange={e => setTempScheduleItem({ ...tempScheduleItem, startTime: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Fin (Opcional)</label>
                  <input type="datetime-local" value={tempScheduleItem.endTime || ''} onChange={e => setTempScheduleItem({ ...tempScheduleItem, endTime: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary [color-scheme:dark]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Actividad</label>
                <input required type="text" placeholder="ej: Prueba de Sonido" value={tempScheduleItem.activity} onChange={e => setTempScheduleItem({ ...tempScheduleItem, activity: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Ubicación</label>
                <input type="text" placeholder="ej: Escenario Principal" value={tempScheduleItem.location || ''} onChange={e => setTempScheduleItem({ ...tempScheduleItem, location: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Tipo</label>
                <select value={tempScheduleItem.type} onChange={e => setTempScheduleItem({ ...tempScheduleItem, type: e.target.value as any })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary">
                  <option value="logistics">Logística / Carga</option>
                  <option value="sound">Sonido / Técnico</option>
                  <option value="show">Show / Actuación</option>
                  <option value="hospitality">Comida / Hospitalidad</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Notas (Opcional)</label>
                <input type="text" placeholder="Detalles adicionales..." value={tempScheduleItem.notes || ''} onChange={e => setTempScheduleItem({ ...tempScheduleItem, notes: e.target.value })} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary" />
              </div>

              {/* Assignments */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Asignar a:</label>

                {/* Group Buttons */}
                <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-border">
                  {['Producción', 'Técnico', 'Promoción', 'Logística', 'Local'].map(group => {
                    const groupId = `team:${group}`;
                    const isAssigned = tempScheduleItem.assignedTo?.includes(groupId);
                    return (
                      <button
                        key={groupId}
                        type="button"
                        onClick={() => {
                          const current = tempScheduleItem.assignedTo || [];
                          const newAssigned = isAssigned
                            ? current.filter(id => id !== groupId)
                            : [...current, groupId];
                          setTempScheduleItem({ ...tempScheduleItem, assignedTo: newAssigned });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-2 ${isAssigned ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' : 'bg-primary/5 text-muted border-border hover:border-white/20'}`}
                      >
                        <Users size={12} />
                        {isAssigned && <CheckCircle size={12} />}
                        Todos: {group}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-muted uppercase font-bold mb-2">Miembros Individuales</p>
                <div className="flex flex-wrap gap-2 mb-2 max-h-32 overflow-y-auto">
                  {eventCrew.map(contact => {
                    const isAssigned = tempScheduleItem.assignedTo?.includes(contact.id.toString());
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => {
                          const current = tempScheduleItem.assignedTo || [];
                          const newAssigned = isAssigned
                            ? current.filter(id => id !== contact.id.toString())
                            : [...current, contact.id.toString()];
                          setTempScheduleItem({ ...tempScheduleItem, assignedTo: newAssigned });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-2 ${isAssigned ? 'bg-primary text-text border-primary' : 'bg-primary/5 text-muted border-border hover:border-white/20'}`}
                      >
                        {isAssigned && <CheckCircle size={12} />}
                        {contact.name.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notify Checkbox */}
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-border">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${tempScheduleItem.notify ? 'bg-primary border-primary' : 'border-gray-500'}`} onClick={() => setTempScheduleItem({ ...tempScheduleItem, notify: !tempScheduleItem.notify })}>
                  {tempScheduleItem.notify && <CheckCircle size={14} className="text-text" />}
                </div>
                <div onClick={() => setTempScheduleItem({ ...tempScheduleItem, notify: !tempScheduleItem.notify })} className="cursor-pointer">
                  <p className="text-sm font-bold text-text">Notificar al equipo</p>
                  <p className="text-xs text-muted">Enviar alerta push a los miembros asignados</p>
                </div>
              </div>

              <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-text font-bold py-3.5 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2">
                <Save size={18} /> Guardar
              </button>
            </form>
          </div>
        </div>
      )}


      {/* Top App Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border md:static md:bg-transparent md:border-none">
        <div className="flex items-center justify-between p-4 px-6 md:pt-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex w-10 h-10 shrink-0 items-center justify-center rounded-full hover:hover:bg-primary/10 cursor-pointer transition-colors border border-transparent hover:border-border"
              title={tourData ? "Volver a Ciudades" : "Volver al Dashboard"}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              {tourData && (
                <div onClick={handleBack} className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider cursor-pointer hover:underline mb-0.5">
                  <MapPin size={10} /> {tourData.title || "Gira"}
                </div>
              )}
              <h2 className="text-xl font-bold leading-tight tracking-tight">{projectData.projectName}</h2>
              <p className="text-xs text-muted">{projectData.city} • {projectData.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('¿Eliminar este evento?')) {
                  if (liveEvent?.id) {
                    deleteEvent(liveEvent.id);
                    navigate(-1);
                  }
                }
              }}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
              title="Eliminar Evento"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={() => setIsEditEventModalOpen(true)}
              className="p-2 text-muted hover:text-text hover:hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-border"
              title="Modificar Evento"
            >
              <Pencil size={20} />
            </button>
          </div>
        </div>

        {/* Event Tabs */}
        <div className="flex items-center gap-8 px-6 border-b border-border overflow-x-auto no-scrollbar bg-background">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`py-3 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'resumen' ? 'text-text border-primary' : 'text-muted hover:text-text border-transparent hover:border-border'}`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('horarios')}
            className={`py-3 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'horarios' ? 'text-text border-primary' : 'text-muted hover:text-text border-transparent hover:border-border'}`}
          >
            Horarios
          </button>
          <button
            onClick={() => navigate('/logistics', { state: { section: 'transport', eventData: liveEvent, tourData: tourData } })}
            className="py-3 text-sm font-bold text-muted hover:text-text transition-colors border-b-2 border-transparent hover:border-border whitespace-nowrap"
          >
            Transporte
          </button>
          <button
            onClick={() => navigate('/logistics', { state: { section: 'lodging', eventData: liveEvent, tourData: tourData } })}
            className="py-3 text-sm font-bold text-muted hover:text-text transition-colors border-b-2 border-transparent hover:border-border whitespace-nowrap"
          >
            Hospedaje
          </button>
          <button
            onClick={() => setActiveTab('crew')}
            className={`py-3 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'crew' ? 'text-text border-primary' : 'text-muted hover:text-text border-transparent hover:border-border'}`}
          >
            Crew List
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">

        {/* Full Width Banner */}
        <div className="relative w-full h-64 md:h-80 bg-gray-900 group overflow-hidden">
          {bannerImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url("${bannerImage}")` }}
            ></div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-600">
              <span className="flex flex-col items-center gap-2"><Camera size={32} /> Sin Imagen</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>

          {/* Banner Actions */}
          <div className="absolute top-4 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleImageUpload}
              className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold hover:bg-black/80 transition-colors border border-border"
            >
              <Camera size={14} /> Modificar
            </button>
            <button
              onClick={handleDeleteImage}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/80 backdrop-blur-md rounded-lg text-xs font-bold hover:bg-red-600 transition-colors border border-red-500/20"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Banner Text */}
          <div className="absolute bottom-6 left-6 md:left-10 max-w-2xl">
            <span className="inline-block px-2 py-1 mb-2 text-[10px] font-bold uppercase tracking-wider bg-primary text-text rounded-md">Próximo Evento</span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-text leading-tight mb-2 drop-shadow-lg">{projectData.projectName}</h1>
            <p className="text-lg text-gray-200 font-medium drop-shadow-md flex items-center gap-2">
              <MapPin size={18} className="text-primary" /> {projectData.city}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">

          {/* Left Column: Project Data & Crew List (Short) - Only show in Resumen */}
          {activeTab === 'resumen' && (
            <div className="md:col-span-5 lg:col-span-4 space-y-6">

              {/* Project Data Card */}
              <div className="bg-surface rounded-2xl border border-border p-6 shadow-lg shadow-black/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-text flex items-center gap-2">
                    <Info size={18} className="text-primary" /> Datos del Proyecto
                  </h3>
                  <button
                    onClick={openProjectModal}
                    className="p-2 hover:hover:bg-primary/10 rounded-lg text-muted hover:text-text transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-3 rounded-xl bg-primary/5 border border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Music size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-muted font-bold uppercase">Artista / Grupo</p>
                      <p className="text-text font-bold">{projectData.artist}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-primary/5 border border-border">
                      <p className="text-xs text-muted font-bold uppercase">Capacidad</p>
                      <p className="text-text font-bold">{projectData.capacity}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/5 border border-border">
                      <p className="text-xs text-muted font-bold uppercase">Tipo</p>
                      <p className="text-text font-bold">{projectData.venueType}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crew List Summary Card */}
              <div className="bg-surface rounded-2xl border border-border p-6 shadow-lg shadow-black/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-text flex items-center gap-2">
                    <Users size={18} className="text-primary" /> Crew List
                  </h3>
                  <span className="text-xs text-muted font-mono">{eventCrew.length} Pax</span>
                </div>
                <div className="space-y-4">
                  {eventCrew.slice(0, 4).map(contact => (
                    <div key={contact.id} className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-border hover:border-border transition-colors group relative">
                      <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text truncate">{contact.name}</p>
                        <p className="text-xs text-muted truncate">{contact.role}</p>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setActiveTab('crew')}
                    className="w-full text-xs font-bold text-muted hover:text-text py-2 text-center transition-colors border border-dashed border-border rounded-xl hover:bg-primary/5"
                  >
                    Ver lista completa
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Right Column (or Full width if other tab) */}
          {activeTab === 'resumen' && (
            <div className="md:col-span-7 lg:col-span-8 space-y-6">

              {/* Schedule Timeline (Escaleta Resumen - DYNAMIC) */}
              <div className="bg-surface rounded-2xl border border-border p-6 shadow-lg shadow-black/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold leading-tight text-text flex items-center gap-2">
                    <Calendar size={20} className="text-primary" /> Escaleta / Horarios
                  </h3>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">A TIEMPO</span>
                </div>

                <div className="grid grid-cols-[60px_1fr] gap-x-2">
                  {combinedSchedule.slice(0, 6).map((item, index, arr) => {
                    const isLast = index === arr.length - 1;
                    return (
                      <React.Fragment key={item.id}>
                        {/* Icon Column */}
                        <div className="flex flex-col items-center relative">
                          {/* Top Line */}
                          {index !== 0 && <div className="w-[2px] bg-[#232348] h-4"></div>}

                          {/* Icon Circle */}
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-border z-10 shadow-sm shrink-0 ${item.type === 'show' ? 'bg-primary text-text shadow-[0_0_15px_rgba(19,19,236,0.5)]' : 'bg-[#101022] text-muted'
                            }`}>
                            {getScheduleIcon(item.type)}
                          </div>

                          {/* Bottom Line */}
                          {!isLast && <div className="w-[2px] bg-[#232348] flex-1 min-h-[1rem]"></div>}
                        </div>

                        {/* Content Column */}
                        <div className={`flex flex-col py-2 ${!isLast ? 'pb-6' : ''}`}>
                          <p className={`text-base font-bold leading-none ${item.type === 'show' ? 'text-primary' : 'text-text'}`}>{item.activity}</p>
                          <p className="text-secondary text-xs mt-1 font-mono">{item.startTime} • {item.location}</p>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Link to full schedule */}
                <div className="col-span-2 pt-6 border-t border-border mt-2">
                  <button
                    onClick={() => setActiveTab('horarios')}
                    className="w-full py-2 text-sm text-muted hover:text-text font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    Ver escaleta completa ({combinedSchedule.length}) <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Logistics Summary (Flights & Hotel) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Flight Summary */}
                {(() => {
                  const nextFlight = filteredTransport.find(t => t.type === 'flight');
                  return (
                    <div
                      onClick={() => navigate('/logistics', { state: { section: 'transport', eventData: liveEvent, tourData: tourData } })}
                      className="group bg-surface rounded-2xl border border-border p-5 shadow-lg shadow-black/20 cursor-pointer hover:border-primary/50 transition-all hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                          <Plane size={24} />
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-primary/5 text-muted group-hover:bg-primary group-hover:text-text transition-colors">Siguiente Vuelo</span>
                      </div>
                      {nextFlight ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold text-text truncate max-w-[40%]">{nextFlight.origin}</span>
                            <div className="flex-1 border-t border-dashed border-gray-600 mx-3 relative top-0.5"></div>
                            <span className="text-2xl font-bold text-text truncate max-w-[40%]">{nextFlight.destination}</span>
                          </div>
                          <p className="text-sm text-muted">{nextFlight.number} • {nextFlight.departureTime}</p>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-muted">
                          <span className="text-sm italic">Sin vuelos asignados</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Hotel Summary */}
                {(() => {
                  const currentLodging = filteredLodging[0];
                  return (
                    <div
                      onClick={() => navigate('/logistics', { state: { section: 'lodging', eventData: liveEvent, tourData: tourData } })}
                      className="group bg-surface rounded-2xl border border-border p-5 shadow-lg shadow-black/20 cursor-pointer hover:border-primary/50 transition-all hover:-translate-y-1"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                          <BedDouble size={24} />
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-primary/5 text-muted group-hover:bg-primary group-hover:text-text transition-colors">Hospedaje Actual</span>
                      </div>
                      {currentLodging ? (
                        <>
                          <h4 className="text-lg font-bold text-text truncate">{currentLodging.name}</h4>
                          <p className="text-sm text-muted truncate">{currentLodging.address}</p>
                          <div className="mt-3 flex items-center gap-2 text-xs text-secondary">
                            <span className="bg-primary/5 px-2 py-0.5 rounded">Check-out: {currentLodging.checkOut}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-muted">
                          <span className="text-sm italic">Sin hospedaje asignado</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Documents Section */}
              <div className="bg-surface rounded-2xl border border-border p-6 shadow-lg shadow-black/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-text flex items-center gap-2">
                    <FileText size={18} className="text-primary" /> Documentación
                  </h3>
                  <button onClick={() => openDocModal()} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold rounded-lg transition-colors border border-primary/20">
                    <Plus size={16} /> Añadir
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="relative group bg-background p-4 rounded-xl border border-border hover:border-primary/50 transition-all hover:-translate-y-1">
                      <div className="flex justify-between items-start mb-3">
                        <div className={`p-2 rounded-lg ${getDocColor(doc.type)}`}>
                          {getDocIcon(doc.type)}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openDocModal(doc)} className="p-1.5 hover:hover:bg-primary/10 rounded-lg text-muted hover:text-text"><Pencil size={14} /></button>
                          <button onClick={() => deleteDoc(doc.id)} className="p-1.5 hover:hover:bg-primary/10 rounded-lg text-muted hover:text-red-400"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <h4 className="font-bold text-text mb-1 truncate">{doc.name}</h4>
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>{doc.version} • {doc.size}</span>
                        <span className="px-2 py-0.5 rounded bg-primary/5 border border-border">{doc.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Horarios Tab Content */}
          {activeTab === 'horarios' && (
            <div className="col-span-12">
              <div className="bg-surface rounded-2xl border border-border p-6 shadow-lg shadow-black/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-text flex items-center gap-2">
                    <Clock size={18} className="text-primary" /> Agenda del Día
                  </h3>
                  <button onClick={() => openScheduleModal()} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold rounded-lg transition-colors border border-primary/20">
                    <Plus size={16} /> Añadir Evento
                  </button>
                </div>

                <div className="relative border-l-2 border-border ml-3 md:ml-6 space-y-8 pl-6 md:pl-8 py-2">
                  {combinedSchedule.map((item) => (
                    <div key={item.id} className="relative group">
                      <div className={`absolute -left-[31px] md:-left-[39px] top-4 w-4 h-4 rounded-full border-2 border-background ${item.type === 'show' ? 'bg-primary' : 'bg-gray-600'} group-hover:scale-125 transition-transform`}></div>

                      {/* Expandable Card */}
                      <div
                        className={`flex flex-col p-4 rounded-xl bg-background border transition-all cursor-pointer ${expandedScheduleId === item.id ? 'border-primary shadow-lg shadow-primary/10' : 'border-border hover:border-border'}`}
                        onClick={() => toggleScheduleExpand(item.id)}
                      >
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="min-w-[100px]">
                            <span className="text-lg font-bold text-text flex items-center">
                              {formatTime(item.startTime)}
                              {getDayBadge(item.startTime)}
                            </span>
                            {item.endTime && <span className="text-sm text-muted block">hasta {formatTime(item.endTime)}</span>}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${getScheduleColor(item.type)}`}>
                                  {getScheduleIcon(item.type)} {item.type}
                                </span>
                                {item.isAutoGenerated && (
                                  <span className="text-[10px] text-primary italic border border-primary/30 px-1 rounded">Auto</span>
                                )}
                              </div>
                              <div className="text-muted hover:text-text transition-colors">
                                {expandedScheduleId === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            </div>
                            <h4 className="text-lg font-bold text-text">{item.activity}</h4>
                            <p className="text-sm text-muted flex items-center gap-1 mt-1">
                              <MapPin size={12} /> {item.location}
                            </p>
                          </div>
                        </div>

                        {/* Accordion Content */}
                        {expandedScheduleId === item.id && (
                          <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4 text-sm animate-in slide-in-from-top-2">
                            {/* Left Column: Details & Notes */}
                            <div className="space-y-3">
                              <div>
                                <p className="text-muted text-xs font-bold uppercase mb-1">Detalles & Notas</p>
                                <p className="text-gray-300 leading-relaxed bg-primary/5 p-3 rounded-lg border border-border">
                                  {item.notes || 'Sin notas adicionales especificadas para este evento.'}
                                </p>
                              </div>



                              {item.type === 'hospitality' && (
                                <div className="flex items-center gap-2 text-green-400 bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                                  <CheckCircle size={14} /> <span>Catering Confirmado: 45 Pax</span>
                                </div>
                              )}
                            </div>

                            {/* Right Column: Crew & Actions */}
                            <div className="space-y-4">
                              <div>
                                <p className="text-muted text-xs font-bold uppercase mb-2">Personal Asignado</p>
                                <p className="text-muted text-xs font-bold uppercase mb-2">Personal Asignado</p>
                                <div className="flex flex-col gap-3">
                                  {/* Avatars Row (Manual Assignments) */}
                                  <div className="flex items-center -space-x-2">
                                    {item.assignedTo && item.assignedTo.length > 0 ? (
                                      item.assignedTo.map((id) => {
                                        if (id.startsWith('team:')) {
                                          const teamName = id.replace('team:', '');
                                          return (
                                            <div key={id} className="h-8 px-2 rounded-full border-2 border-background bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-text relative hover:z-10 hover:scale-105 transition-transform cursor-pointer shadow-lg" title={`Todo el equipo: ${teamName}`}>
                                              <Users size={12} className="mr-1" /> {teamName}
                                            </div>
                                          );
                                        }

                                        const assignedContact = eventCrew.find(c => c.id.toString() === id);
                                        if (!assignedContact) return null;
                                        return (
                                          <div key={id} className="w-8 h-8 rounded-full border-2 border-background relative hover:z-10 hover:scale-110 transition-transform cursor-pointer" title={assignedContact.name}>
                                            <img src={assignedContact.avatar} alt={assignedContact.name} className="w-full h-full rounded-full object-cover" />
                                          </div>
                                        );
                                      })
                                    ) : null}

                                    <button
                                      onClick={(e) => { e.stopPropagation(); openScheduleModal(item); }}
                                      className="w-8 h-8 rounded-full border-2 border-background bg-primary/5 flex items-center justify-center text-xs font-bold text-muted hover:hover:bg-primary/10 hover:text-text transition-colors"
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>

                                  {/* Render Transport Passengers (List View) - Now outside avatar row */}
                                  {item.passengers && item.passengers.length > 0 && (
                                    <div className="w-full flex flex-col gap-2 mt-2">
                                      {item.passengers.map(p => (
                                        <div key={p.id} className="flex items-center gap-3 bg-background/50 p-2 rounded-lg border border-border hover:border-border transition-colors">
                                          <div className="w-8 h-8 rounded-full border border-border overflow-hidden shrink-0">
                                            <img src={p.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'} alt={p.name} className="w-full h-full object-cover" />
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-sm font-bold text-text">{p.name}</span>
                                            <span className="text-[10px] text-muted uppercase tracking-wide">{p.role === 'Artist' ? <span className="text-primary">Artista</span> : p.role} • {p.seat || 'Asiento no asignado'}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {(!item.assignedTo?.length && !item.passengers?.length) && (
                                    <span className="text-xs text-muted italic mr-2">Sin asignación</span>
                                  )}
                                </div>

                                <div className="flex gap-2 justify-end mt-auto pt-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openScheduleModal(item); }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border border-border hover:hover:bg-primary/10 flex items-center gap-1 transition-colors ${item.isAutoGenerated ? 'opacity-50 cursor-not-allowed' : 'text-gray-300 hover:text-text'}`}
                                    disabled={item.isAutoGenerated}
                                  >
                                    <Pencil size={14} /> Editar
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteScheduleItem(item.id); }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border border-border hover:bg-red-500/10 hover:border-red-500/20 text-gray-300 hover:text-red-400 flex items-center gap-1 transition-colors ${item.isAutoGenerated ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={item.isAutoGenerated}
                                  >
                                    <Trash2 size={14} /> Eliminar
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div >
          )}

          {/* Crew List Tab Content (Full View) */}
          {
            activeTab === 'crew' && (
              <div className="col-span-12">
                <div className="bg-surface rounded-2xl border border-border p-6 shadow-lg shadow-black/20">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-text flex items-center gap-2">
                        <Users size={20} className="text-primary" /> Crew List del Evento
                      </h3>
                      <p className="text-sm text-muted">Personal asignado a {projectData.city}</p>
                    </div>
                    <div className="flex gap-3">
                      <button className="flex items-center gap-2 px-3 py-2 bg-primary/5 hover:hover:bg-primary/10 text-text text-sm font-bold rounded-lg transition-colors border border-border">
                        <ClipboardList size={16} /> Call Sheet
                      </button>
                      <button
                        onClick={() => setIsContactSearchOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-blue-600 text-text text-sm font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                      >
                        <Plus size={16} /> Añadir Miembro
                      </button>
                    </div>
                  </div>

                  {/* Department Filters */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
                    {['Todos', 'Producción', 'Técnico', 'Artístico', 'Local'].map(dept => (
                      <button key={dept} className="px-4 py-1.5 rounded-full bg-primary/5 text-muted text-xs font-bold border border-border whitespace-nowrap hover:text-text hover:hover:bg-primary/10 transition-colors focus:bg-primary/20 focus:text-primary focus:border-primary/30">
                        {dept}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    {(() => {
                      const deptOrder = ['Artístico', 'Producción', 'Técnico', 'Logística', 'Gestión', 'Otros'];

                      const grouped = eventCrew.reduce((acc, contact) => {
                        const team = contact.team || contact.department || 'Otros';
                        if (!acc[team]) acc[team] = [];
                        acc[team].push(contact);
                        return acc;
                      }, {} as Record<string, typeof eventCrew>);

                      const sortedKeys = Object.keys(grouped).sort((a, b) => {
                        const idxA = deptOrder.indexOf(a);
                        const idxB = deptOrder.indexOf(b);
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        if (idxA !== -1) return -1;
                        if (idxB !== -1) return 1;
                        return a.localeCompare(b);
                      });

                      if (eventCrew.length === 0) {
                        return (
                          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted border border-dashed border-border rounded-xl">
                            <Users size={32} className="mb-3 opacity-50" />
                            <p className="text-sm">No hay personal asignado a este evento.</p>
                          </div>
                        );
                      }

                      return sortedKeys.map(team => (
                        <div key={team} className="animate-in fade-in duration-300">
                          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 mb-2 border-b border-border">
                            <h4 className="text-xs font-bold text-muted uppercase tracking-wider px-1">{team}</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {grouped[team].map(contact => (
                              <div key={contact.id} className="group bg-background border border-border rounded-xl p-4 hover:border-primary/50 transition-all hover:-translate-y-1 relative">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/5" />
                                    <div>
                                      <h4 className="font-bold text-text text-sm">{contact.name}</h4>
                                      <p className="text-xs text-primary font-medium">{contact.role}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditContactModal(contact)} className="text-muted hover:text-text p-1.5 rounded-lg hover:hover:bg-primary/10 transition-colors">
                                      <Pencil size={14} />
                                    </button>
                                    <button onClick={() => handleRemoveEventCrew(contact.id)} className="text-muted hover:text-red-400 p-1.5 rounded-lg hover:hover:bg-primary/10 transition-colors">
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-1.5 mb-3">
                                  <div className="flex items-center gap-2 text-xs text-muted">
                                    <Mail size={12} /> <span className="truncate">{contact.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted">
                                    <Phone size={12} /> <span>{contact.phone}</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-border">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-primary/5 px-2 py-0.5 rounded">
                                    {contact.department || 'General'}
                                  </span>
                                  {contact.eventIds?.includes(liveEvent?.id) ? (
                                    <span className="text-[10px] text-green-500 font-bold flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                                      <CheckCircle size={10} /> Confirmado
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                      <Globe size={10} /> Gira
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )
          }

        </div >
      </main >
    </div >
  );
};

export default VenueDetails;
import React, { useState } from 'react';
import {
  ArrowLeft, MoreHorizontal, PlaneTakeoff, Share2, MapPin, Star,
  Navigation, MessageSquare, BedDouble, Plus, Search, Sparkles, X,
  Calendar, DollarSign, Clock, Users, Building2, ChevronDown, ChevronUp, Plane, Bus, Train,
  Upload, FileText, Check, Activity, Save, Phone, Mail, Key, Copy, Pencil, Trash2, User
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";
import { useTour } from '../context/TourContext';
import { TransportItem, LodgingItem, Passenger, RoomingEntry, Event } from '../types';
import CreatableSelect from '../components/CreatableSelect';

// Data Sets
const AIRPORTS = ['MAD (Madrid)', 'LHR (London Heathrow)', 'JFK (New York)', 'CDG (Paris)', 'BCN (Barcelona)', 'LAX (Los Angeles)', 'DXB (Dubai)'];
const AIRLINES = ['Iberia', 'British Airways', 'Air France', 'Delta', 'Emirates', 'Lufthansa', 'Ryanair', 'Vueling'];
const HOTEL_NAMES = ['The Standard', 'Hilton', 'Marriott', 'W Hotel', 'Ritz Carlton', 'Ibis', 'Novotel'];

// RoomingEntry imported from types

const Logistics: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    transportList, lodgingList, manualSchedule, contacts, venues, tourCrew, notes, events,
    addTransport, updateTransport, deleteTransport,
    addLodging, updateLodging, deleteLodging,
    addScheduleItem, updateScheduleItem, deleteScheduleItem,
    addContact, updateContact, deleteContact,
    addVenue, updateVenue, deleteVenue,
    addTourCrew, removeTourCrew,
    addNote, updateNote, deleteNote, addNoteReply,
    createEvent, updateEvent, deleteEvent,
    documents, addDocument, updateDocument, deleteDocument
  } = useTour();
  const eventData: Event | undefined = location.state?.eventData;
  const tourData = location.state?.tourData;
  const eventId = eventData?.id;

  // Helper to parser date string (Deduplicated logic - ideally move to utils)
  const parseDateString = (dateStr: string) => {
    if (!dateStr) return null;
    const monthMap: Record<string, number> = {
      'ene': 0, 'enero': 0, 'jan': 0, 'feb': 1, 'febrero': 1, 'mar': 2, 'marzo': 2,
      'abr': 3, 'abril': 3, 'apr': 3, 'may': 4, 'mayo': 4, 'jun': 5, 'junio': 5,
      'jul': 6, 'julio': 6, 'ago': 7, 'agosto': 7, 'aug': 7, 'sep': 8, 'septiembre': 8, 'set': 8,
      'oct': 9, 'octubre': 9, 'nov': 10, 'noviembre': 10, 'dic': 11, 'diciembre': 11, 'dec': 11
    };
    const cleanStr = dateStr.toLowerCase().replace(/,/g, '').replace(/\./g, '').trim();
    const parts = cleanStr.split(/[\s-]+/);
    if (parts.length >= 3) {
      let day = -1, month = -1, year = -1;
      if (parts[0].length === 4 && !isNaN(Number(parts[0]))) { // YYYY-MM-DD
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else if (parts[2].length === 4) { // DD MMM YYYY
        day = Number(parts[0]);
        year = Number(parts[2]);
        const monthPart = parts[1];
        let found = monthMap[monthPart];
        if (found === undefined) {
          const key = Object.keys(monthMap).find(k => monthPart.startsWith(k));
          if (key) found = monthMap[key];
        }
        if (found !== undefined) month = found;
        return new Date(year, month, day);
      }
    }
    return null;
  };

  // Filter lists by current event
  const filteredTransport = transportList.filter(t => t.eventId === eventId);
  const filteredLodging = lodgingList.filter(l => l.eventId === eventId);

  const [activeTab, setActiveTab] = useState<'transport' | 'lodging'>(location.state?.section || 'transport');

  // Expand States
  const [expandedTransportId, setExpandedTransportId] = useState<string | null>(null);
  const [expandedLodgingId, setExpandedLodgingId] = useState<string | null>(null);

  // Passenger Adding State
  const [addingPassengerTo, setAddingPassengerTo] = useState<string | null>(null);
  const [newPassengerData, setNewPassengerData] = useState({ name: '', role: '', seat: '' });
  const [editingPassengerId, setEditingPassengerId] = useState<string | null>(null);

  // AI Prompt State (Replaces individual search fields)
  const [aiPrompt, setAiPrompt] = useState('');

  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  // Flight Search State
  const [flightSearch, setFlightSearch] = useState('');
  const [isFlightSearching, setIsFlightSearching] = useState(false);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'transport' | 'lodging'>('transport');

  // Rooming List Management State
  const [roomingList, setRoomingList] = useState<RoomingEntry[]>([]);
  const [isRoomingModalOpen, setIsRoomingModalOpen] = useState(false);
  const [editingRoomingItem, setEditingRoomingItem] = useState<RoomingEntry | null>(null);
  const [roomingFormData, setRoomingFormData] = useState<Partial<RoomingEntry>>({});

  // Manual Form States
  const [manualTransport, setManualTransport] = useState<Partial<TransportItem>>({
    origin: '', destination: '', provider: '', number: '', departureTime: '', arrivalTime: '', type: 'flight'
  });
  const [editingTransportId, setEditingTransportId] = useState<string | null>(null);
  const [editingLodgingId, setEditingLodgingId] = useState<string | null>(null);
  const [manualLodging, setManualLodging] = useState<Partial<LodgingItem>>({
    name: '', address: '', rooms: 0, checkIn: '', checkOut: '', checkInDate: '', checkOutDate: ''
  });

  // Derived Options for Selects
  const crewOptions = contacts.map(c => c.name);

  const toggleExpand = (id: string) => {
    setExpandedTransportId(prev => prev === id ? null : id);
    if (expandedTransportId === id) setAddingPassengerTo(null);
  };

  const toggleLodgingExpand = (id: string) => {
    if (expandedLodgingId === id) {
      setExpandedLodgingId(null);
      setRoomingList([]);
    } else {
      setExpandedLodgingId(id);
      const lodging = lodgingList.find(l => l.id === id);
      if (lodging && lodging.roomingList) {
        setRoomingList(lodging.roomingList);
      } else {
        setRoomingList([]);
      }
    }
  };

  const handleTicketUpload = (transportId: string, passengerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const item = transportList.find(t => t.id === transportId);
      if (item && item.passengers) {
        const updatedPassengers = item.passengers.map(p =>
          p.id === passengerId ? { ...p, ticketUrl: file.name, status: 'Confirmed' as const } : p
        );
        updateTransport({ ...item, passengers: updatedPassengers });
      }
    }
  };

  const handleSavePassenger = () => {
    if (!addingPassengerTo) return;

    const transportItem = transportList.find(t => t.id === addingPassengerTo);
    if (transportItem) {
      if (editingPassengerId) {
        // Edit existing passenger
        const updatedPassengers = (transportItem.passengers || []).map(p =>
          p.id === editingPassengerId ? { ...p, ...newPassengerData } : p
        );
        updateTransport({ ...transportItem, passengers: updatedPassengers });
      } else {
        // Add new passenger
        const newPassenger: Passenger = {
          id: Date.now().toString(),
          name: newPassengerData.name || 'Nuevo Pasajero',
          role: newPassengerData.role || 'Crew',
          seat: newPassengerData.seat || 'TBD',
          status: 'Confirmed',
          avatar: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000) + 1500000000}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80`
        };
        const updatedPassengers = [...(transportItem.passengers || []), newPassenger];
        updateTransport({ ...transportItem, passengers: updatedPassengers });
      }

      setAddingPassengerTo(null);
      setEditingPassengerId(null);
      setNewPassengerData({ name: '', role: '', seat: '' });
    }
  };

  const handleDeletePassenger = (transportId: string, passengerId: string) => {
    if (confirm('¿Eliminar viajero de la lista?')) {
      const item = transportList.find(t => t.id === transportId);
      if (item && item.passengers) {
        const updatedPassengers = item.passengers.filter(p => p.id !== passengerId);
        updateTransport({ ...item, passengers: updatedPassengers });
      }
    }
  };

  // --- Rooming List Handlers ---
  const handleOpenRoomingModal = (entry?: RoomingEntry) => {
    if (entry) {
      setEditingRoomingItem(entry);
      setRoomingFormData(entry);
    } else {
      setEditingRoomingItem(null);
      setRoomingFormData({ room: '', guest: '', type: 'Single', status: 'Pending', floor: '' });
    }
    setIsRoomingModalOpen(true);
  };

  const handleSaveRoomingEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoomingItem) {
      // Edit
      // Edit
      const updatedList = roomingList.map(item => item.id === editingRoomingItem.id ? { ...item, ...roomingFormData } as RoomingEntry : item);
      setRoomingList(updatedList);

      if (expandedLodgingId) {
        const currentLodging = lodgingList.find(l => l.id === expandedLodgingId);
        if (currentLodging) {
          updateLodging({ ...currentLodging, roomingList: updatedList });
        }
      }
    } else {
      // Create
      const newEntry: RoomingEntry = {
        id: Date.now().toString(),
        room: roomingFormData.room || 'TBD',
        guest: roomingFormData.guest || 'Nuevo Huésped',
        type: roomingFormData.type || 'Single',
        status: (roomingFormData.status as any) || 'Pending',
        floor: roomingFormData.floor || '1'
      };

      const updatedList = [...roomingList, newEntry];
      setRoomingList(updatedList);

      // Verify expandedLodgingId and update context
      if (expandedLodgingId) {
        const currentLodging = lodgingList.find(l => l.id === expandedLodgingId);
        if (currentLodging) {
          updateLodging({ ...currentLodging, roomingList: updatedList });
        }
      }
    }
    setIsRoomingModalOpen(false);
  };

  const handleDeleteRoomingEntry = (id: string) => {
    if (confirm('¿Eliminar a este huésped de la lista?')) {
      const updatedList = roomingList.filter(item => item.id !== id);
      setRoomingList(updatedList);

      if (expandedLodgingId) {
        const currentLodging = lodgingList.find(l => l.id === expandedLodgingId);
        if (currentLodging) {
          updateLodging({ ...currentLodging, roomingList: updatedList });
        }
      }
    }
  };

  // --- Flight Search Handler ---
  const handleFlightLookup = async () => {
    if (!flightSearch) return;
    setIsFlightSearching(true);

    // SIMULATION: Mock Flight Data API
    // In a real app, this would fetch from an API like AviationStack or Amadeus
    setTimeout(() => {
      const code = flightSearch.substring(0, 2).toUpperCase();
      const number = flightSearch.substring(2);

      let provider = 'Unknown Airline';
      let origin = 'MAD';
      let destination = 'LHR';
      let duration = '2h 30m';
      let depTime = '10:00';
      let arrTime = '11:30'; // Time diff included

      // Generate plausible mock data based on airline code
      switch (code) {
        case 'IB':
          provider = 'Iberia';
          origin = 'MAD (Madrid)';
          destination = 'MEX (Mexico City)';
          duration = '12h 05m';
          depTime = '13:00';
          arrTime = '18:05';
          break;
        case 'BA':
          provider = 'British Airways';
          origin = 'LHR (London)';
          destination = 'JFK (New York)';
          duration = '8h 15m';
          depTime = '18:30';
          arrTime = '21:45';
          break;
        case 'AA':
          provider = 'American Airlines';
          origin = 'JFK (New York)';
          destination = 'LAX (Los Angeles)';
          duration = '6h 30m';
          depTime = '08:00';
          arrTime = '11:30';
          break;
        case 'AF':
          provider = 'Air France';
          origin = 'CDG (Paris)';
          destination = 'EZE (Buenos Aires)';
          duration = '13h 45m';
          depTime = '23:00';
          arrTime = '08:45';
          break;
        case 'EK':
          provider = 'Emirates';
          origin = 'DXB (Dubai)';
          destination = 'LHR (London)';
          duration = '7h 50m';
          depTime = '07:45';
          arrTime = '11:35';
          break;
        case 'FR':
          provider = 'Ryanair';
          origin = 'STN (London)';
          destination = 'DUB (Dublin)';
          duration = '1h 15m';
          depTime = '06:30';
          arrTime = '07:45';
          break;
        default:
          provider = 'Airline ' + code;
      }

      // Randomize times slightly for "realism" if repeat searching same code
      if (Math.random() > 0.5) {
        const hour = Math.floor(Math.random() * 23);
        const min = Math.floor(Math.random() * 59);
        depTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        arrTime = `${(hour + 4) % 24}:00`; // Dummy duration logic
      }

      const newItem: TransportItem = {
        id: Date.now().toString(),
        eventId: eventId,
        type: 'flight',
        provider: provider,
        number: flightSearch.toUpperCase(), // User input fully
        origin: origin,
        destination: destination,
        departureTime: depTime,
        arrivalTime: arrTime,
        duration: duration,
        status: 'Scheduled',
        price: 'Calculating...'
      };

      addTransport(newItem);
      setFlightSearch('');
      setIsFlightSearching(false);

    }, 1500); // Simulate network delay
  };

  // --- AI Handler ---
  const handleAiSearch = async (type: 'transport' | 'lodging') => {
    setIsAiLoading(type);
    setAiSuggestions([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      let finalPrompt = "";
      let schema = null;

      if (type === 'transport') {
        finalPrompt = aiPrompt
          ? `Basado en esta petición: "${aiPrompt}", busca 3 opciones de vuelo.`
          : `Busca las 3 mejores opciones de vuelo para la gira actual. Prioriza rutas directas.`;

        schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              provider: { type: Type.STRING },
              number: { type: Type.STRING },
              origin: { type: Type.STRING },
              destination: { type: Type.STRING },
              departureTime: { type: Type.STRING },
              arrivalTime: { type: Type.STRING },
              duration: { type: Type.STRING },
              price: { type: Type.STRING },
              reason: { type: Type.STRING, description: "Why is this good for the tour?" }
            }
          }
        };
      } else {
        finalPrompt = aiPrompt
          ? `Basado en esta petición: "${aiPrompt}", busca 3 opciones de hoteles.`
          : `Busca 3 opciones de hoteles adecuados para grupos grandes (music crew).`;

        schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              address: { type: Type.STRING },
              stars: { type: Type.NUMBER },
              price: { type: Type.STRING },
              reason: { type: Type.STRING, description: "Why is this hotel good?" }
            }
          }
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: finalPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const text = response.text;
      if (text) {
        setAiSuggestions(JSON.parse(text));
      }

    } catch (error) {
      console.error("Error AI:", error);
      alert("Hubo un error consultando a la IA. Verifica tu API Key.");
    } finally {
      setIsAiLoading(null);
    }
  };

  const addSuggestion = (item: any, type: 'transport' | 'lodging') => {
    if (type === 'transport') {
      const newItem: TransportItem = {
        id: Date.now().toString(),
        eventId: eventId,
        type: 'flight',
        provider: item.provider,
        number: item.number,
        origin: item.origin || 'Origen',
        destination: item.destination || 'Destino',
        departureTime: item.departureTime,
        arrivalTime: item.arrivalTime,
        duration: item.duration,
        status: 'Scheduled',
        price: item.price
      };
      addTransport(newItem);
    } else {
      const newItem: LodgingItem = {
        id: Date.now().toString(),
        eventId: eventId,
        name: item.name,
        address: item.address,
        checkIn: '15:00',
        checkOut: '11:00',
        stars: item.stars,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        price: item.price,
        rooms: 10 // Default
      };
      addLodging(newItem);
    }
    setAiSuggestions(prev => prev.filter(i => i !== item));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType === 'transport') {
      const newItem: TransportItem = {
        id: editingTransportId || Date.now().toString(),
        eventId: eventId,
        type: manualTransport.type || 'flight',
        provider: manualTransport.provider || 'N/A',
        number: manualTransport.number || 'N/A',
        origin: manualTransport.origin || 'N/A',
        destination: manualTransport.destination || 'N/A',
        departureTime: manualTransport.departureTime || '00:00',
        arrivalTime: manualTransport.arrivalTime || '00:00',
        duration: 'Calculated',
        status: manualTransport.status || 'Scheduled',
        price: manualTransport.price
      };

      if (editingTransportId) {
        updateTransport(newItem);
      } else {
        addTransport(newItem);
      }
    } else {
      if (manualLodging.checkInDate && manualLodging.checkOutDate && manualLodging.checkOutDate < manualLodging.checkInDate) {
        alert('La fecha de salida (Check Out) no puede ser anterior a la de entrada (Check In).');
        return;
      }

      const lodgingData: LodgingItem = {
        id: editingLodgingId || Date.now().toString(),
        eventId: eventId,
        name: manualLodging.name || 'Hotel',
        address: manualLodging.address || '',
        checkIn: manualLodging.checkIn || '15:00',
        checkInDate: manualLodging.checkInDate,
        checkOut: manualLodging.checkOut || '11:00',
        checkOutDate: manualLodging.checkOutDate,
        stars: 4,
        image: manualLodging.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        rooms: manualLodging.rooms || 1,
        roomingList: manualLodging.roomingList || [] // Preserve rooming list if editing
      };

      if (editingLodgingId) {
        updateLodging(lodgingData);
      } else {
        addLodging(lodgingData);
      }
    }
    setIsModalOpen(false);
    setEditingLodgingId(null);
    setEditingTransportId(null);
    // Reset form for both types
    setManualTransport({ origin: '', destination: '', provider: '', number: '', departureTime: '', arrivalTime: '', type: 'flight' });
    setManualLodging({ name: '', address: '', rooms: 0, checkIn: '', checkOut: '', checkInDate: '', checkOutDate: '' });
  };

  // --- Render Modal Form (Transport/Lodging) ---
  return (
    <div className="flex flex-col h-full bg-background min-h-screen pb-24 md:pb-8 relative">
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-in zoom-in duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
            >
              <X size={24} />
            </button>

            <h2 className="text-xl font-bold text-white mb-6">
              {modalType === 'transport' ? (editingTransportId ? 'Editar Transporte' : 'Añadir Transporte Manual') : (editingLodgingId ? 'Editar Alojamiento' : 'Añadir Alojamiento Manual')}
            </h2>

            <form className="space-y-4" onSubmit={handleManualSubmit}>
              {modalType === 'transport' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tipo de Transporte</label>
                      <div className="flex bg-[#0c0c1a] p-1 rounded-xl border border-white/10">
                        <button
                          type="button"
                          onClick={() => setManualTransport({ ...manualTransport, type: 'flight' })}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${manualTransport.type === 'flight' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                          <Plane size={16} /> Vuelo
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualTransport({ ...manualTransport, type: 'train' })}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${manualTransport.type === 'train' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                          <Train size={16} /> Tren
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualTransport({ ...manualTransport, type: 'bus' })}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${manualTransport.type === 'bus' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                          <Bus size={16} /> Bus
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase text-gray-500">Nº de {manualTransport.type === 'flight' ? 'Vuelo' : manualTransport.type === 'train' ? 'Tren' : 'Bus'}</label>
                      <input type="text" placeholder={manualTransport.type === 'flight' ? "IB6800" : manualTransport.type === 'train' ? "AVE 0312" : "ALSA 123"} value={manualTransport.number} onChange={e => setManualTransport({ ...manualTransport, number: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <CreatableSelect
                      label="Origen"
                      value={manualTransport.origin || ''}
                      onChange={(val) => setManualTransport({ ...manualTransport, origin: val })}
                      options={AIRPORTS}
                      placeholder="e.g. MAD"
                      icon={<PlaneTakeoff size={16} />}
                      required
                    />
                    <CreatableSelect
                      label="Destino"
                      value={manualTransport.destination || ''}
                      onChange={(val) => setManualTransport({ ...manualTransport, destination: val })}
                      options={AIRPORTS}
                      placeholder="e.g. JFK"
                      icon={<PlaneTakeoff size={16} />}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <CreatableSelect
                      label="Proveedor"
                      value={manualTransport.provider || ''}
                      onChange={(val) => setManualTransport({ ...manualTransport, provider: val })}
                      options={AIRLINES}
                      placeholder="e.g. Iberia"
                      icon={<PlaneTakeoff size={16} />}
                    />
                    <div className="hidden"></div> {/* Hidden shim to keep grid alignment if needed, or remove if not */}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Salida</label>
                      <input required type="datetime-local" value={manualTransport.departureTime} onChange={e => setManualTransport({ ...manualTransport, departureTime: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Llegada</label>
                      <input required type="datetime-local" value={manualTransport.arrivalTime} onChange={e => setManualTransport({ ...manualTransport, arrivalTime: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary [color-scheme:dark]" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <CreatableSelect
                    label="Nombre del Hotel"
                    value={manualLodging.name || ''}
                    onChange={(val) => setManualLodging({ ...manualLodging, name: val })}
                    options={HOTEL_NAMES}
                    placeholder="e.g. The Standard"
                    icon={<Building2 size={16} />}
                    required
                  />
                  <input type="text" placeholder="Dirección" value={manualLodging.address} onChange={e => setManualLodging({ ...manualLodging, address: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Habitaciones" value={manualLodging.rooms} onChange={e => setManualLodging({ ...manualLodging, rooms: parseInt(e.target.value) })} className="bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Check In (Fecha)</label>
                      <input type="date" value={manualLodging.checkInDate || ''} onChange={e => setManualLodging({ ...manualLodging, checkInDate: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Check Out (Fecha)</label>
                      <input type="date" value={manualLodging.checkOutDate || ''} onChange={e => setManualLodging({ ...manualLodging, checkOutDate: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary [color-scheme:dark]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Check In (Hora)</label>
                      <input type="time" value={manualLodging.checkIn} onChange={e => setManualLodging({ ...manualLodging, checkIn: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Check Out (Hora)</label>
                      <input type="time" value={manualLodging.checkOut} onChange={e => setManualLodging({ ...manualLodging, checkOut: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary [color-scheme:dark]" />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-colors mt-4">
                Guardar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- ROOMING LIST MODAL --- */}
      {isRoomingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in zoom-in duration-200">
            <button onClick={() => setIsRoomingModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
            <h2 className="text-xl font-bold text-white mb-6">
              {editingRoomingItem ? 'Editar Huésped' : 'Añadir Huésped'}
            </h2>

            <form onSubmit={handleSaveRoomingEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Habitación</label>
                  <input type="text" value={roomingFormData.room} onChange={e => setRoomingFormData({ ...roomingFormData, room: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" placeholder="ej. 301" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Piso</label>
                  <input type="text" value={roomingFormData.floor} onChange={e => setRoomingFormData({ ...roomingFormData, floor: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary" placeholder="ej. 3" />
                </div>
              </div>
              <div>
                <CreatableSelect
                  label="Nombre Huésped"
                  value={roomingFormData.guest || ''}
                  onChange={(val) => setRoomingFormData({ ...roomingFormData, guest: val })}
                  options={crewOptions}
                  placeholder="Seleccionar o escribir nombre"
                  icon={<User size={16} />}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tipo</label>
                  <select value={roomingFormData.type} onChange={e => setRoomingFormData({ ...roomingFormData, type: e.target.value })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary">
                    <option value="Single">Individual</option>
                    <option value="Double">Doble</option>
                    <option value="Twin">Twin</option>
                    <option value="Suite">Suite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                  <select value={roomingFormData.status} onChange={e => setRoomingFormData({ ...roomingFormData, status: e.target.value as any })} className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary">
                    <option value="Pending">Pendiente</option>
                    <option value="In House">In House</option>
                    <option value="Checked Out">Checked Out</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2">
                <Save size={18} /> Guardar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Top App Bar */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-white/5 md:static md:bg-transparent md:border-none">
        <div className="flex items-center justify-between p-4 px-6 md:pt-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (location.state?.eventData) {
                  navigate('/venue', {
                    state: {
                      eventData: location.state.eventData,
                      tourData: location.state.tourData,
                      tab: 'horarios'
                    }
                  });
                } else {
                  navigate(-1);
                }
              }}
              className="flex w-10 h-10 shrink-0 items-center justify-center rounded-full hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-white/10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold leading-tight tracking-tight">{eventData?.title || 'Logística General'}</h2>
              <p className="text-xs text-gray-400">{eventData ? `${eventData.location} • ${eventData.dateRange}` : 'Detalles de la gira'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold text-red-500 uppercase tracking-wide">En Vivo</span>
          </div>
        </div>

        {/* Event Tabs */}
        <div className="flex items-center gap-8 px-6 border-b border-white/5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => navigate('/venue', { state: { eventData, tourData, tab: 'resumen' } })}
            className="py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors border-b-2 border-transparent hover:border-white/10 whitespace-nowrap"
          >
            Resumen
          </button>
          <button
            onClick={() => navigate('/venue', { state: { eventData, tourData, tab: 'horarios' } })}
            className="py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors border-b-2 border-transparent hover:border-white/10 whitespace-nowrap">
            Horarios
          </button>
          <button
            onClick={() => setActiveTab('transport')}
            className={`py-3 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'transport' ? 'text-white border-primary' : 'text-gray-400 hover:text-white border-transparent hover:border-white/10'}`}
          >
            Transporte
          </button>
          <button
            onClick={() => setActiveTab('lodging')}
            className={`py-3 text-sm font-bold transition-colors border-b-2 whitespace-nowrap ${activeTab === 'lodging' ? 'text-white border-primary' : 'text-gray-400 hover:text-white border-transparent hover:border-white/10'}`}
          >
            Hospedaje
          </button>
          <button
            onClick={() => navigate('/venue', { state: { eventData, tourData, tab: 'crew' } })}
            className="py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors border-b-2 border-transparent hover:border-white/10 whitespace-nowrap">
            Crew List
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-7xl mx-auto w-full">

          {/* --- TRANSPORT SECTION --- */}
          {activeTab === 'transport' && (
            <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PlaneTakeoff size={20} className="text-primary" />
                  Transporte
                </h3>
                <button
                  onClick={() => {
                    setModalType('transport');
                    setEditingTransportId(null);
                    setManualTransport({ origin: '', destination: '', provider: '', number: '', departureTime: '', arrivalTime: '', type: 'flight' });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                >
                  <Plus size={14} /> Añadir Manual
                </button>
              </div>

              {/* Flight Search By Number */}
              <div className="bg-[#0c0c1a]/50 p-6 rounded-2xl border border-white/5 mb-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-primary">
                  <PlaneTakeoff size={100} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <h4 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                      <Search size={18} className="text-primary" /> Buscador de Vuelo
                    </h4>
                    <p className="text-sm text-gray-400 mb-3">
                      Introduce el número de vuelo (ej. <strong>IB6800</strong>, <strong>BA249</strong>) para autocompletar la información.
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <PlaneTakeoff size={16} className="text-gray-500" />
                        </div>
                        <input
                          type="text"
                          value={flightSearch}
                          onChange={(e) => setFlightSearch(e.target.value.toUpperCase())}
                          placeholder="Nº Vuelo (ej. IB6403)"
                          className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-primary transition-colors placeholder-gray-600 font-mono tracking-wider "
                          onKeyDown={(e) => e.key === 'Enter' && handleFlightLookup()}
                        />
                      </div>
                      <button
                        onClick={handleFlightLookup}
                        disabled={!flightSearch || isFlightSearching}
                        className="bg-primary hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 flex items-center gap-2"
                      >
                        {isFlightSearching ? <span className="animate-spin">⌛</span> : 'Buscar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Natural Language Search - Transport */}
              <div className="bg-gradient-to-r from-blue-900/20 to-primary/10 rounded-2xl border border-primary/20 p-6 relative overflow-hidden group mb-4">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Sparkles size={120} />
                </div>
                <div className="relative z-10">
                  <h4 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                    <Sparkles size={18} className="text-primary" /> Asistente de Viaje IA
                  </h4>
                  <p className="text-sm text-gray-400 mb-4 max-w-xl">
                    Describe tu necesidad (ej. "Vuelos directos de Madrid a Londres mañana para 5 personas") y la IA encontrará las mejores opciones.
                  </p>
                  <div className="flex gap-2 bg-[#0c0c1a] p-1.5 rounded-xl border border-white/10 focus-within:border-primary/50 transition-colors">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Ej: Vuelos a Londres para el equipo técnico..."
                      className="flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder-gray-600"
                      onKeyDown={(e) => e.key === 'Enter' && handleAiSearch('transport')}
                    />
                    <button
                      onClick={() => handleAiSearch('transport')}
                      disabled={isAiLoading === 'transport'}
                      className="bg-primary hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isAiLoading === 'transport' ? <span className="animate-spin">⌛</span> : <><Sparkles size={14} /> Buscar con IA</>}
                    </button>
                  </div>

                  {/* AI Suggestions Results */}
                  {aiSuggestions.length > 0 && isAiLoading !== 'transport' && !aiSuggestions[0].name && (
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                      <p className="text-xs font-bold text-gray-400 uppercase">Sugerencias encontradas</p>
                      {aiSuggestions.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#0c0c1a]/50 p-3 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-sm">{item.provider} • {item.departureTime}</span>
                            <span className="text-xs text-gray-400">{item.origin} → {item.destination}</span>
                            <span className="text-[10px] text-primary mt-1">{item.reason}</span>
                          </div>
                          <button
                            onClick={() => addSuggestion(item, 'transport')}
                            className="bg-white/5 hover:bg-green-500/20 hover:text-green-500 text-gray-400 p-2 rounded-lg transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Existing Transport List */}
              {filteredTransport.map((item) => (
                <div key={item.id} className="group relative overflow-hidden rounded-2xl bg-surface shadow-lg shadow-black/20 border border-white/5 transition-all hover:border-white/10">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20">
                          {item.type === 'train' ? <Train size={24} /> : item.type === 'bus' ? <Bus size={24} /> : <Plane size={24} />}
                        </div>
                        <div>
                          <p className="font-bold text-white text-lg">{item.type === 'flight' ? 'Vuelo' : item.type === 'train' ? 'Tren' : 'Autobús'} {item.number}</p>
                          <p className="text-sm text-secondary">{item.provider}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${item.status === 'On Time' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-8 relative">
                      <div className="text-left z-10">
                        <p className="text-3xl font-bold text-white">{item.origin}</p>
                        <p className="text-base font-semibold mt-2 text-primary">{item.departureTime}</p>
                      </div>

                      <div className="flex-1 flex flex-col items-center px-6 relative -top-3">
                        <div className="w-full h-[2px] bg-gray-700 relative">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gray-600"></div>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20 shadow-[0_0_10px_rgba(19,19,236,0.5)]"></div>
                          <div className="absolute left-[70%] top-1/2 -translate-y-1/2 bg-primary p-1.5 rounded-full text-white transform rotate-90 shadow-lg">
                            {item.type === 'train' ? <Train size={14} fill="currentColor" className="-rotate-90" /> : item.type === 'bus' ? <Bus size={14} fill="currentColor" className="-rotate-90" /> : <Plane size={14} fill="currentColor" />}
                          </div>
                        </div>
                        <p className="text-xs text-secondary mt-3 font-medium bg-surface px-2">{item.duration}</p>
                      </div>

                      <div className="text-right z-10">
                        <p className="text-3xl font-bold text-white">{item.destination}</p>
                        <p className="text-base font-semibold mt-2 text-gray-400">{item.arrivalTime}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-auto">
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className={`flex-1 flex items-center justify-center gap-2 h-11 text-sm font-bold rounded-xl transition-all shadow-lg ${expandedTransportId === item.id
                          ? 'bg-white/10 text-white'
                          : 'bg-primary hover:bg-blue-600 text-white shadow-blue-900/20'
                          }`}
                      >
                        {expandedTransportId === item.id ? (
                          <>Cerrar Detalles <ChevronUp size={16} /></>
                        ) : (
                          <>Ver Detalles <ChevronDown size={16} /></>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setManualTransport({
                            ...item,
                            // Prefix with date if missing so input shows time
                            departureTime: item.departureTime.includes('T') ? item.departureTime : `${today}T${item.departureTime}`,
                            arrivalTime: item.arrivalTime.includes('T') ? item.arrivalTime : `${today}T${item.arrivalTime}`
                          });
                          setEditingTransportId(item.id);
                          setModalType('transport');
                          setIsModalOpen(true);
                        }}
                        className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#232348] text-secondary hover:text-white hover:bg-white/10 transition-colors border border-white/5"
                      >
                        <Pencil size={20} />
                      </button>
                      <button className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#232348] text-secondary hover:text-white hover:bg-white/10 transition-colors border border-white/5">
                        <Share2 size={20} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar este transporte?')) {
                            deleteTransport(item.id);
                          }
                        }}
                        className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#232348] text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors border border-white/5"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details Section */}
                  {expandedTransportId === item.id && (
                    <div className="border-t border-white/10 bg-[#0c0c1a] animate-in slide-in-from-top-4 duration-300">
                      <div className="p-6">

                        {/* 1. Tracking en Tiempo Real (Inline Preview) */}
                        <div className="mb-6 bg-surface p-4 rounded-xl border border-white/5 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/transport/${item.id}`)}>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 justify-between">
                            <span className="flex items-center gap-2"><Activity size={14} /> Tracking en Tiempo Real</span>
                            <span className="text-[10px] text-primary">Ver Mapa Completo →</span>
                          </h4>
                          {/* Progress Bar Visual */}
                          <div className="relative pt-6 pb-2">
                            <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-primary shadow-[0_0_10px_#1313ec]" style={{ width: '65%' }}></div>
                            </div>
                            {/* Plane Icon */}
                            <div className="absolute top-1/2 -translate-y-1/2" style={{ left: '65%' }}>
                              <div className="bg-primary p-1.5 rounded-full shadow-lg border-2 border-[#0c0c1a] transform rotate-90 relative z-10">
                                <PlaneTakeoff size={12} className="text-white" />
                              </div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary/30 rounded-full animate-ping"></div>
                            </div>
                            <div className="flex justify-between mt-3 text-[10px] text-gray-400 font-mono uppercase">
                              <span>{item.origin} • Salida</span>
                              <span className="text-green-400 font-bold bg-green-500/10 px-2 rounded">En Tránsito • 2h 15m rest.</span>
                              <span>{item.destination} • Llegada</span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Cronograma (Timeline Horizontal) */}
                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Clock size={14} /> Cronograma
                          </h4>
                          <div className="flex items-center gap-4 text-sm bg-surface p-4 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                            <div className="flex flex-col min-w-[80px]">
                              <span className="text-gray-500 text-[10px] uppercase font-bold">08:00 AM</span>
                              <span className="font-bold text-white text-xs">Check-In</span>
                            </div>
                            <div className="w-6 h-px bg-gray-600 shrink-0"></div>
                            <div className="flex flex-col min-w-[80px]">
                              <span className="text-gray-500 text-[10px] uppercase font-bold">{item.departureTime}</span>
                              <span className="font-bold text-white text-xs">Salida</span>
                            </div>
                            <div className="w-6 h-px bg-primary shadow-[0_0_5px_#1313ec] shrink-0"></div>
                            <div className="flex flex-col min-w-[80px] items-center">
                              <span className="text-primary text-[10px] font-bold uppercase animate-pulse">En Curso</span>
                              <span className="font-bold text-primary text-xs">Vuelo</span>
                            </div>
                            <div className="w-6 h-px bg-gray-600 shrink-0"></div>
                            <div className="flex flex-col min-w-[80px]">
                              <span className="text-gray-500 text-[10px] uppercase font-bold">{item.arrivalTime}</span>
                              <span className="font-bold text-white text-xs">Llegada</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Crew List */}
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Users size={16} /> Lista de Viajeros ({item.passengers?.length || 0})
                        </h4>

                        <div className="space-y-3">
                          {!item.passengers || item.passengers.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No hay pasajeros asignados.</p>
                          ) : (
                            item.passengers.map(passenger => (
                              <div key={passenger.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface p-3 rounded-xl border border-white/5 gap-3">
                                <div className="flex items-center gap-3">
                                  <img src={passenger.avatar} alt={passenger.name} className="w-10 h-10 rounded-full object-cover" />
                                  <div>
                                    <p className="font-bold text-white text-sm">{passenger.name}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">{passenger.role}</span>
                                      <span className="text-xs text-gray-400">Asiento: <span className="text-white font-bold">{passenger.seat}</span></span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 mr-4">
                                  <button
                                    onClick={() => {
                                      setAddingPassengerTo(item.id);
                                      setEditingPassengerId(passenger.id);
                                      setNewPassengerData({
                                        name: passenger.name,
                                        role: passenger.role,
                                        seat: passenger.seat
                                      });
                                    }}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePassenger(item.id, passenger.id)}
                                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-auto">
                                  {passenger.ticketUrl ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                                      <Check size={14} className="text-green-500" />
                                      <span className="text-xs font-bold text-green-500">Billete Subido</span>
                                      <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{passenger.ticketUrl}</span>
                                    </div>
                                  ) : (
                                    <label className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-colors group">
                                      <Upload size={14} className="text-gray-400 group-hover:text-white" />
                                      <span className="text-xs font-bold text-gray-400 group-hover:text-white">Subir Billete (PDF)</span>
                                      <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        onChange={(e) => handleTicketUpload(item.id, passenger.id, e)}
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>
                            ))
                          )}

                          {/* Add Passenger Section */}
                          {addingPassengerTo === item.id ? (
                            <div className="mt-4 bg-surface p-4 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                              <div className="flex justify-between items-center mb-3">
                                <h5 className="text-xs font-bold text-white uppercase">{editingPassengerId ? 'Editar Viajero' : 'Nuevo Viajero'}</h5>
                                <button onClick={() => {
                                  setAddingPassengerTo(null);
                                  setEditingPassengerId(null);
                                  setNewPassengerData({ name: '', role: '', seat: '' });
                                }} className="text-gray-500 hover:text-white"><X size={16} /></button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                <CreatableSelect
                                  label="Nombre Completo"
                                  value={newPassengerData.name}
                                  onChange={(val) => {
                                    const contact = contacts.find(c => c.name === val);
                                    if (contact) {
                                      setNewPassengerData({
                                        ...newPassengerData,
                                        name: val,
                                        role: contact.role
                                      });
                                    } else {
                                      setNewPassengerData({ ...newPassengerData, name: val });
                                    }
                                  }}
                                  options={crewOptions}
                                  placeholder="Seleccionar o escribir"
                                  icon={<User size={16} />}
                                />
                                <input
                                  type="text"
                                  placeholder="Rol (ej. Técnico)"
                                  value={newPassengerData.role}
                                  onChange={e => setNewPassengerData({ ...newPassengerData, role: e.target.value })}
                                  className="bg-[#0c0c1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary placeholder-gray-600"
                                />
                                <input
                                  type="text"
                                  placeholder="Asiento (ej. 12B)"
                                  value={newPassengerData.seat}
                                  onChange={e => setNewPassengerData({ ...newPassengerData, seat: e.target.value })}
                                  className="bg-[#0c0c1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary placeholder-gray-600"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setAddingPassengerTo(null)} className="px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors">Cancelar</button>
                                <button
                                  onClick={handleSavePassenger}
                                  disabled={!newPassengerData.name}
                                  className="px-4 py-2 bg-primary hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Save size={14} /> Guardar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingPassengerTo(item.id)}
                              className="mt-4 w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-400 text-xs font-bold hover:text-white hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                            >
                              <Plus size={16} /> Añadir Viajero
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* --- LODGING SECTION --- */}
          {activeTab === 'lodging' && (
            <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BedDouble size={20} className="text-primary" />
                  Alojamiento
                </h3>
                <button
                  onClick={() => {
                    setModalType('lodging');
                    setEditingLodgingId(null);

                    // Pre-fill dates based on Event Date
                    let defaultCheckIn = '';
                    let defaultCheckOut = '';
                    if (eventData?.dateRange) {
                      const dateObj = parseDateString(eventData.dateRange);
                      if (dateObj && dateObj.getFullYear() > 2000) { // Valid date check
                        // Set Check-In (Event Date)
                        const dIn = dateObj;
                        defaultCheckIn = dIn.toISOString().split('T')[0];

                        // Set Check-Out (Event Date + 1 Day)
                        const dOut = new Date(dIn);
                        dOut.setDate(dOut.getDate() + 1);
                        defaultCheckOut = dOut.toISOString().split('T')[0];
                      }
                    }

                    setManualLodging({
                      name: '', address: '', rooms: 0,
                      checkIn: '15:00', checkOut: '11:00',
                      checkInDate: defaultCheckIn, checkOutDate: defaultCheckOut
                    });
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                >
                  <Plus size={14} /> Añadir Manual
                </button>
              </div>

              {/* AI Natural Language Search - Lodging */}
              <div className="bg-gradient-to-r from-purple-900/20 to-primary/10 rounded-2xl border border-primary/20 p-6 relative overflow-hidden group mb-4">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Sparkles size={120} />
                </div>
                <div className="relative z-10">
                  <h4 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-400" /> Asistente de Hotel IA
                  </h4>
                  <p className="text-sm text-gray-400 mb-4 max-w-xl">
                    Encuentra el hotel perfecto para tu equipo. Ej. "Hotel de 4 estrellas cerca del O2 Arena para 20 personas".
                  </p>
                  <div className="flex gap-2 bg-[#0c0c1a] p-1.5 rounded-xl border border-white/10 focus-within:border-purple-500/50 transition-colors">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Describe el hotel, habitaciones y fechas..."
                      className="flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder-gray-600"
                      onKeyDown={(e) => e.key === 'Enter' && handleAiSearch('lodging')}
                    />
                    <button
                      onClick={() => handleAiSearch('lodging')}
                      disabled={isAiLoading === 'lodging'}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isAiLoading === 'lodging' ? <span className="animate-spin">⌛</span> : <><Sparkles size={14} /> Buscar</>}
                    </button>
                  </div>

                  {/* AI Suggestions Results */}
                  {aiSuggestions.length > 0 && isAiLoading !== 'lodging' && aiSuggestions[0].name && (
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                      <p className="text-xs font-bold text-gray-400 uppercase">Hoteles Recomendados</p>
                      {aiSuggestions.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#0c0c1a]/50 p-3 rounded-xl border border-white/5 hover:border-primary/50 transition-colors">
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-sm">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Star size={10} className="text-yellow-400" /> {item.stars}</span>
                              <span className="text-xs text-gray-400">• {item.price}</span>
                            </div>
                            <span className="text-[10px] text-primary mt-1 truncate max-w-[200px]">{item.reason}</span>
                          </div>
                          <button
                            onClick={() => addSuggestion(item, 'lodging')}
                            className="bg-white/5 hover:bg-green-500/20 hover:text-green-500 text-gray-400 p-2 rounded-lg transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Existing Lodging List */}
              {filteredLodging.map((item) => (
                <div key={item.id} className="rounded-2xl bg-surface shadow-lg shadow-black/20 border border-white/5 overflow-hidden flex flex-col hover:border-white/10 transition-colors">
                  <div className="h-48 w-full bg-cover bg-center relative group" style={{ backgroundImage: `url("${item.image}")` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <span className="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/10">
                        {item.rooms} Habs.
                      </span>
                    </div>
                    <div className="absolute bottom-5 left-5 text-white">
                      <h4 className="text-2xl font-bold mb-1">{item.name}</h4>
                      <p className="text-sm text-gray-200 flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2 py-1 rounded-lg w-fit">
                        <Star size={14} fill="currentColor" className="text-yellow-400" />
                        <span className="font-medium">{item.stars}</span>
                        <span className="text-white/50">•</span>
                        <span>Hotel</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col gap-6 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="mt-1 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                          <MapPin className="text-secondary" size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-secondary leading-relaxed font-medium">
                            {item.address}
                          </p>
                          <div className="flex gap-4 mt-2">
                            <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={12} /> +44 20 3301 0330</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1"><Mail size={12} /> reception@standardlondon.com</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setManualLodging(item);
                          setEditingLodgingId(item.id);
                          setModalType('lodging');
                          setIsModalOpen(true);
                        }}
                        className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-surface border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Pencil size={20} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar este alojamiento?')) {
                            deleteLodging(item.id);
                          }
                        }}
                        className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-surface border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20">
                        <Navigation size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-white/5 w-full"></div>

                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-xs text-secondary font-bold uppercase tracking-wider mb-1">Entrada</p>
                      <p className="text-xl font-bold text-white">{item.checkIn}</p>
                      {item.checkInDate && <p className="text-xs text-gray-400 mt-1">{item.checkInDate}</p>}
                    </div>
                    <div className="w-px h-10 bg-white/5"></div>
                    <div className="text-right">
                      <p className="text-xs text-secondary font-bold uppercase tracking-wider mb-1">Salida</p>
                      <p className="text-xl font-bold text-white">{item.checkOut}</p>
                      {item.checkOutDate && <p className="text-xs text-gray-400 mt-1">{item.checkOutDate}</p>}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleLodgingExpand(item.id)}
                    className={`w-full flex items-center justify-center gap-2 h-11 text-sm font-bold rounded-xl transition-all shadow-lg mt-2 ${expandedLodgingId === item.id
                      ? 'bg-white/10 text-white'
                      : 'bg-primary hover:bg-blue-600 text-white shadow-blue-900/20'
                      }`}
                  >
                    {expandedLodgingId === item.id ? (
                      <>Cerrar Detalles <ChevronUp size={16} /></>
                    ) : (
                      <>Ver Rooming List <ChevronDown size={16} /></>
                    )}
                  </button>

                  {/* Expanded Lodging Details */}
                  {expandedLodgingId === item.id && (
                    <div className="border-t border-white/10 pt-6 mt-2 animate-in slide-in-from-top-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                          <Key size={16} /> Rooming List ({roomingList.length} Habs)
                        </h4>
                        <button
                          onClick={() => handleOpenRoomingModal()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors border border-primary/20"
                        >
                          <Plus size={14} /> Añadir Huésped
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-white/5">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-[#0c0c1a] text-gray-500 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="p-3">Hab.</th>
                              <th className="p-3">Huésped</th>
                              <th className="p-3">Tipo</th>
                              <th className="p-3 text-right">Estado</th>
                              <th className="p-3 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 bg-surface">
                            {roomingList.map((room, idx) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                <td className="p-3 font-mono font-bold text-primary">{room.room}</td>
                                <td className="p-3 font-medium text-white">{room.guest}</td>
                                <td className="p-3 text-gray-400 text-xs">{room.type}</td>
                                <td className="p-3 text-right">
                                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${room.status === 'In House' ? 'bg-green-500/10 text-green-500' :
                                    room.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                      'bg-gray-500/10 text-gray-500'
                                    }`}>
                                    {room.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleOpenRoomingModal(room)}
                                      className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRoomingEntry(room.id)}
                                      className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <button className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                          <Copy size={12} /> Copiar lista
                        </button>
                        <button className="text-xs text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-lg">
                          Descargar PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

        </div>
      </main >

      <div className="fixed bottom-24 right-6 z-40 md:hidden">
        <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg hover:scale-105 transition-transform">
          <MessageSquare size={24} />
        </button>
      </div>
    </div >
  );
};

export default Logistics;
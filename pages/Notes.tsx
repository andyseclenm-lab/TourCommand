import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, Pencil, Save, X, Pin, Clock, Tag, AlertTriangle, User, Users, Calendar, Check, MessageCircle, Send, CheckCircle, Circle, MoreHorizontal } from 'lucide-react';
import { useTour } from '../context/TourContext';
import { useAuth } from '../context/AuthContext';
import { Note, NoteReply } from '../types';
import CreatableSelect from '../components/CreatableSelect';

const URGENCY_LEVELS = ['Normal', 'Urgente', 'Crítico'] as const;
const DEPARTMENTS = ['Producción', 'Técnico', 'Promoción', 'Logística', 'Artístico', 'Hospitality', 'Seguridad'];

const Notes: React.FC = () => {
    const navigate = useNavigate();
    const { notes, addNote, updateNote, deleteNote, events, contacts, addNoteReply } = useTour();
    const { user } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterUrgency, setFilterUrgency] = useState<string>('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Partial<Note>>({});
    const [newReply, setNewReply] = useState('');

    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterUrgency === 'All' || note.urgency === filterUrgency;
        return matchesSearch && matchesFilter;
    });

    // Sort notes
    const sortNotes = (notesList: Note[]) => {
        return [...notesList].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            const urgencyScore = { 'Crítico': 3, 'Urgente': 2, 'Normal': 1 };
            return urgencyScore[b.urgency] - urgencyScore[a.urgency];
        });
    };

    const openNotes = sortNotes(filteredNotes.filter(n => n.status === 'Open'));
    const doneNotes = sortNotes(filteredNotes.filter(n => n.status === 'Done'));

    const handleOpenModal = (note?: Note) => {
        setNewReply('');
        if (note) {
            setEditingNote({ ...note });
        } else {
            setEditingNote({
                title: '',
                content: '',
                urgency: 'Normal',
                taggedType: 'None',
                pinned: false,
                associatedEventId: '',
                status: 'Open'
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingNote.title) return;

        const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

        if (editingNote.id) {
            updateNote({ ...editingNote, date: dateStr } as Note);
        } else {
            addNote({
                id: Date.now(),
                title: editingNote.title,
                content: editingNote.content || '',
                urgency: editingNote.urgency || 'Normal',
                status: 'Open',
                taggedType: editingNote.taggedType || 'None',
                taggedId: editingNote.taggedId,
                associatedEventId: editingNote.associatedEventId,
                pinned: editingNote.pinned || false,
                date: dateStr,
                replies: []
            });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: number | string) => {
        if (confirm('¿Eliminar esta tarea?')) deleteNote(id);
    };

    const handleToggleStatus = (note: Note) => {
        updateNote({ ...note, status: note.status === 'Open' ? 'Done' : 'Open' });
    };

    const handleSendReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReply.trim() || !editingNote.id) return;

        const reply: NoteReply = {
            id: Date.now().toString(),
            author: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario',
            avatar: user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
            content: newReply,
            date: 'Justo ahora'
        };

        addNoteReply(editingNote.id, reply);
        setEditingNote(prev => ({ ...prev, replies: [...(prev.replies || []), reply] }));
        setNewReply('');
    };

    // Helper to collect avatars for the card (Tagged Person + Reply Authors)
    const getNoteParticipants = (note: Note) => {
        const participants = new Map<string, string>();

        // Add Tagged Person if applicable
        if (note.taggedType === 'Person' && note.taggedId) {
            const contact = contacts.find(c => c.id === note.taggedId);
            if (contact) participants.set(contact.name, contact.avatar);
        }

        // Add Reply Authors
        note.replies?.forEach(r => participants.set(r.author, r.avatar));

        return Array.from(participants.entries()).slice(0, 3); // Max 3 avatars
    };

    const getEventName = (id?: string) => events.find(e => e.id === id)?.title;

    const NoteCard: React.FC<{ note: Note }> = ({ note }) => {
        const participants = getNoteParticipants(note);

        return (
            <div
                onClick={() => handleOpenModal(note)}
                className={`group relative bg-surface rounded-2xl p-5 border transition-all cursor-pointer flex flex-col gap-3 shadow-lg shadow-black/20 overflow-hidden ${note.status === 'Done'
                    ? 'border-white/5 opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'
                    : 'border-white/5 hover:border-primary/50 hover:-translate-y-1'
                    }`}
            >
                {/* Top Bar */}
                <div className="flex justify-between items-start">
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${note.urgency === 'Crítico' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                        note.urgency === 'Urgente' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                        {note.urgency}
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4 bg-surface/80 backdrop-blur-sm p-1 rounded-lg">
                        <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(note); }} className={`p-1.5 rounded-md hover:bg-white/10 ${note.status === 'Done' ? 'text-green-500' : 'text-gray-400'}`}>
                            {note.status === 'Done' ? <CheckCircle size={16} /> : <Circle size={16} />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-md">
                            <Trash2 size={16} />
                        </button>
                    </div>
                    {note.pinned && <Pin size={16} className="text-white rotate-45 absolute right-5 top-5 group-hover:opacity-0 transition-opacity" fill="currentColor" />}
                </div>

                {/* Content */}
                <div>
                    {note.associatedEventId && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
                            <Calendar size={10} /> {getEventName(note.associatedEventId)}
                        </div>
                    )}
                    <h3 className={`font-bold text-base leading-tight mb-2 ${note.status === 'Done' ? 'text-gray-400 line-through' : 'text-white'}`}>
                        {note.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">{note.content}</p>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Avatars Stack */}
                        {participants.length > 0 && (
                            <div className="flex -space-x-2">
                                {participants.map(([name, src], i) => (
                                    <img key={i} src={src} alt={name} title={name} className="w-6 h-6 rounded-full border-2 border-surface object-cover" />
                                ))}
                            </div>
                        )}
                        {participants.length === 0 && (
                            <span className="text-[10px] text-gray-600 italic">Sin asignación</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={12} /> {note.date.split(',')[0]}</span>
                        {(note.replies?.length || 0) > 0 && (
                            <span className="flex items-center gap-1 text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-md">
                                <MessageCircle size={12} /> {note.replies?.length}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-background min-h-screen pb-24 md:pb-8 relative">

            {/* --- MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-surface border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl relative animate-in zoom-in duration-200 flex flex-col max-h-[90vh] overflow-hidden">

                        {/* Header */}
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#0c0c1a]">
                            <div className="flex flex-col">
                                <input
                                    type="text"
                                    value={editingNote.title}
                                    onChange={e => setEditingNote({ ...editingNote, title: e.target.value })}
                                    className="bg-transparent text-xl font-bold text-white outline-none placeholder-gray-600 w-full"
                                    placeholder="Título de la Tarea..."
                                />
                                <div className="flex items-center gap-2 mt-2">
                                    <select
                                        value={editingNote.urgency}
                                        onChange={(e) => setEditingNote({ ...editingNote, urgency: e.target.value as any })}
                                        className="bg-white/5 text-[10px] uppercase font-bold text-gray-400 rounded px-2 py-1 outline-none border border-white/5"
                                    >
                                        {URGENCY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    <div className="h-4 w-px bg-white/10"></div>
                                    <span className="text-xs text-gray-500">{editingNote.date || 'Hoy'}</span>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* Left: Content & Settings */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-white/5">

                                {/* Main Content */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descripción</label>
                                    <textarea
                                        value={editingNote.content}
                                        onChange={e => setEditingNote({ ...editingNote, content: e.target.value })}
                                        className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl p-4 text-white outline-none focus:border-primary placeholder-gray-600 min-h-[120px] resize-none text-sm leading-relaxed"
                                        placeholder="Escribe los detalles..."
                                    />
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Evento</label>
                                        <select
                                            value={editingNote.associatedEventId || ''}
                                            onChange={e => setEditingNote({ ...editingNote, associatedEventId: e.target.value })}
                                            className="w-full bg-[#0c0c1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                                        >
                                            <option value="">Ninguno</option>
                                            {events.map(ev => {
                                                // If it's a child event (like a concert in a city), find the parent tour name
                                                const parentEvent = ev.parent_id ? events.find(e => e.id === ev.parent_id) : null;
                                                const tourName = parentEvent ? parentEvent.title.toUpperCase() : ev.title.toUpperCase();
                                                const locationSuffix = ev.location ? ev.location.toUpperCase() : 'GLOBAL';
                                                const displayName = `${tourName}: ${locationSuffix}`;
                                                return <option key={ev.id} value={ev.id}>{displayName}</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Etiquetar</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={editingNote.taggedType}
                                                onChange={e => setEditingNote({ ...editingNote, taggedType: e.target.value as any, taggedId: undefined })}
                                                className="bg-[#0c0c1a] border border-white/10 rounded-lg px-2 py-2 text-sm text-white outline-none w-1/3"
                                            >
                                                <option value="None">-</option>
                                                <option value="Person">P</option>
                                                <option value="Group">G</option>
                                            </select>
                                            <select
                                                disabled={editingNote.taggedType === 'None'}
                                                value={editingNote.taggedId as string || ''}
                                                onChange={e => setEditingNote({ ...editingNote, taggedId: e.target.value })}
                                                className="bg-[#0c0c1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none flex-1 disabled:opacity-50"
                                            >
                                                <option value="">Seleccionar...</option>
                                                {editingNote.taggedType === 'Group' && DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                                {editingNote.taggedType === 'Person' && contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-between items-center">
                                    <button
                                        type="button"
                                        onClick={() => setEditingNote({ ...editingNote, pinned: !editingNote.pinned })}
                                        className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${editingNote.pinned ? 'text-primary bg-primary/10' : 'text-gray-500 hover:bg-white/5'}`}
                                    >
                                        <Pin size={14} className={editingNote.pinned ? 'fill-current' : ''} />
                                        {editingNote.pinned ? 'Fijado' : 'Fijar Tarea'}
                                    </button>
                                    <button onClick={handleSaveNote} className="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-xl transition-all text-sm flex items-center gap-2">
                                        <Save size={16} /> Guardar
                                    </button>
                                </div>
                            </div>

                            {/* Right: Chat Thread */}
                            {editingNote.id && (
                                <div className="w-full md:w-[320px] bg-[#0c0c1a] flex flex-col border-l border-white/5">
                                    <div className="p-4 border-b border-white/5 bg-white/5">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                            <MessageCircle size={14} /> Hilo de Actividad
                                        </h4>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {(!editingNote.replies || editingNote.replies.length === 0) ? (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                                <MessageCircle size={32} strokeWidth={1} />
                                                <p className="text-xs mt-2">No hay comentarios aún.</p>
                                            </div>
                                        ) : (
                                            editingNote.replies.map((reply) => {
                                                const isMe = reply.author === (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario');
                                                return (
                                                    <div key={reply.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                        <img src={reply.avatar} className="w-6 h-6 rounded-full object-cover mt-1" alt={reply.author} />
                                                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-surface border border-white/10 text-gray-300 rounded-tl-none'}`}>
                                                            {!isMe && <p className="text-[10px] font-bold text-gray-500 mb-1">{reply.author}</p>}
                                                            <p>{reply.content}</p>
                                                            <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-600'}`}>{reply.date}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Chat Input */}
                                    <div className="p-3 border-t border-white/5 bg-surface">
                                        <form onSubmit={handleSendReply} className="flex items-center gap-2 bg-[#0c0c1a] rounded-xl p-1 border border-white/10 focus-within:border-primary/50 transition-colors">
                                            <input
                                                type="text"
                                                value={newReply}
                                                onChange={(e) => setNewReply(e.target.value)}
                                                placeholder="Escribe un comentario..."
                                                className="flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder-gray-600"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newReply.trim()}
                                                className="bg-primary disabled:bg-gray-700 text-white p-2 rounded-lg transition-colors hover:bg-blue-600"
                                            >
                                                <Send size={14} />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-white/5 md:static md:bg-transparent md:border-none p-4 px-6 md:pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white leading-tight">Tablero de Tareas</h1>
                        <p className="text-sm text-gray-400">Gestiona pendientes y colabora en tiempo real.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="block w-full py-2.5 pl-10 pr-4 text-sm rounded-xl border border-white/5 bg-surface text-white focus:border-primary outline-none"
                                placeholder="Buscar..."
                            />
                        </div>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-colors whitespace-nowrap"
                        >
                            <Plus size={18} /> <span className="hidden sm:inline">Nueva Tarea</span>
                        </button>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-2">
                    {['All', ...URGENCY_LEVELS].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterUrgency(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${filterUrgency === cat
                                ? 'bg-white text-black border-white'
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {cat === 'All' ? 'Todas' : cat}
                        </button>
                    ))}
                </div>
            </header>

            {/* Kanban Board Layout */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
                <div className="flex h-full gap-6 min-w-[700px]">

                    {/* COLUMN: OPEN */}
                    <div className="flex-1 flex flex-col min-w-[320px] bg-[#0c0c1a]/30 rounded-3xl border border-white/5 p-2">
                        <div className="px-4 py-3 flex justify-between items-center sticky top-0 bg-transparent z-10 mb-2">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></span>
                                Pendientes
                            </h2>
                            <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{openNotes.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 px-2 pr-1 pb-2 scroll-smooth">
                            {openNotes.length > 0 ? (
                                openNotes.map(note => <NoteCard key={note.id} note={note} />)
                            ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-white/5 rounded-2xl m-2">
                                    <p className="text-sm">Todo al día</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMN: DONE */}
                    <div className="flex-1 flex flex-col min-w-[320px] bg-[#0c0c1a]/30 rounded-3xl border border-white/5 p-2">
                        <div className="px-4 py-3 flex justify-between items-center sticky top-0 bg-transparent z-10 mb-2">
                            <h2 className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                                Finalizadas
                            </h2>
                            <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{doneNotes.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 px-2 pr-1 pb-2 scroll-smooth">
                            {doneNotes.length > 0 ? (
                                doneNotes.map(note => <NoteCard key={note.id} note={note} />)
                            ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-white/5 rounded-2xl m-2">
                                    <p className="text-sm">Nada por aquí</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Notes;
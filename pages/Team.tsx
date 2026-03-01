import React, { useState } from 'react';
import {
  ArrowLeft, Search, Plus, Mail, Phone, MoreVertical,
  User, Briefcase, X, Save, Filter, MessageSquare, Pencil, Trash2, MapPin, Building2, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTour } from '../context/TourContext';
import { Contact } from '../types';
import CreatableSelect from '../components/CreatableSelect';

// Data Sets
const ROLES = ['Stage Manager', 'Sound Engineer', 'Lighting Designer', 'Tour Manager', 'Production Manager', 'Backliner', 'Driver', 'Catering', 'Rigger'];
const TEAMS = ['Producción', 'Técnico', 'Promoción', 'Logística', 'Artístico', 'Hospitality', 'Seguridad'];
const CITIES = ['Madrid', 'London', 'Paris', 'Berlin', 'New York', 'Los Angeles'];
const VENUES = ['Wizink Center', 'O2 Arena', 'Accor Arena', 'Madison Square Garden'];

const Team: React.FC = () => {
  const navigate = useNavigate();
  const { contacts, addContact, updateContact, deleteContact } = useTour();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'single' | 'group'>('single');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  // Contact Form State
  const [formData, setFormData] = useState<Partial<Contact>>({
    name: '',
    role: '',
    email: '',
    phone: '',
    team: 'Producción',
    avatar: '',
    city: '',
    associatedVenue: ''
  });

  const openModal = (contact?: Contact) => {
    setModalMode('single');
    if (contact) {
      setEditingId(contact.id);
      setFormData({
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        team: contact.team || contact.department || 'Producción',
        avatar: contact.avatar,
        city: contact.city,
        associatedVenue: contact.associatedVenue
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', role: '', email: '', phone: '', team: 'Producción', avatar: '', city: '', associatedVenue: '' });
    }
    setIsModalOpen(true);
  };

  const openGroupModal = () => {
    setModalMode('group');
    setSelectedContactIds([]);
    setGroupName('');
    setIsModalOpen(true);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || selectedContactIds.length === 0) return;

    // Iterate and update selected contacts
    for (const id of selectedContactIds) {
      const contact = contacts.find(c => c.id === id);
      if (contact) {
        // Update both team and department for compatibility
        const updatedContact = { ...contact, team: groupName, department: groupName };
        updateContact(updatedContact);
      }
    }

    setIsModalOpen(false);
    setGroupName('');
    setSelectedContactIds([]);
  };

  const toggleContactSelection = (id: string) => {
    setSelectedContactIds(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();

    // Assign a random avatar if none provided (simulated)
    const avatarUrl = formData.avatar || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000) + 1500000000}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80`;

    if (editingId) {
      const updatedContact: Contact = {
        id: editingId,
        name: formData.name || 'Sin Nombre',
        role: formData.role || 'Staff',
        email: formData.email || '',
        phone: formData.phone || '',
        team: formData.team,
        department: formData.team, // Keep backward compatibility for now
        avatar: avatarUrl,
        city: formData.city,
        associatedVenue: formData.associatedVenue
      };
      updateContact(updatedContact);
    } else {
      const newContact: Contact = {
        id: Date.now().toString(),
        name: formData.name || 'Sin Nombre',
        role: formData.role || 'Staff',
        email: formData.email || '',
        phone: formData.phone || '',
        team: formData.team,
        department: formData.team, // Keep backward compatibility
        avatar: avatarUrl,
        city: formData.city,
        associatedVenue: formData.associatedVenue
      };
      addContact(newContact);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este contacto? Esta acción no se puede deshacer.')) {
      deleteContact(id);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.team?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by Team
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    let team = contact.team || contact.department || 'Otros';

    // Normalization
    const upper = team.toUpperCase();
    if (upper.includes('ARTISTA')) team = 'Artístico';
    else if (upper.includes('PRODUCC')) team = 'Producción';
    else if (upper.includes('TECNICO') || upper.includes('TÉCNICO') || ['LUCES', 'SONIDO', 'AUDIO', 'ILUMINACION', 'BACKLINE'].some(k => upper.includes(k))) team = 'Técnico';
    else if (upper.includes('LOGIST')) team = 'Logística';
    else if (upper.includes('GESTION') || upper.includes('GESTIÓN')) team = 'Gestión';

    if (!acc[team]) acc[team] = [];
    acc[team].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  return (
    <div className="flex flex-col h-full bg-background min-h-screen pb-24 md:pb-8 relative">

      {/* --- ADD/EDIT MEMBER MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
                {modalMode === 'group' ? <Users size={32} /> : <User size={32} />}
              </div>
              <h2 className="text-xl font-bold text-white">
                {modalMode === 'group' ? 'Crear Nuevo Equipo' : editingId ? 'Editar Miembro' : 'Nuevo Miembro'}
              </h2>
              <p className="text-sm text-gray-400">
                {modalMode === 'group' ? 'Agrupa contactos en un nuevo equipo.' : editingId ? 'Modifica los datos del miembro.' : 'Añade una persona al equipo.'}
              </p>
            </div>

            {modalMode === 'group' ? (
              <div className="flex flex-col h-full space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre del Equipo</label>
                  <input
                    required
                    type="text"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary placeholder-gray-600 transition-colors"
                    placeholder="ej: Producción Técnica"
                  />
                </div>

                <div className="flex-1 overflow-y-auto max-h-[40vh] border border-white/5 rounded-xl p-2 bg-[#0c0c1a]">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Seleccionar Miembros</p>
                  <div className="space-y-1">
                    {contacts.map(c => (
                      <div
                        key={c.id}
                        onClick={() => toggleContactSelection(c.id)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${selectedContactIds.includes(c.id) ? 'bg-primary/20 border border-primary/50' : 'hover:bg-white/5 border border-transparent'}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedContactIds.includes(c.id) ? 'bg-primary border-primary' : 'border-gray-500'}`}>
                          {selectedContactIds.includes(c.id) && <Users size={10} className="text-white" />}
                        </div>
                        <img src={c.avatar} className="w-6 h-6 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{c.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{c.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName || selectedContactIds.length === 0}
                  className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Briefcase size={18} /> Crear Equipo ({selectedContactIds.length})
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveContact} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary placeholder-gray-600 transition-colors"
                    placeholder="ej: Ana García"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <CreatableSelect
                      label="Rol / Cargo"
                      value={formData.role || ''}
                      onChange={(val) => setFormData({ ...formData, role: val })}
                      options={ROLES}
                      placeholder="ej: Stage Mgr"
                      icon={<Briefcase size={16} />}
                      required
                    />
                  </div>
                  <div>
                    <CreatableSelect
                      label="Equipo / Dept."
                      value={formData.team || ''}
                      onChange={(val) => setFormData({ ...formData, team: val })}
                      options={TEAMS}
                      placeholder="ej: Producción"
                      icon={<Users size={16} />}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary placeholder-gray-600 transition-colors"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#0c0c1a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary placeholder-gray-600 transition-colors"
                    placeholder="+34 600 000 000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <CreatableSelect
                      label="Ciudad"
                      value={formData.city || ''}
                      onChange={(val) => setFormData({ ...formData, city: val })}
                      options={CITIES}
                      placeholder="Madrid"
                      icon={<MapPin size={16} />}
                    />
                  </div>
                  <div>
                    <CreatableSelect
                      label="Venue Asoc."
                      value={formData.associatedVenue || ''}
                      onChange={(val) => setFormData({ ...formData, associatedVenue: val })}
                      options={VENUES}
                      placeholder="Wizink"
                      icon={<Building2 size={16} />}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                    <Save size={18} /> {editingId ? 'Guardar Cambios' : 'Crear Miembro'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
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
              <h1 className="text-2xl font-bold text-white leading-tight">Equipos</h1>
              <p className="text-sm text-gray-400">Gestiona los equipos y personal.</p>
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
                placeholder="Buscar miembro o equipo..."
              />
            </div>
            <button
              onClick={openGroupModal}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border border-white/10 whitespace-nowrap"
            >
              <Briefcase size={18} />
              <span className="hidden sm:inline">Crear Equipo</span>
            </button>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-900/20 whitespace-nowrap"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Añadir</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- CONTENT --- */}
      <main className="flex-1 overflow-y-auto px-6 py-6">

        {(() => {
          const deptOrder = ['Artístico', 'Producción', 'Técnico', 'Logística', 'Gestión', 'Otros'];

          const sortedKeys = Object.keys(groupedContacts).sort((a, b) => {
            const idxA = deptOrder.indexOf(a);
            const idxB = deptOrder.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
          });

          if (sortedKeys.length > 0) {
            return sortedKeys.map((teamName) => {
              const teamMembers = groupedContacts[teamName];
              return (
                <div key={teamName} className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">{teamName}</h2>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400">{teamMembers.length}</span>
                    <div className="h-px bg-white/5 flex-1"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamMembers.map((contact) => (
                      <div key={contact.id} className="group bg-surface border border-white/5 rounded-2xl p-4 hover:border-primary/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/20">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-white/5" />
                            <div>
                              <h3 className="font-bold text-white text-base">{contact.name}</h3>
                              <p className="text-xs text-primary font-medium">{contact.role}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal(contact)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => handleDelete(contact.id)} className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-3 text-sm text-gray-400 bg-[#0c0c1a] p-2 rounded-lg border border-white/5">
                            <Mail size={14} />
                            <span className="truncate">{contact.email}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-400 bg-[#0c0c1a] p-2 rounded-lg border border-white/5">
                            <Phone size={14} />
                            <span>{contact.phone}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-1 rounded">
                            {contact.city || 'General'}
                          </span>
                          <div className="flex gap-2">
                            <button className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors">
                              <MessageSquare size={16} />
                            </button>
                            <button className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-colors">
                              <Phone size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          } else {
            return (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <User size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No se encontraron equipos</p>
                <p className="text-sm">Prueba con otra búsqueda o añade un nuevo miembro.</p>
              </div>
            );
          }
        })()}
      </main>
    </div>
  );
};

export default Team;
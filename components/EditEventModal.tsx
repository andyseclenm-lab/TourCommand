import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Event } from '../types';

interface EditEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedData: Partial<Event>) => Promise<void>;
    event: Event;
    title?: string;
}

const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, onSave, event, title = "Editar Evento" }) => {
    const [formData, setFormData] = useState({
        title: '',
        status: 'draft' as Event['status']
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                status: event.status
            });
        }
    }, [event]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({ ...event, ...formData });
            onClose();
        } catch (error) {
            console.error("Error saving event:", error);
            alert("Error al guardar cambios");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a2e] border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary outline-none"
                            placeholder="Nombre del evento"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estado</label>
                        <div className="flex bg-black/20 rounded-lg p-1 border border-white/10">
                            {(['draft', 'confirmed', 'completed'] as const).map(status => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status })}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${formData.status === status
                                        ? (status === 'confirmed' ? 'bg-green-500/20 text-green-500' : status === 'completed' ? 'bg-blue-500/20 text-blue-500' : 'bg-gray-500/20 text-gray-400')
                                        : 'text-gray-500 hover:text-white'
                                        }`}
                                >
                                    {status === 'draft' ? 'BORRADOR' : status === 'confirmed' ? 'CONFIRMADO' : 'COMPLETADO'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <Save size={16} />
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEventModal;

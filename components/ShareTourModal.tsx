import React, { useState, useEffect } from 'react';
import { X, Mail, Shield, ShieldAlert, ShieldCheck, UserMinus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTour } from '../context/TourContext';

interface ShareTourModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    tourName: string;
}

const ShareTourModal: React.FC<ShareTourModalProps> = ({ isOpen, onClose, eventId, tourName }) => {
    const { getUserRole, eventMembers, fetchEventMembers, updateMemberRole, removeMember } = useTour();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const userRole = getUserRole(eventId);
    const isAdmin = userRole === 'admin';

    useEffect(() => {
        if (isOpen && eventId) {
            fetchEventMembers(eventId);
        }
    }, [isOpen, eventId]);

    if (!isOpen) return null;

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { data, error } = await supabase.rpc('invite_user_to_event', {
                p_event_id: eventId,
                p_email: email,
                p_role: role
            });

            if (error) throw error;

            if (data && data.success) {
                if (!data.user_found) {
                    const { error: inviteError } = await supabase.functions.invoke('invite-user', {
                        body: { email, eventId, role }
                    });

                    if (inviteError) {
                        console.error('Error with edge function:', inviteError);
                        setSuccess(`Usuario añadido, pero hubo un problema enviando el email a ${email}.`);
                    } else {
                        setSuccess(`¡Invitación enviada por correo a ${email}!`);
                    }
                } else {
                    setSuccess(`¡Invitación enviada a ${email}! (Usuario existente)`);
                }

                setEmail('');
                fetchEventMembers(eventId); // Refresh the list
            }
        } catch (err: any) {
            console.error('Error sharing tour:', err);
            setError('Error al compartir. Asegúrate de tener permisos de administrador en esta gira.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (targetUserId: string, newRole: string) => {
        if (!isAdmin) return;
        try {
            await updateMemberRole(eventId, targetUserId, newRole);
            setSuccess('Rol actualizado correctamente');
            fetchEventMembers(eventId); // Refresh
        } catch (err: any) {
            setError(err.message || 'Error al actualizar el rol');
        }
    };

    const handleRemoveMember = async (targetUserId: string) => {
        if (!isAdmin) return;
        if (!confirm('¿Estás seguro de que deseas eliminar a este usuario de la gira?')) return;

        try {
            await removeMember(eventId, targetUserId);
            setSuccess('Usuario eliminado correctamente');
            fetchEventMembers(eventId); // Refresh
        } catch (err: any) {
            setError(err.message || 'Error al eliminar al usuario');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#12122b] rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white">Gestionar Accesos</h2>
                        <p className="text-sm text-gray-400 mt-1">{tourName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8">
                    {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-sm">{error}</div>}
                    {success && <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-500 text-sm">{success}</div>}

                    {/* Section 1: Invite New User */}
                    {isAdmin && (
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Invitar Colaborador</h3>
                            <form onSubmit={handleShare} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                            Correo Electrónico
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail size={16} className="text-gray-500" />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="colaborador@ejemplo.com"
                                                className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                            Rol Inicial
                                        </label>
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value as any)}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        >
                                            <option value="viewer">Lector (Solo ver)</option>
                                            <option value="editor">Editor (Ver y Editar)</option>
                                            <option value="admin">Admin (Control Total)</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-lg transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                    ) : (
                                        'Enviar Invitación'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Section 2: Active Members List */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Miembros Activos</h3>
                        {eventMembers.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4 bg-white/5 rounded-lg border border-white/10">No hay invitados en esta gira.</p>
                        ) : (
                            <div className="space-y-2">
                                {eventMembers.map((member) => (
                                    <div key={member.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                                                {member.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{member.email}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    {member.role === 'admin' && <ShieldAlert size={14} className="text-purple-500" />}
                                                    {member.role === 'editor' && <ShieldCheck size={14} className="text-blue-500" />}
                                                    {member.role === 'viewer' && <Shield size={14} className="text-gray-500" />}
                                                    <span className="text-xs text-gray-400 capitalize">{member.role}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {isAdmin && member.user_id && (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={member.role}
                                                    onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded text-sm text-white px-2 py-1.5 focus:border-primary outline-none"
                                                >
                                                    <option value="viewer">Lector</option>
                                                    <option value="editor">Editor</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                <button
                                                    onClick={() => handleRemoveMember(member.user_id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                    title="Eliminar usuario"
                                                >
                                                    <UserMinus size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareTourModal;

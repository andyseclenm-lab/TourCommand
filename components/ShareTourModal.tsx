import React, { useState } from 'react';
import { X, Mail, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ShareTourModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    tourName: string;
}

const ShareTourModal: React.FC<ShareTourModalProps> = ({ isOpen, onClose, eventId, tourName }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    if (!isOpen) return null;

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // First, try to add them via the database RPC (handles both registered and unregistered)
            const { data, error } = await supabase.rpc('invite_user_to_event', {
                p_event_id: eventId,
                p_email: email,
                p_role: role
            });

            if (error) throw error;

            if (data && data.success) {
                // If they are not registered yet, trigger the Supabase Edge Function to send an email
                if (!data.user_found) {
                    const { error: inviteError } = await supabase.functions.invoke('invite-user', {
                        body: { email, eventId, role }
                    });

                    if (inviteError) {
                        console.error('Error with edge function:', inviteError);
                        // We don't throw here to not block the UI. The user is in the DB but hasn't received the email.
                        setSuccess(`Usuario añadido, pero hubo un problema enviando el email a ${email}.`);
                    } else {
                        setSuccess(`¡Invitación enviada por correo a ${email}!`);
                    }
                } else {
                    // If they are registered, they already got an in-app notification via DB trigger
                    setSuccess(`¡Invitación enviada a ${email}! (Usuario existente)`);
                }

                setEmail('');
                setTimeout(() => onClose(), 2500);
            }
        } catch (err: any) {
            console.error('Error sharing tour:', err);
            setError('Error al compartir. Asegúrate de tener permisos de administrador en esta gira.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#12122b] rounded-xl border border-white/10 w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Compartir Gira</h2>
                        <p className="text-sm text-gray-400 mt-1">{tourName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-sm">{error}</div>}
                    {success && <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-500 text-sm">{success}</div>}

                    <form onSubmit={handleShare} className="space-y-4">
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
                                Permisos
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRole('viewer')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${role === 'viewer'
                                        ? 'bg-primary/20 border-primary text-white'
                                        : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'
                                        }`}
                                >
                                    <Shield size={20} className="mb-1" />
                                    <span className="text-xs font-medium">Lector</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('editor')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${role === 'editor'
                                        ? 'bg-blue-500/20 border-blue-500 text-white'
                                        : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'
                                        }`}
                                >
                                    <ShieldCheck size={20} className="mb-1" />
                                    <span className="text-xs font-medium">Editor</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('admin')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${role === 'admin'
                                        ? 'bg-purple-500/20 border-purple-500 text-white'
                                        : 'bg-black/20 border-white/10 text-gray-400 hover:border-white/30'
                                        }`}
                                >
                                    <ShieldAlert size={20} className="mb-1" />
                                    <span className="text-xs font-medium">Admin</span>
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                ) : (
                                    'Invitar a la Gira'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ShareTourModal;

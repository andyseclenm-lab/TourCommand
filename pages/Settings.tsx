import React, { useState } from 'react';
import {
    User, Shield, Bell, Globe, CreditCard, LogOut, Camera, Mail,
    Phone, MapPin, Lock, Smartphone, Check, ChevronRight, AlertTriangle, Palette
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences' | 'billing' | 'appearance'>('profile');

    const { user, signOut } = useAuth();
    const { themeMode, setThemeMode, customColors, updateCustomColor } = useTheme();

    // Real Data States
    const [profileData, setProfileData] = useState({
        name: user?.user_metadata?.full_name || '',
        role: user?.user_metadata?.role || '',
        email: user?.email || '',
        phone: user?.user_metadata?.phone || '',
        location: user?.user_metadata?.location || '',
        bio: user?.user_metadata?.bio || '',
        avatar_url: user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
    });

    // Update local state when user loads
    React.useEffect(() => {
        if (user) {
            setProfileData({
                name: user.user_metadata.full_name || '',
                role: user.user_metadata.role || '',
                email: user.email || '',
                phone: user.user_metadata.phone || '',
                location: user.user_metadata.location || '',
                bio: user.user_metadata.bio || '',
                avatar_url: user.user_metadata.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
            });
        }
    }, [user]);

    const [notifications, setNotifications] = useState({
        email_logistics: user?.user_metadata?.notifications?.email_logistics ?? true,
        email_marketing: user?.user_metadata?.notifications?.email_marketing ?? false,
        push_alerts: user?.user_metadata?.notifications?.push_alerts ?? true,
        push_chat: user?.user_metadata?.notifications?.push_chat ?? true,
        sms_urgent: user?.user_metadata?.notifications?.sms_urgent ?? true
    });

    const [preferences, setPreferences] = useState({
        language: user?.user_metadata?.preferences?.language || 'es',
        timezone: user?.user_metadata?.preferences?.timezone || 'cet',
        currency: user?.user_metadata?.preferences?.currency || 'eur',
        dateFormat: user?.user_metadata?.preferences?.dateFormat || 'dmy'
    });

    // Password State
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Update local state when user loads
    React.useEffect(() => {
        if (user) {
            // ... (existing profile logic)
            if (user.user_metadata?.notifications) {
                setNotifications(prev => ({ ...prev, ...user.user_metadata.notifications }));
            }
            if (user.user_metadata?.preferences) {
                setPreferences(prev => ({ ...prev, ...user.user_metadata.preferences }));
            }
        }
    }, [user]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const toggleNotification = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePreferencesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPreferences({ ...preferences, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            const btn = document.getElementById('save-btn');
            if (btn) {
                const originalText = btn.innerText;
                btn.innerText = 'Guardando...';

                const { error } = await supabase.auth.updateUser({
                    data: {
                        full_name: profileData.name,
                        role: profileData.role,
                        phone: profileData.phone,
                        location: profileData.location,
                        bio: profileData.bio,
                        avatar_url: profileData.avatar_url,
                        notifications: notifications,
                        preferences: preferences
                    }
                });

                if (error) throw error;

                btn.innerText = '¡Guardado!';
                setTimeout(() => btn.innerText = originalText, 2000);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error al guardar los cambios.');
        }
    };

    const handleUpdatePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            alert('Las contraseñas no coinciden.');
            return;
        }
        if (passwords.new.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({ password: passwords.new });
            if (error) throw error;
            alert('Contraseña actualizada correctamente.');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            console.error('Error updating password:', error);
            alert('Error al actualizar contraseña: ' + error.message);
        }
    };

    const handleResetData = async () => {
        try {
            const btn = document.querySelector('button.text-red-500');
            if (btn && btn instanceof HTMLElement) {
                const originalText = btn.innerText;
                btn.innerText = 'Borrando datos...';
                btn.setAttribute('disabled', 'true');
            }

            const userId = user?.id;
            if (!userId) {
                alert('No se pudo identificar el usuario.');
                return;
            }

            // Delete data from tables where user_id matches
            // Order matters for foreign keys if any, but simplified here
            await supabase.from('schedule_items').delete().eq('user_id', userId);
            await supabase.from('transport_items').delete().eq('user_id', userId); // added transport
            await supabase.from('lodging_items').delete().eq('user_id', userId); // added lodging
            await supabase.from('contacts').delete().eq('user_id', userId);
            await supabase.from('tours').delete().eq('user_id', userId);
            await supabase.from('venues').delete().eq('user_id', userId);
            await supabase.from('notes').delete().eq('user_id', userId);
            await supabase.from('events').delete().eq('user_id', userId); // added events

            alert('Datos borrados correctamente. Se recargará la página.');
            // Refresh page to clear local state / context
            window.location.reload();
        } catch (error) {
            console.error('Error resetting data:', error);
            alert('Hubo un error al borrar los datos.');
        }
    };

    const menuItems = [
        { id: 'profile', label: 'Mi Perfil', icon: <User size={18} /> },
        { id: 'security', label: 'Seguridad', icon: <Shield size={18} /> },
        { id: 'notifications', label: 'Notificaciones', icon: <Bell size={18} /> },
        { id: 'appearance', label: 'Apariencia', icon: <Palette size={18} /> },
        { id: 'preferences', label: 'Preferencias', icon: <Globe size={18} /> },
        { id: 'billing', label: 'Facturación', icon: <CreditCard size={18} /> },
    ];

    return (
        <div className="flex flex-col h-full bg-background min-h-screen">

            {/* Header */}
            <div className="p-6 border-b border-border sticky top-0 bg-background/95 backdrop-blur-md z-20">
                <h1 className="text-2xl font-bold text-text">Ajustes de Cuenta</h1>
                <p className="text-sm text-muted">Gestiona tu perfil y preferencias de la aplicación.</p>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

                {/* Sidebar Navigation */}
                <aside className="w-full lg:w-64 bg-surface/50 border-r border-border overflow-x-auto lg:overflow-visible">
                    <div className="flex lg:flex-col p-4 gap-2 min-w-max lg:min-w-0">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full lg:w-auto ${activeTab === item.id
                                    ? 'bg-primary text-text shadow-lg shadow-primary/20'
                                    : 'text-muted hover:text-text hover:bg-primary/5'
                                    }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                                {activeTab === item.id && <ChevronRight size={16} className="ml-auto hidden lg:block" />}
                            </button>
                        ))}

                        <div className="lg:mt-auto pt-4 border-t border-border hidden lg:block">
                            <button
                                onClick={async () => {
                                    /* Fixed logout missing signout bug */
                                    await signOut();
                                    navigate('/login');
                                }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 w-full transition-colors"
                            >
                                <LogOut size={18} />
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                        {/* --- PROFILE SECTION --- */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
                                    <div className="relative group cursor-pointer" onClick={() => {
                                        const newUrl = prompt("Introduce la URL de tu nuevo avatar:", profileData.avatar_url);
                                        if (newUrl) setProfileData({ ...profileData, avatar_url: newUrl });
                                    }}>
                                        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/5">
                                            <img src={profileData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={24} className="text-text" />
                                        </div>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h2 className="text-xl font-bold text-text">{profileData.name}</h2>
                                        <p className="text-muted text-sm">{profileData.role}</p>
                                        <button
                                            onClick={() => {
                                                const newUrl = prompt("Introduce la URL de tu nuevo avatar:", profileData.avatar_url);
                                                if (newUrl) setProfileData({ ...profileData, avatar_url: newUrl });
                                            }}
                                            className="mt-3 text-xs font-bold text-primary hover:text-text transition-colors bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20"
                                        >
                                            Cambiar Avatar
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={profileData.name}
                                                onChange={handleProfileChange}
                                                className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-text focus:border-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Rol / Cargo</label>
                                        <input
                                            type="text"
                                            name="role"
                                            value={profileData.role}
                                            onChange={handleProfileChange}
                                            className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-text focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico</label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={profileData.email}
                                                onChange={handleProfileChange}
                                                className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-text focus:border-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={profileData.phone}
                                                onChange={handleProfileChange}
                                                className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-text focus:border-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Ubicación</label>
                                        <div className="relative">
                                            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input
                                                type="text"
                                                name="location"
                                                value={profileData.location}
                                                onChange={handleProfileChange}
                                                className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-text focus:border-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Bio / Notas</label>
                                        <textarea
                                            name="bio"
                                            value={profileData.bio}
                                            onChange={handleProfileChange}
                                            rows={3}
                                            className="w-full bg-surface border border-border rounded-xl p-4 text-text focus:border-primary outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- SECURITY SECTION --- */}
                        {activeTab === 'security' && (
                            <div className="space-y-8">
                                <div className="bg-surface rounded-2xl p-6 border border-border">
                                    <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                                        <Lock size={18} className="text-primary" /> Contraseña
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="password"
                                                placeholder="Contraseña Actual (No requerida para admin)"
                                                value={passwords.current}
                                                onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                                className="bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="password"
                                                placeholder="Nueva Contraseña"
                                                value={passwords.new}
                                                onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                                className="bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary"
                                            />
                                            <input
                                                type="password"
                                                placeholder="Confirmar Contraseña"
                                                value={passwords.confirm}
                                                onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                                className="bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary"
                                            />
                                        </div>
                                        <button
                                            onClick={handleUpdatePassword}
                                            className="bg-white/5 hover:bg-white/10 text-text font-bold py-2.5 px-6 rounded-xl border border-border transition-colors text-sm"
                                        >
                                            Actualizar Contraseña
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-surface rounded-2xl p-6 border border-border">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-text flex items-center gap-2">
                                                <Smartphone size={18} className="text-primary" /> Autenticación en dos pasos (2FA)
                                            </h3>
                                            <p className="text-muted text-sm mt-1 max-w-md">Añade una capa extra de seguridad a tu cuenta requiriendo un código desde tu móvil.</p>
                                        </div>
                                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="toggle" id="toggle-2fa" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                                            <label htmlFor="toggle-2fa" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer"></label>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                                        <Check size={20} className="text-green-500" />
                                        <span className="text-green-400 text-sm font-bold">Tu cuenta está protegida.</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- NOTIFICATIONS SECTION --- */}
                        {activeTab === 'notifications' && (
                            <div className="bg-surface rounded-2xl p-0 border border-border overflow-hidden">
                                <div className="p-6 border-b border-border">
                                    <h3 className="text-lg font-bold text-text">Configuración de Alertas</h3>
                                    <p className="text-muted text-sm">Elige cómo y cuándo quieres que te contactemos.</p>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {[
                                        { id: 'email_logistics', title: 'Actualizaciones de Logística', desc: 'Cambios en vuelos, hoteles o transporte.', type: 'email' },
                                        { id: 'push_alerts', title: 'Alertas Urgentes', desc: 'Retrasos, cancelaciones o emergencias.', type: 'push' },
                                        { id: 'push_chat', title: 'Mensajes Directos', desc: 'Cuando alguien del equipo te envía un mensaje.', type: 'push' },
                                        { id: 'sms_urgent', title: 'SMS de Emergencia', desc: 'Solo para situaciones críticas el día del show.', type: 'sms' },
                                        { id: 'email_marketing', title: 'Novedades de Producto', desc: 'Noticias sobre nuevas funcionalidades.', type: 'email' },
                                    ].map((item) => (
                                        <div key={item.id} className="p-4 px-6 flex items-center justify-between hover:bg-primary/5 transition-colors">
                                            <div>
                                                <h4 className="text-text font-bold text-sm">{item.title}</h4>
                                                <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                                            </div>
                                            <button
                                                onClick={() => toggleNotification(item.id as any)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notifications[item.id as keyof typeof notifications] ? 'bg-primary' : 'bg-gray-700'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications[item.id as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- PREFERENCES SECTION --- */}
                        {activeTab === 'preferences' && (
                            <div className="space-y-6">
                                <div className="bg-surface rounded-2xl p-6 border border-border space-y-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-text mb-4">Regional</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Idioma</label>
                                                <select
                                                    name="language"
                                                    value={preferences.language}
                                                    onChange={handlePreferencesChange}
                                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary"
                                                >
                                                    <option value="es">Español (España)</option>
                                                    <option value="en">English (US)</option>
                                                    <option value="fr">Français</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Zona Horaria</label>
                                                <select
                                                    name="timezone"
                                                    value={preferences.timezone}
                                                    onChange={handlePreferencesChange}
                                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary"
                                                >
                                                    <option value="cet">Central European Time (CET)</option>
                                                    <option value="gmt">London (GMT)</option>
                                                    <option value="est">New York (EST)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Moneda</label>
                                                <select
                                                    name="currency"
                                                    value={preferences.currency}
                                                    onChange={handlePreferencesChange}
                                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary"
                                                >
                                                    <option value="eur">Euro (€)</option>
                                                    <option value="usd">USD ($)</option>
                                                    <option value="gbp">Pound (£)</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Formato Fecha</label>
                                                <select
                                                    name="dateFormat"
                                                    value={preferences.dateFormat}
                                                    onChange={handlePreferencesChange}
                                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-primary"
                                                >
                                                    <option value="dmy">DD/MM/AAAA</option>
                                                    <option value="mdy">MM/DD/AAAA</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- APPEARANCE SECTION --- */}
                        {activeTab === 'appearance' && (
                            <div className="space-y-8">
                                <div className="bg-surface rounded-2xl p-6 border border-border">
                                    <h3 className="text-lg font-bold text-text mb-4">Tema de Color</h3>
                                    <p className="text-muted text-sm mb-6">Elige un tema predefinido o personaliza los colores a tu gusto.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { id: 'default', name: 'Original', colors: ['#101022', '#1313ec'] },
                                            { id: 'light', name: 'Claro', colors: ['#f3f4f6', '#2563eb'] },
                                            { id: 'emerald', name: 'Esmeralda', colors: ['#022c22', '#10b981'] },
                                            { id: 'custom', name: 'Personalizado', colors: [customColors.background, customColors.primary] },
                                        ].map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setThemeMode(theme.id as any)}
                                                className={`relative p-4 rounded-xl border transition-all text-left group overflow-hidden ${themeMode === theme.id
                                                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                                    : 'border-border hover:border-white/30 bg-background'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="flex gap-1">
                                                        <div className="w-6 h-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: theme.colors[0] }}></div>
                                                        <div className="w-6 h-6 rounded-full border border-border shadow-sm -ml-2" style={{ backgroundColor: theme.colors[1] }}></div>
                                                    </div>
                                                    {themeMode === theme.id && <Check size={16} className="text-primary ml-auto" />}
                                                </div>
                                                <span className={`text-sm font-bold ${themeMode === theme.id ? 'text-primary' : 'text-muted group-hover:text-text'}`}>
                                                    {theme.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {themeMode === 'custom' && (
                                    <div className="bg-surface rounded-2xl p-6 border border-border animate-in fade-in slide-in-from-top-2 duration-300">
                                        <h3 className="text-lg font-bold text-text mb-4">Personalización Avanzada</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted uppercase">Color Principal (Botones/Acentos)</label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={customColors.primary}
                                                        onChange={(e) => updateCustomColor('primary', e.target.value)}
                                                        className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={customColors.primary}
                                                        onChange={(e) => updateCustomColor('primary', e.target.value)}
                                                        className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-text font-mono text-sm uppercase focus:border-primary outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted uppercase">Fondo de Pantalla</label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={customColors.background}
                                                        onChange={(e) => updateCustomColor('background', e.target.value)}
                                                        className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={customColors.background}
                                                        onChange={(e) => updateCustomColor('background', e.target.value)}
                                                        className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-text font-mono text-sm uppercase focus:border-primary outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted uppercase">Superficies (Tarjetas/Barras)</label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={customColors.surface}
                                                        onChange={(e) => updateCustomColor('surface', e.target.value)}
                                                        className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={customColors.surface}
                                                        onChange={(e) => updateCustomColor('surface', e.target.value)}
                                                        className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-text font-mono text-sm uppercase focus:border-primary outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted uppercase">Color Secundario</label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={customColors.secondary}
                                                        onChange={(e) => updateCustomColor('secondary', e.target.value)}
                                                        className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={customColors.secondary}
                                                        onChange={(e) => updateCustomColor('secondary', e.target.value)}
                                                        className="flex-1 bg-[#0c0c1a] border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm uppercase focus:border-primary outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- BILLING SECTION --- */}
                        {activeTab === 'billing' && (
                            <div className="space-y-6">
                                {/* Plan Card */}
                                <div className="bg-gradient-to-r from-primary to-blue-900 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div>
                                            <p className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-1">Plan Actual</p>
                                            <h3 className="text-3xl font-bold text-white mb-2">TourCommand Pro</h3>
                                            <p className="text-white/80 text-sm">Facturación anual • Próximo cobro: 15 Dic 2024</p>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                            <span className="text-white font-bold">Activo</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-surface rounded-2xl border border-white/5 p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">Método de Pago</h3>
                                    <div className="flex items-center justify-between p-4 bg-[#0c0c1a] rounded-xl border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/10 p-2 rounded-lg">
                                                <CreditCard className="text-white" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">•••• •••• •••• 4242</p>
                                                <p className="text-xs text-gray-500">Expira 12/25</p>
                                            </div>
                                        </div>
                                        <button className="text-xs font-bold text-primary hover:text-white transition-colors">Editar</button>
                                    </div>
                                    <button className="mt-4 w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-400 text-sm font-bold hover:text-white hover:bg-white/5 transition-all">
                                        + Añadir método de pago
                                    </button>
                                </div>

                                <div className="bg-surface rounded-2xl border border-white/5 p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">Historial de Facturas</h3>
                                    <div className="space-y-2">
                                        {[
                                            { date: '15 Nov 2023', amount: '€299.00', status: 'Pagado' },
                                            { date: '15 Oct 2023', amount: '€299.00', status: 'Pagado' },
                                            { date: '15 Sep 2023', amount: '€299.00', status: 'Pagado' },
                                        ].map((invoice, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white/5 rounded-full text-gray-400 group-hover:text-white">
                                                        <CreditCard size={14} />
                                                    </div>
                                                    <span className="text-sm text-gray-300 group-hover:text-white">{invoice.date}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-sm font-bold text-white">{invoice.amount}</span>
                                                    <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded border border-green-500/20">{invoice.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Bar */}
                        <div className="sticky bottom-6 flex justify-end gap-3 pt-6 border-t border-white/5 bg-background/80 backdrop-blur-md pb-4 lg:pb-0">
                            <button className="px-6 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                                Cancelar
                            </button>
                            <button
                                id="save-btn"
                                onClick={handleSave}
                                className="px-8 py-3 rounded-xl font-bold text-sm bg-primary text-white shadow-lg shadow-blue-900/20 hover:bg-blue-600 transition-all active:scale-95"
                            >
                                Guardar Cambios
                            </button>
                        </div>

                        {/* Danger Zone (Only on certain tabs) */}
                        {(activeTab === 'security' || activeTab === 'profile') && (
                            <div className="mt-12 p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
                                <h4 className="text-red-500 font-bold flex items-center gap-2 mb-2">
                                    <AlertTriangle size={18} /> Zona de Peligro
                                </h4>
                                <p className="text-gray-400 text-sm mb-4">
                                    Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate.
                                </p>
                                <button
                                    onClick={() => {
                                        if (window.confirm('¿Estás seguro de que quieres borrar TODOS tus datos (contactos, eventos, venues, etc)? Esta acción no se puede deshacer.')) {
                                            handleResetData();
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 rounded-lg text-xs font-bold transition-all"
                                >
                                    Eliminar Cuenta (Resetear Datos)
                                </button>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Check, Zap, ExternalLink, ShieldCheck } from 'lucide-react';

const Billing: React.FC = () => {
    const { session, subscriptionStatus, subscriptionPriceId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const PREMIUM_PLUS_PRICE_ID = 'price_1T5nC7DGpsNQLwf9sdUfl69b'; // Premium Plus (2€/month)

    const handleSubscribe = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    priceId: PREMIUM_PLUS_PRICE_ID,
                    success_url: window.location.origin + '/#/dashboard?checkout=success',
                    cancel_url: window.location.origin + '/#/billing?checkout=cancel'
                },
                headers: {
                    Authorization: `Bearer ${session?.access_token}`
                }
            });

            if (fnError) throw fnError;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No url returned from checkout session');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al iniciar el pago.');
        } finally {
            setLoading(false);
        }
    };

    const handleManageBilling = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fnError } = await supabase.functions.invoke('create-portal-session', {
                body: {
                    return_url: window.location.origin + '/#/billing'
                },
                headers: {
                    Authorization: `Bearer ${session?.access_token}`
                }
            });

            if (fnError) throw fnError;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No url returned from portal session');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al abrir el portal de pagos.');
        } finally {
            setLoading(false);
        }
    };

    const isPremium = subscriptionStatus === 'active';

    return (
        <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-text flex items-center gap-3">
                    <CreditCard className="text-primary" size={32} />
                    Suscripción y Facturación
                </h1>
                <p className="text-muted mt-2">
                    Gestiona tu plan y accede a características exclusivas de TourCommand.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                </div>
            )}

            {/* Plans Section */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Free Plan */}
                <div className={`relative p-8 rounded-3xl border transition-all ${!isPremium ? 'border-primary shadow-lg shadow-primary/20 bg-surface/80' : 'border-border bg-surface/30'}`}>
                    {!isPremium && (
                        <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Plan Actual
                        </div>
                    )}
                    <h3 className="text-xl font-semibold text-text mb-2">Premium (Gratis)</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-extrabold text-text">€0</span>
                        <span className="text-muted">/mes</span>
                    </div>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-start gap-3 text-muted">
                            <Check className="text-primary shrink-0 mt-0.5" size={18} />
                            <span>Gestión de eventos y fechas ilimitadas</span>
                        </li>
                        <li className="flex items-start gap-3 text-muted">
                            <Check className="text-primary shrink-0 mt-0.5" size={18} />
                            <span>Acceso básico al panel de control</span>
                        </li>
                        <li className="flex items-start gap-3 text-muted">
                            <Check className="text-primary shrink-0 mt-0.5" size={18} />
                            <span>Listado de recintos estándar</span>
                        </li>
                    </ul>

                    <button
                        disabled
                        className="w-full py-3 rounded-xl bg-surface border border-border text-muted font-medium cursor-default"
                    >
                        {!isPremium ? 'Tu plan actual' : 'Plan Base'}
                    </button>
                </div>

                {/* Premium Plus Plan */}
                <div className={`relative p-8 rounded-3xl transition-all ${isPremium ? 'border-2 border-emerald-500 shadow-lg shadow-emerald-500/20 bg-surface/80' : 'border border-border bg-gradient-to-b from-[#1a1a3a] to-surface'}`}>
                    {isPremium && (
                        <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck size={14} /> Tu Plan Actual
                        </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold text-text flex items-center gap-2">
                            Premium Plus <Zap className="text-yellow-500" size={20} />
                        </h3>
                    </div>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-extrabold text-text">€2</span>
                        <span className="text-muted">/mes</span>
                    </div>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-start gap-3 text-gray-300">
                            <Check className="text-primary shrink-0 mt-0.5" size={18} />
                            <span>Todo lo incluido en Premium</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-300">
                            <Check className="text-primary shrink-0 mt-0.5" size={18} />
                            <span>Logística avanzada y alojamiento profundo</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-300">
                            <Check className="text-primary shrink-0 mt-0.5" size={18} />
                            <span>Soporte prioritario 24/7 para el Tour Manager</span>
                        </li>
                        <li className="flex items-start gap-3 text-gray-300">
                            <Check className="text-primary shrink-0 mt-0.5" size={18} />
                            <span>Exportación en PDF profesional</span>
                        </li>
                    </ul>

                    {isPremium ? (
                        <button
                            onClick={handleManageBilling}
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Gestionar Suscripción'}
                        </button>
                    ) : (
                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-primary hover:bg-blue-600 shadow-lg shadow-primary/30 text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Mejorar ahora por 2€/mes'}
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface/50 border border-border flex items-center justify-between text-muted">
                <div>
                    <h4 className="font-semibold text-text mb-1 flex items-center gap-2">Pagos seguros gestionados por Stripe <ExternalLink size={16} /></h4>
                    <p className="text-sm">TourCommand no almacena los datos de tu tarjeta de crédito.</p>
                </div>
            </div>

        </div>
    );
};

export default Billing;

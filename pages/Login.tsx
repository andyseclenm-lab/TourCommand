import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc, ArrowRight, Lock, Mail, User, Briefcase, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;

    try {
      if (isRegistering) {
        const { error } = await signUp(email, password, {
          full_name: name,
          role: role,
        });
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
      navigate('/dashboard');
    } catch (err: any) {
      let message = err.message || 'Ocurrió un error';
      if (message.includes('rate limit')) {
        message = 'Has excedido el límite de intentos. Por favor espera unos minutos o revisa tu configuración de Supabase.';
      } else if (message.includes('Invalid login credentials')) {
        message = 'Correo o contraseña incorrectos.';
      } else if (message.includes('User already registered')) {
        message = 'Este correo ya está registrado.';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
  };

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Left Panel - Visual */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80")' }}
        ></div>
        <div className="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent"></div>

        <div className="relative z-10 p-16 flex flex-col justify-between h-full text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Disc className="text-white animate-spin-slow" size={24} />
            </div>
            <span className="font-bold text-2xl tracking-tight">TourCommand</span>
          </div>

          <div className="max-w-xl">
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Domina la Logística de tu Gira.
            </h1>
            <p className="text-xl text-gray-300 font-medium leading-relaxed">
              La plataforma todo en uno para gestionar equipos, viajes y eventos en tiempo real. Creada para la carretera.
            </p>
          </div>

          <div className="flex gap-4 text-sm font-medium text-gray-400">
            <span>© 2024 TourCommand Inc.</span>
            <span>Política de Privacidad</span>
            <span>Términos de Servicio</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Mobile Background Image (Absolute) */}
        <div
          className="absolute inset-0 lg:hidden bg-cover bg-center z-0"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80")' }}
        >
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm"></div>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <Disc className="text-white" size={28} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-text tracking-tight">
              {isRegistering ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
            </h2>
            <p className="mt-2 text-muted">
              {isRegistering ? 'Rellena los datos para comenzar tu gestión.' : 'Introduce tus datos para iniciar sesión.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Registration Fields */}
            {isRegistering && (
              <>
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label htmlFor="name" className="block text-sm font-medium text-text">Nombre Completo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-muted" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required={isRegistering}
                      className="block w-full rounded-xl border border-border bg-surface/50 py-3.5 pl-10 pr-4 text-black placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="ej. Alex Morgan"
                    />
                  </div>
                </div>
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 delay-75">
                  <label htmlFor="role" className="block text-sm font-medium text-text">Cargo / Rol</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-muted" />
                    </div>
                    <input
                      id="role"
                      name="role"
                      type="text"
                      required={isRegistering}
                      className="block w-full rounded-xl border border-border bg-surface/50 py-3.5 pl-10 pr-4 text-black placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="ej. Tour Manager"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-text">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-xl border border-border bg-surface/50 py-3.5 pl-10 pr-4 text-black placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="nombre@tourcommand.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-text">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  className="block w-full rounded-xl border border-border bg-surface/50 py-3.5 pl-10 pr-4 text-black placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isRegistering && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-border bg-surface/50 text-primary focus:ring-primary focus:ring-offset-background"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-text">
                    Recuérdame
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary hover:text-blue-400 transition-colors">
                    ¿Olvidaste la contraseña?
                  </a>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center items-center gap-2 rounded-xl bg-primary py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isRegistering ? 'Crear Cuenta' : 'Entrar al Dashboard'}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="text-center">
            <p className="text-sm text-muted">
              {isRegistering ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta?'}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-2 font-bold text-primary hover:text-primary/80 transition-colors underline decoration-transparent hover:decoration-primary/50 underline-offset-4"
              >
                {isRegistering ? 'Inicia Sesión' : 'Regístrate gratis'}
              </button>
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-2 text-muted lg:bg-background bg-transparent backdrop-blur-md lg:backdrop-blur-none rounded">
                O continúa con
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button type="button" className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border py-3 text-sm font-medium text-text hover:bg-surface/80 transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
              <span>Google</span>
            </button>
            <button type="button" className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-border py-3 text-sm font-medium text-text hover:bg-surface/80 transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.19 2.31-.89 3.51-.84 1.54.06 2.7.74 3.37 1.83-2.73 1.58-2.26 5.57.86 6.81-.61 1.77-1.49 3.48-2.82 4.39zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
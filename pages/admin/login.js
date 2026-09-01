import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { hasAdminToken, loginAdmin } from '../../lib/adminAuth';
import { SparkleIcon } from '../../components/BrandMotifs';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function tryAutoLogin() {
      const loggedIn = await hasAdminToken();
      if (loggedIn) {
        router.push('/admin/validar-citas');
      }
    }
    tryAutoLogin();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginAdmin(password.trim());
      const next = typeof router.query.next === 'string' ? router.query.next : '/admin/validar-citas';
      router.push(next.startsWith('/admin') ? next : '/admin/validar-citas');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Acceso Admin | Vanessa Nails Studio</title>
      </Head>

      <div
        className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(circle at 50% 20%, rgba(225, 27, 116, 0.10), transparent 45%),
            radial-gradient(circle at 85% 80%, rgba(197, 160, 89, 0.12), transparent 35%),
            linear-gradient(180deg, #FFFBFD 0%, #FFF0F6 45%, #FDF6EF 100%)
          `,
        }}
      >
        <div className="w-full max-w-md space-y-6">
          {/* Cabecera con Logo Oficial */}
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-3xl border-2 border-pink-200 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="Vanessa Nails Logo" className="h-full w-full object-cover" />
            </div>
            <h1
              className="font-display text-2xl sm:text-3xl font-bold leading-tight"
              style={{ color: 'var(--brand-darker)' }}
            >
              Vanessa Nails<span className="text-pink-600"> Studio</span>
            </h1>
            <p className="mt-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-widest">
              Panel de Administración
            </p>
          </div>

          {/* Tarjeta de Login */}
          <div
            className="premium-shell gloss-panel gradient-outline step-fade-in p-6 sm:p-8"
            style={{ borderRadius: '28px' }}
          >
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-700"
                >
                  Contraseña de acceso
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="premium-input transition-all duration-300 focus:shadow-[0_0_20px_rgba(225,27,116,0.15)] bg-white/90"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <div
                  className="rounded-2xl border p-3.5 text-xs font-medium animate-shake flex items-center gap-2"
                  style={{
                    borderColor: 'rgba(239, 68, 68, 0.30)',
                    background: 'rgba(254, 242, 242, 0.95)',
                    color: '#991B1B',
                  }}
                >
                  <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="premium-button w-full shadow-lg active:scale-95 transition flex items-center justify-center gap-2 text-sm font-bold"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <SparkleIcon className="h-4 w-4" />
                    <span>Ingresar al Panel</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-pink-600 hover:text-pink-700 underline decoration-dotted transition"
            >
              ← Volver al sitio web de reservas
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

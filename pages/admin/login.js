import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { hasAdminToken, loginAdmin } from '../../lib/adminAuth';
import { AdminShieldIcon } from '../../components/BrandMotifs';


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
        <title>Admin — Vanessa Nails Studio</title>
      </Head>

      {/* Full-page marble/blush backdrop — consistent with brand */}
      <div
        className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(circle at top,        rgba(225, 27, 116, 0.10), transparent 30%),
            radial-gradient(circle at 85% 12%,    rgba(197, 160,  89, 0.14), transparent 24%),
            linear-gradient(180deg, #FFFBFD 0%, #FFF0F6 45%, #FDF6EF 100%)
          `,
        }}
      >
        <div className="w-full max-w-md space-y-8">
          {/* Brand header */}
          <div className="text-center">
            <div
              className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-[22px] shadow-[0_20px_48px_rgba(225,27,116,0.22)]"
              style={{ background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)' }}
            >
              <AdminShieldIcon className="h-7 w-7" />
            </div>
            <h1
              className="font-display text-3xl font-semibold leading-tight"
              style={{ color: 'var(--brand-darker)', letterSpacing: '-0.02em' }}
            >
              Vanessa Nails Studio
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: 'var(--ink-faint)' }}
            >
              Panel de administración
            </p>
          </div>

          {/* Login card */}
          <div
            className="premium-shell gloss-panel gradient-outline step-fade-in"
            style={{ borderRadius: '28px' }}
          >
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  Contraseña de acceso
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="premium-input transition-all duration-300 focus:shadow-[0_0_20px_rgba(225,27,116,0.12)] focus:scale-[1.01] bg-white/90"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error ? (
                <div
                  className="rounded-2xl border px-4 py-3 text-sm font-medium"
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderColor: 'rgba(239, 68, 68, 0.18)',
                    color: '#C53030',
                  }}
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="premium-button w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Verificando...' : 'Iniciar sesión'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

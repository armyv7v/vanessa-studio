import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { clearAdminToken } from '../lib/adminAuth';
import { GemIcon, PolishBottleIcon, SparkleIcon, SwirlDivider } from './BrandMotifs';

const navigation = [
  { href: '/admin/horarios', label: 'Horarios',      icon: <PolishBottleIcon className="h-4 w-4" /> },
  { href: '/admin/turnos',   label: 'Turnos',        icon: <GemIcon className="h-4 w-4" /> },
  { href: '/admin/validar-citas', label: 'Validar citas', icon: <SparkleIcon className="h-4 w-4" /> },
];

export default function AdminShell({ title, description, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    clearAdminToken();
    router.push('/admin/login');
  };

  const NavLinks = () => (
    <nav className="space-y-2">
      {navigation.map((item) => {
        const isActive = router.pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? 'text-white shadow-[0_14px_28px_rgba(225,27,116,0.22)]'
                : 'hover:bg-[#FDE8F2]'
            }`}
            style={
              isActive
                ? { background: 'linear-gradient(160deg, #F04A94 0%, #E11B74 55%, #B8105D 100%)', color: '#fff' }
                : { color: 'var(--ink-muted)' }
            }
          >
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm"
              style={{
                background: isActive ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.90)',
                color: isActive ? '#fff' : 'var(--brand)',
                border: isActive ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--gold-lighter)',
              }}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const SidebarContent = () => (
    <>
      <div className="mb-8">
        <p
          className="text-xs font-bold uppercase tracking-[0.28em]"
          style={{ color: 'var(--brand)' }}
        >
          Dashboard Admin
        </p>
        <h1 className="mt-3 text-2xl font-bold" style={{ color: 'var(--ink-medium)' }}>
          Vanessa Nails Studio
        </h1>
        <p className="mt-2 text-sm leading-6" style={{ color: 'var(--ink-faint)' }}>
          Administra horarios, visibilidad del calendario y validación de citas desde un solo lugar.
        </p>
        <div className="mt-4 flex items-center gap-3" style={{ color: 'var(--gold)' }}>
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: 'var(--gold-lightest)' }}
          >
            <PolishBottleIcon className="h-4 w-4" />
          </span>
          <SwirlDivider className="h-5 w-16" />
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: 'var(--gold-lightest)' }}
          >
            <SparkleIcon className="h-4 w-4" />
          </span>
        </div>
      </div>

      <NavLinks />

      <button
        type="button"
        onClick={handleLogout}
        className="mt-8 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition hover:-translate-y-px"
        style={{
          border: '1px solid var(--gold-lighter)',
          background: 'var(--gold-lightest)',
          color: 'var(--gold-dark)',
        }}
      >
        Cerrar sesión
      </button>
    </>
  );

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        background: `
          radial-gradient(circle at top, rgba(225, 27, 116, 0.07), transparent 30%),
          radial-gradient(circle at 85% 10%, rgba(197, 160, 89, 0.12), transparent 22%),
          linear-gradient(180deg, #FFFBFD 0%, #FFF0F6 45%, #FDF6EF 100%)
        `,
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Desktop Sidebar */}
        <aside
          className="hidden w-80 px-6 py-8 backdrop-blur lg:block"
          style={{
            borderRight: '1px solid rgba(242, 200, 212, 0.6)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(254,240,248,0.95) 100%)',
          }}
        >
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen ? (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(28, 10, 20, 0.40)' }}
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        {/* Mobile Sidebar Drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-80 px-6 py-8 shadow-2xl transition-transform lg:hidden ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            borderRight: '1px solid rgba(242, 200, 212, 0.6)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(254,240,248,0.97) 100%)',
          }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.28em]"
                style={{ color: 'var(--brand)' }}
              >
                Dashboard Admin
              </p>
              <h2 className="mt-2 text-xl font-bold" style={{ color: 'var(--ink-medium)' }}>
                Vanessa Nails Studio
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-full p-2 transition"
              style={{ color: 'var(--ink-faint)', background: 'var(--bg-blush)' }}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          </div>

          <NavLinks />

          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition"
            style={{
              border: '1px solid var(--gold-lighter)',
              background: 'var(--gold-lightest)',
              color: 'var(--gold-dark)',
            }}
          >
            Cerrar sesión
          </button>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              {/* Hamburger — mobile only */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-lg shadow-sm transition lg:hidden"
                style={{
                  borderColor: 'var(--gold-lighter)',
                  background: 'rgba(255,255,255,0.95)',
                  color: 'var(--brand)',
                }}
                aria-label="Abrir menú"
              >
                ☰
              </button>

              <h2
                className="text-3xl font-bold tracking-tight"
                style={{ color: 'var(--ink-medium)' }}
              >
                {title}
              </h2>
              {description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'var(--ink-faint)' }}>
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

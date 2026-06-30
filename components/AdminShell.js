import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { clearAdminToken } from '../lib/adminAuth';
import {
  AdminShieldIcon,
  ArrowLeftIcon,
  CloseIcon,
  GemIcon,
  MenuIcon,
  PolishBottleIcon,
  SparkleIcon,
  SwirlDivider,
  ValidationIcon,
} from './BrandMotifs';

const navigation = [
  { href: '/admin/horarios', label: 'Horarios', icon: <PolishBottleIcon className="h-4 w-4" /> },
  { href: '/admin/turnos', label: 'Turnos', icon: <GemIcon className="h-4 w-4" /> },
  { href: '/admin/validar-citas', label: 'Validar citas', icon: <ValidationIcon className="h-4 w-4" /> },
];

export default function AdminShell({ title, description, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await clearAdminToken();
    router.push('/admin/login');
  };

  const NavLinks = ({ compact = false } = {}) => (
    <nav className="space-y-2" aria-label="Navegaci?n admin">
      {navigation.map((item) => {
        const isActive = router.pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsSidebarOpen(false)}
            title={compact ? item.label : undefined}
            className={`flex items-center gap-3 rounded-2xl py-3 text-sm font-semibold transition-all duration-300 ${
              compact ? 'justify-center px-3' : 'px-4'
            } ${
              isActive
                ? 'text-white shadow-[0_14px_28px_rgba(230,0,126,0.24)] scale-[1.02]'
                : 'hover:bg-[#FFE3F1] hover:text-[var(--brand-dark)]'
            }`}
            style={
              isActive
                ? { background: 'linear-gradient(160deg, #FF3F9A 0%, #E6007E 55%, #B0005F 100%)', color: '#fff' }
                : { color: 'var(--ink-muted)' }
            }
          >
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm"
              style={{
                background: isActive ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.92)',
                color: isActive ? '#fff' : 'var(--brand)',
                border: isActive ? '1px solid rgba(255,255,255,0.32)' : '1px solid rgba(230,0,126,0.18)',
              }}
            >
              {item.icon}
            </span>
            {compact ? null : <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const SidebarContent = ({ compact = false } = {}) => (
    <>
      <div className={`mb-8 ${compact ? 'text-center' : ''}`}>
        {compact ? (
          <span
            className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm"
            style={{ background: 'var(--brand-lightest)', borderColor: 'rgba(230,0,126,0.20)', color: 'var(--brand)' }}
            title="Vanessa Nails Studio"
          >
            <AdminShieldIcon className="h-4 w-4" />
          </span>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: 'var(--brand)' }}>
              Dashboard Admin
            </p>
            <h1 className="mt-3 text-2xl font-bold" style={{ color: 'var(--ink-medium)' }}>
              Vanessa Nails Studio
            </h1>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--ink-faint)' }}>
              Administra horarios, visibilidad del calendario y validaci?n de citas desde un solo lugar.
            </p>
            <div className="mt-4 flex items-center gap-3" style={{ color: 'var(--gold)' }}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--gold-lightest)' }}>
                <AdminShieldIcon className="h-4 w-4" />
              </span>
              <SwirlDivider className="h-5 w-16" />
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--gold-lightest)' }}>
                <SparkleIcon className="h-4 w-4" />
              </span>
            </div>
          </>
        )}
      </div>

      <NavLinks compact={compact} />

      <button
        type="button"
        onClick={handleLogout}
        title={compact ? 'Cerrar sesi?n' : undefined}
        className={`mt-8 premium-button-secondary transition-all duration-300 hover:-translate-y-px hover:scale-[1.01] ${compact ? 'h-12 w-12 px-0 text-xl' : 'w-full'}`}
        style={{ borderRadius: '16px' }}
      >
        {compact ? <ArrowLeftIcon className="h-5 w-5" /> : 'Cerrar sesi?n'}
      </button>
    </>
  );

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        background: `
          radial-gradient(circle at 16% 8%, rgba(209, 18, 111, 0.10), transparent 28%),
          radial-gradient(circle at 88% 4%, rgba(37, 99, 235, 0.10), transparent 24%),
          linear-gradient(180deg, #F8FAFC 0%, #F6F8FC 52%, #FFF7FB 100%)
        `,
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden shrink-0 px-4 py-6 backdrop-blur transition-[width] duration-300 lg:block ${
            isDesktopSidebarExpanded ? 'w-[300px]' : 'w-[96px]'
          }`}
          style={{
            borderRight: '1px solid rgba(226, 232, 240, 0.95)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
          }}
        >
          <button
            type="button"
            onClick={() => setIsDesktopSidebarExpanded((value) => !value)}
            className="mb-6 inline-flex h-11 w-full items-center justify-center rounded-2xl border text-sm font-bold transition hover:-translate-y-px"
            style={{ borderColor: 'rgba(230,0,126,0.18)', background: 'rgba(255,255,255,0.9)', color: 'var(--brand)' }}
            aria-label={isDesktopSidebarExpanded ? 'Contraer men? lateral' : 'Expandir men? lateral'}
            title={isDesktopSidebarExpanded ? 'Contraer men?' : 'Expandir men?'}
          >
            {isDesktopSidebarExpanded ? 'Contraer' : <MenuIcon className="h-5 w-5" />}
          </button>
          <SidebarContent compact={!isDesktopSidebarExpanded} />
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
              <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: 'var(--brand)' }}>
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
              aria-label="Cerrar men?"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <NavLinks />

          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 w-full premium-button-secondary transition-all duration-300"
            style={{ borderRadius: '16px' }}
          >
            Cerrar sesi?n
          </button>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-8 step-fade-in" key={router.pathname}>
          <div className="mb-6 flex flex-col gap-4">
            <div className="admin-pro-topbar sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 backdrop-blur">
              <div className="flex flex-wrap items-center gap-2">
                <span className="admin-status-chip">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                  Sesi?n segura
                </span>
                <span className="admin-status-chip">
                  <SparkleIcon className="h-3.5 w-3.5 text-[var(--brand)]" />
                  Centro de gesti?n
                </span>
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--ink-faint)' }}>
                Operaci?n de agenda, abonos y asistencia
              </p>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-lg shadow-sm transition lg:hidden"
                  style={{
                    borderColor: 'var(--gold-lighter)',
                    background: 'rgba(255,255,255,0.95)',
                    color: 'var(--brand)',
                  }}
                  aria-label="Abrir men?"
                >
                  <MenuIcon className="h-5 w-5" />
                </button>

                <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--ink-medium)' }}>
                  {title}
                </h2>
                {description ? (
                  <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'var(--ink-faint)' }}>
                    {description}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

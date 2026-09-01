import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clearAdminToken } from '../lib/adminAuth';
import {
  AdminShieldIcon,
  ArrowLeftIcon,
  CloseIcon,
  GemIcon,
  MenuIcon,
  PolishBottleIcon,
  SparkleIcon,
  UsersIcon,
  ValidationIcon,
} from './BrandMotifs';

const navigation = [
  { href: '/admin/validar-citas', label: 'Validar citas & pagos', shortLabel: 'Validar', icon: <ValidationIcon className="h-4 w-4" /> },
  { href: '/admin/turnos', label: 'Agenda de Turnos', shortLabel: 'Turnos', icon: <GemIcon className="h-4 w-4" /> },
  { href: '/admin/clientes', label: 'Cartera de Clientes', shortLabel: 'Clientes', icon: <UsersIcon className="h-4 w-4" /> },
  { href: '/admin/horarios', label: 'Config. Horarios', shortLabel: 'Horarios', icon: <PolishBottleIcon className="h-4 w-4" /> },
];

export default function AdminShell({ title, description, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(true);
  const [currentDateStr, setCurrentDateStr] = useState('');
  const router = useRouter();

  useEffect(() => {
    try {
      const now = new Date();
      setCurrentDateStr(format(now, "EEEE, d 'de' MMMM yyyy", { locale: es }));
    } catch {
      // fallback
    }
  }, []);

  const handleLogout = async () => {
    await clearAdminToken();
    router.push('/admin/login');
  };

  const NavLinks = ({ compact = false } = {}) => (
    <nav className="space-y-1.5" aria-label="Navegación admin">
      {navigation.map((item) => {
        const isActive = router.pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsSidebarOpen(false)}
            title={compact ? item.label : undefined}
            className={`group relative flex items-center gap-3 rounded-2xl py-3 text-sm font-semibold transition-all duration-200 ${
              compact ? 'justify-center px-2.5' : 'px-3.5'
            } ${
              isActive
                ? 'bg-gradient-to-r from-[#E11B74] to-[#C5A059] text-white shadow-md scale-[1.01]'
                : 'text-neutral-600 hover:bg-pink-50/80 hover:text-pink-600'
            }`}
          >
            <span
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all shadow-sm ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-pink-600 border border-pink-100 group-hover:border-pink-200'
              }`}
            >
              {item.icon}
            </span>
            {compact ? null : (
              <span className="truncate font-medium text-xs sm:text-sm">
                {item.label}
              </span>
            )}
          </Link>
        );
      })}

      {/* Link de acceso directo a la web pública */}
      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        title={compact ? 'Ver sitio web' : undefined}
        className={`group flex items-center gap-3 rounded-2xl py-2.5 text-xs font-semibold text-neutral-500 hover:bg-pink-50/60 hover:text-pink-600 transition ${
          compact ? 'justify-center px-2.5' : 'px-3.5 mt-3'
        }`}
      >
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-pink-600 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </span>
        {compact ? null : <span>Ver sitio web ↗</span>}
      </a>
    </nav>
  );

  const SidebarContent = ({ compact = false } = {}) => (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Cabecera Sidebar con Logo Oficial */}
        <div className={`mb-6 ${compact ? 'text-center' : ''}`}>
          {compact ? (
            <div className="relative mx-auto h-12 w-12 overflow-hidden rounded-2xl border border-pink-200 shadow-sm" title="Vanessa Nails Studio">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-pink-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#E11B74]">
                  Dashboard Admin
                </p>
                <h1 className="truncate font-display text-sm font-bold text-neutral-900">
                  Vanessa Nails<span className="text-pink-600"> Studio</span>
                </h1>
              </div>
            </div>
          )}
        </div>

        <NavLinks compact={compact} />
      </div>

      {/* Botón Cerrar Sesión */}
      <div className="pt-6 border-t border-pink-100/80">
        <button
          type="button"
          onClick={handleLogout}
          title={compact ? 'Cerrar sesión' : undefined}
          className={`flex items-center justify-center gap-2 rounded-2xl border border-pink-200/80 bg-white/90 py-2.5 text-xs font-semibold text-neutral-600 shadow-sm hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 active:scale-95 transition ${
            compact ? 'h-11 w-11 px-0' : 'w-full'
          }`}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {compact ? null : <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        background: `
          radial-gradient(circle at 12% 8%, rgba(225, 27, 116, 0.08), transparent 30%),
          radial-gradient(circle at 90% 12%, rgba(197, 160, 89, 0.09), transparent 28%),
          linear-gradient(180deg, #FAF8F9 0%, #FFF5F8 45%, #FDFBF7 100%)
        `,
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden shrink-0 px-4 py-6 backdrop-blur transition-[width] duration-300 lg:block ${
            isDesktopSidebarExpanded ? 'w-[280px]' : 'w-[88px]'
          }`}
          style={{
            borderRight: '1px solid rgba(242, 200, 212, 0.5)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(254,245,250,0.94) 100%)',
          }}
        >
          <div className="mb-4 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsDesktopSidebarExpanded((value) => !value)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-pink-200/70 bg-white text-xs font-bold text-pink-600 shadow-sm transition hover:bg-pink-50"
              aria-label={isDesktopSidebarExpanded ? 'Contraer menú lateral' : 'Expandir menú lateral'}
              title={isDesktopSidebarExpanded ? 'Contraer menú' : 'Expandir menú'}
            >
              {isDesktopSidebarExpanded ? '◀' : <MenuIcon className="h-4 w-4" />}
            </button>
          </div>
          <SidebarContent compact={!isDesktopSidebarExpanded} />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        {/* Mobile Sidebar Drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 px-5 py-6 shadow-2xl transition-transform duration-300 lg:hidden ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            borderRight: '1px solid rgba(242, 200, 212, 0.6)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(254,242,249,0.98) 100%)',
          }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-pink-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#E11B74]">
                  Dashboard Admin
                </p>
                <h2 className="font-display text-sm font-bold text-neutral-900">
                  Vanessa Nails
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-full p-2 text-neutral-400 hover:bg-pink-100 hover:text-pink-600 transition"
              aria-label="Cerrar menú"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <NavLinks />

          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-white py-2.5 text-xs font-semibold text-neutral-600 shadow-sm"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </aside>

        {/* Main Content Viewport */}
        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6 step-fade-in" key={router.pathname}>
          {/* Topbar Superior */}
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pink-200/60 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-pink-200 bg-white text-pink-600 shadow-sm transition active:scale-95 lg:hidden"
                  aria-label="Abrir menú"
                >
                  <MenuIcon className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Panel Activo
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-0.5 text-[11px] font-semibold text-pink-700 border border-pink-200/70">
                    <SparkleIcon className="h-3 w-3" />
                    Vanessa Nails Studio
                  </span>
                </div>
              </div>

              {currentDateStr ? (
                <p className="text-xs font-medium capitalize text-neutral-500">
                  {currentDateStr}
                </p>
              ) : null}
            </div>

            {/* Título de la Página Actual */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--brand-darker)' }}>
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
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

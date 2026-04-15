import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { clearAdminToken } from '../lib/adminAuth';
import { GemIcon, PolishBottleIcon, SparkleIcon, SwirlDivider } from './BrandMotifs';

const navigation = [
  { href: '/admin/horarios', label: 'Horarios', icon: <PolishBottleIcon className="h-4 w-4" /> },
  { href: '/admin/turnos', label: 'Turnos', icon: <GemIcon className="h-4 w-4" /> },
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
                ? 'bg-pink-600 text-white shadow-[0_14px_28px_rgba(219,39,119,0.24)]'
                : 'text-slate-700 hover:bg-pink-50 hover:text-pink-700'
            }`}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-pink-600 shadow-sm">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8fb_0%,#fff1f7_46%,#fff9ef_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-80 border-r border-pink-100 bg-[linear-gradient(180deg,#ffffff_0%,#fff5fa_100%)] px-6 py-8 backdrop-blur lg:block">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-pink-500">Dashboard Admin</p>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Vanessa Nails Studio</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Administra horarios, visibilidad del calendario y validación de citas desde un solo lugar.
            </p>
            <div className="mt-4 flex items-center gap-3 text-pink-400">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pink-50"><PolishBottleIcon className="h-4 w-4" /></span>
              <SwirlDivider className="h-5 w-16" />
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pink-50"><SparkleIcon className="h-4 w-4" /></span>
            </div>
          </div>

          <NavLinks />

          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 w-full rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm font-semibold text-pink-700 transition hover:bg-pink-100"
          >
            Cerrar sesión
          </button>
        </aside>

        {isSidebarOpen ? (
          <div
            className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        <aside className={`fixed inset-y-0 left-0 z-50 w-80 border-r border-pink-100 bg-[linear-gradient(180deg,#ffffff_0%,#fff5fa_100%)] px-6 py-8 shadow-2xl transition-transform lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-pink-500">Dashboard Admin</p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">Vanessa Nails Studio</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          </div>

          <NavLinks />

          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 w-full rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm font-semibold text-pink-700 transition hover:bg-pink-100"
          >
            Cerrar sesión
          </button>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-pink-200 bg-white text-lg text-pink-700 shadow-sm lg:hidden"
                aria-label="Abrir menú"
              >
                ☰
              </button>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
              {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

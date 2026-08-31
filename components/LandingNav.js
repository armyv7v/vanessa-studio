import Image from 'next/image';
import Link from 'next/link';
import { WhatsAppIcon } from './BrandMotifs';
import { WHATSAPP_DEFAULT } from '../lib/businessInfo';

const links = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#como-reservar', label: 'Cómo reservar' },
  { href: '#testimonios', label: 'Testimonios' },
  { href: '#galeria', label: 'Galería' },
  { href: '#contacto', label: 'Contacto' },
];

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/70 backdrop-blur-xl">
      <div
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,253,255,0.92) 0%, rgba(255,240,246,0.88) 100%)',
        }}
      >
        {/* Marca */}
        <Link href="/" className="flex items-center gap-3 shrink-0" style={{ color: 'var(--brand-darker)' }}>
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-pink-200/80 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="Logo Vanessa Nails Studio"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="font-display text-lg font-semibold leading-none tracking-tight whitespace-nowrap">
            Vanessa Nails<span style={{ color: 'var(--brand)' }}> Studio</span>
          </span>
        </Link>

        {/* Links desktop */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-semibold transition"
              style={{ color: 'var(--ink-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-dark)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <a
          href={WHATSAPP_DEFAULT}
          target="_blank"
          rel="noreferrer"
          className="premium-button !px-4 !py-2 text-sm"
        >
          <WhatsAppIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Reservar</span>
          <span className="sm:hidden">Reservar</span>
        </a>
      </div>
    </header>
  );
}

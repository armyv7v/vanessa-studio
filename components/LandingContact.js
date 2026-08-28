import { WhatsAppIcon, MapPinIcon, ClockIcon } from './BrandMotifs';
import { BUSINESS, WHATSAPP_BOOKING } from '../lib/businessInfo';

export default function LandingContact() {
  return (
    <section id="contacto" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-kicker">Contacto</span>
          <h2 className="headline-section mt-4">Te esperamos en el estudio</h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Ubicación */}
          <div className="premium-card p-6">
            <span className="motif-icon h-11 w-11"><MapPinIcon className="h-5 w-5" /></span>
            <h3 className="mt-4 font-display text-lg font-semibold" style={{ color: 'var(--brand-darker)' }}>Ubicación</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{BUSINESS.address}</p>
          </div>

          {/* Horario */}
          <div className="premium-card p-6">
            <span className="motif-icon h-11 w-11"><ClockIcon className="h-5 w-5" /></span>
            <h3 className="mt-4 font-display text-lg font-semibold" style={{ color: 'var(--brand-darker)' }}>Horario</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              {BUSINESS.hours}
              <br />
              {BUSINESS.hoursTime}
            </p>
          </div>

          {/* Contacto */}
          <div className="premium-card p-6">
            <span className="motif-icon h-11 w-11"><WhatsAppIcon className="h-5 w-5" /></span>
            <h3 className="mt-4 font-display text-lg font-semibold" style={{ color: 'var(--brand-darker)' }}>Contacto</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{BUSINESS.phone}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={WHATSAPP_BOOKING} target="_blank" rel="noreferrer" className="premium-button !px-4 !py-2 text-sm">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </a>
              <a href={BUSINESS.instagramUrl} target="_blank" rel="noreferrer" className="premium-button-secondary !px-4 !py-2 text-sm">
                {BUSINESS.instagram}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

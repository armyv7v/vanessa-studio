function baseIconProps(className) {
  return {
    className,
    'aria-hidden': 'true',
  };
}

export function SparkleIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F04A94" />
          <stop offset="100%" stopColor="#C5A059" />
        </linearGradient>
      </defs>
      <path d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z" fill="url(#sparkle-grad)" />
    </svg>
  );
}

export function PolishBottleIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bottle-cap" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EDD9A3" />
          <stop offset="100%" stopColor="#C5A059" />
        </linearGradient>
        <linearGradient id="bottle-liquid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87CB3" />
          <stop offset="100%" stopColor="#E11B74" />
        </linearGradient>
      </defs>
      {/* Cap */}
      <rect x="10" y="2" width="4" height="8" rx="1" fill="url(#bottle-cap)" />
      {/* Neck ring */}
      <rect x="8" y="10" width="8" height="2" rx="0.5" fill="#C5A059" opacity="0.8" />
      {/* Bottle Body */}
      <path d="M6 13C6 12.4477 6.44772 12 7 12H17C17.5523 12 18 12.4477 18 13V20C18 21.1046 17.1046 22 16 22H8C6.89543 22 6 21.1046 6 20V13Z" stroke="url(#bottle-cap)" strokeWidth="1.5" />
      {/* Liquid inside */}
      <path d="M7.5 14H16.5V19C16.5 19.8284 15.8284 20.5 15 20.5H9C8.17157 20.5 7.5 19.8284 7.5 19V14Z" fill="url(#bottle-liquid)" />
      {/* Reflection highlight */}
      <path d="M9 15.5V18.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function GemIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gem-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EDD9A3" />
          <stop offset="50%" stopColor="#C5A059" />
          <stop offset="100%" stopColor="#A07D3A" />
        </linearGradient>
      </defs>
      {/* Faceted jewel shape */}
      <path d="M6 3H18L22 9L12 21L2 9L6 3Z" stroke="url(#gem-grad)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6 3L12 9L18 3" stroke="url(#gem-grad)" strokeWidth="1.2" />
      <path d="M2 9H22" stroke="url(#gem-grad)" strokeWidth="1.2" />
      <path d="M12 9V21" stroke="url(#gem-grad)" strokeWidth="1.2" />
      <path d="M6 3L2 9" stroke="url(#gem-grad)" strokeWidth="1.2" />
      <path d="M18 3L22 9" stroke="url(#gem-grad)" strokeWidth="1.2" />
      <path d="M6 9L12 21" stroke="url(#gem-grad)" strokeWidth="1.2" />
      <path d="M18 9L12 21" stroke="url(#gem-grad)" strokeWidth="1.2" />
      {/* Soft translucent fill */}
      <path d="M6 3H18L22 9L12 21L2 9L6 3Z" fill="url(#gem-grad)" opacity="0.08" />
    </svg>
  );
}

export function CalendarIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cal-brand" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F04A94" />
          <stop offset="100%" stopColor="#E11B74" />
        </linearGradient>
        <linearGradient id="cal-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EDD9A3" />
          <stop offset="100%" stopColor="#C5A059" />
        </linearGradient>
      </defs>
      {/* Outer body */}
      <rect x="3" y="4" width="18" height="16" rx="3" stroke="url(#cal-gold)" strokeWidth="1.6" />
      {/* Top bar header */}
      <path d="M3 9H21" stroke="url(#cal-gold)" strokeWidth="1.6" />
      <path d="M3 7C3 5.34315 4.34315 4 6 4H18C19.6569 4 21 5.34315 21 7V9H3V7Z" fill="url(#cal-brand)" opacity="0.15" />
      {/* Rings/Binders */}
      <rect x="7" y="2" width="2" height="4" rx="1" fill="url(#cal-brand)" />
      <rect x="15" y="2" width="2" height="4" rx="1" fill="url(#cal-brand)" />
      {/* Grid dots */}
      <circle cx="8" cy="13" r="1.2" fill="url(#cal-brand)" />
      <circle cx="12" cy="13" r="1.2" fill="url(#cal-brand)" />
      <circle cx="16" cy="13" r="1.2" fill="url(#cal-brand)" />
      <circle cx="8" cy="17" r="1.2" fill="url(#cal-brand)" />
      <circle cx="12" cy="17" r="1.2" fill="url(#cal-brand)" />
      <circle cx="16" cy="17" r="1.2" fill="url(#cal-brand)" />
    </svg>
  );
}

export function ValidationIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="check-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" stroke="url(#check-grad)" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="9" fill="url(#check-grad)" opacity="0.12" />
      <path d="M8.5 12.5L11 15L16 9" stroke="url(#check-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminShieldIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F04A94" />
          <stop offset="100%" stopColor="#E11B74" />
        </linearGradient>
      </defs>
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="url(#shield-grad)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="url(#shield-grad)" opacity="0.1" />
      <path d="M9 12L11 14L15 10" stroke="url(#shield-grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ScanIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F04A94" />
          <stop offset="100%" stopColor="#E11B74" />
        </linearGradient>
      </defs>
      <path d="M4 8V5C4 4.44772 4.44772 4 5 4H8" stroke="url(#scan-grad)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 4H19C19.5523 4 20 4.44772 20 5V8" stroke="url(#scan-grad)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 16V19C4 19.5523 4.44772 20 5 20H8" stroke="url(#scan-grad)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 20H19C19.5523 20 20 19.5523 20 19V16" stroke="url(#scan-grad)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="6" y1="12" x2="18" y2="12" stroke="url(#scan-grad)" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
  );
}

export function MenuIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 18H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowLeftIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRightIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LaunchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ErrorIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="error-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" stroke="url(#error-grad)" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="9" fill="url(#error-grad)" opacity="0.1" />
      <path d="M12 8V13" stroke="url(#error-grad)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="url(#error-grad)" />
    </svg>
  );
}

export function SuccessIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" {...baseIconProps(className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="success-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" stroke="url(#success-grad)" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="9" fill="url(#success-grad)" opacity="0.12" />
      <path d="M8.5 12.5L11 15L16 9" stroke="url(#success-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SwirlDivider({ className = 'h-6 w-24', ...props }) {
  return (
    <svg viewBox="0 0 120 24" className={className} fill="none" aria-hidden="true" {...props}>
      <path d="M4 12c10.5 0 10.5-8 21-8 10.5 0 10.5 16 21 16s10.5-16 21-16 10.5 16 21 16 10.5-8 21-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="60" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function BrushAccent({ className = 'h-12 w-28', ...props }) {
  return (
    <svg viewBox="0 0 120 48" className={className} fill="none" aria-hidden="true" {...props}>
      <path d="M7 29c12-10 27-16 42-16 14 0 22 9 36 9 12 0 19-5 28-10-3 8-8 14-16 18-8 4-18 5-28 5-12 0-25-6-37-6-11 0-18 3-25 7Z" fill="currentColor" fillOpacity="0.22" />
      <path d="M7 29c12-10 27-16 42-16 14 0 22 9 36 9 12 0 19-5 28-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

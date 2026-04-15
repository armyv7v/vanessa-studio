function iconProps(className) {
  return {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.6',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };
}

export function SparkleIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M12 2.5 13.7 8.3 19.5 10 13.7 11.7 12 17.5 10.3 11.7 4.5 10 10.3 8.3Z" />
      <path d="M18.4 3.8 19 5.6 20.8 6.2 19 6.8 18.4 8.6 17.8 6.8 16 6.2 17.8 5.6Z" />
    </svg>
  );
}

export function PolishBottleIcon({ className = 'h-5 w-5' }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M10 3.5h4" />
      <path d="M10.8 3.5v4" />
      <path d="M13.2 3.5v4" />
      <rect x="8" y="7.5" width="8" height="12" rx="2.6" />
      <path d="M10.5 11.5c1.1-.8 2.9-.8 4 0" />
      <path d="M10.3 15.2c1.3.7 3.1.7 4.4 0" />
    </svg>
  );
}

export function GemIcon({ className = 'h-5 w-5' }) {
  return (
    <svg {...iconProps(className)}>
      <path d="M7 4.5h10l3 4.4L12 19.5 4 8.9Z" />
      <path d="M9 4.5 12 8.9 15 4.5" />
      <path d="M4 8.9h16" />
    </svg>
  );
}

export function SwirlDivider({ className = 'h-6 w-24' }) {
  return (
    <svg viewBox="0 0 120 24" className={className} fill="none" aria-hidden="true">
      <path d="M4 12c10.5 0 10.5-8 21-8 10.5 0 10.5 16 21 16s10.5-16 21-16 10.5 16 21 16 10.5-8 21-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="60" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function BrushAccent({ className = 'h-12 w-28' }) {
  return (
    <svg viewBox="0 0 120 48" className={className} fill="none" aria-hidden="true">
      <path d="M7 29c12-10 27-16 42-16 14 0 22 9 36 9 12 0 19-5 28-10-3 8-8 14-16 18-8 4-18 5-28 5-12 0-25-6-37-6-11 0-18 3-25 7Z" fill="currentColor" fillOpacity="0.22" />
      <path d="M7 29c12-10 27-16 42-16 14 0 22 9 36 9 12 0 19-5 28-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

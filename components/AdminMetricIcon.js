const iconPaths = {
  calendar: (
    <>
      <path d="M8.5 4.75v3.1M15.5 4.75v3.1" />
      <path d="M6.75 7.2h10.5a2.4 2.4 0 0 1 2.4 2.4v7.65a2.4 2.4 0 0 1-2.4 2.4H6.75a2.4 2.4 0 0 1-2.4-2.4V9.6a2.4 2.4 0 0 1 2.4-2.4Z" />
      <path d="M4.6 11h14.8" />
      <path d="M8.2 14.15h.05M12 14.15h.05M15.8 14.15h.05M8.2 17.15h.05M12 17.15h.05" />
    </>
  ),
  bolt: (
    <>
      <path d="M13.35 3.9 5.9 13.05h5.15l-.8 7.05 7.85-9.9h-5.25l.5-6.3Z" />
      <path d="M14.65 4.3c1.9.72 3.25 2.56 3.25 4.7" opacity="0.45" />
    </>
  ),
  wallet: (
    <>
      <path d="M5 8.2h12.8a2.15 2.15 0 0 1 2.15 2.15v6.5A2.15 2.15 0 0 1 17.8 19H6.2A2.2 2.2 0 0 1 4 16.8V7.4A2.4 2.4 0 0 1 6.4 5h9.35" />
      <path d="M16.7 12.15h3.25v3.25H16.7a1.62 1.62 0 0 1 0-3.25Z" />
      <path d="M6.2 8.2 16.1 5" opacity="0.5" />
    </>
  ),
  pulse: (
    <>
      <path d="M4 13.1h3.25l1.9-5.45 3.15 10.7 2.15-6.55H20" />
      <path d="M6.1 5.9A8.65 8.65 0 0 1 20.2 12" opacity="0.42" />
      <path d="M17.9 18.1A8.65 8.65 0 0 1 3.8 12" opacity="0.42" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.75 13.95 9 19.2 10.95 13.95 12.9 12 18.25 10.05 12.9 4.8 10.95 10.05 9 12 3.75Z" />
      <path d="M18.25 4.9v3.2M16.65 6.5h3.2M5.9 16.1v2.5M4.65 17.35h2.5" opacity="0.55" />
    </>
  ),
  lock: (
    <>
      <path d="M7.2 10.2V8.15a4.8 4.8 0 0 1 9.6 0v2.05" />
      <path d="M6.4 10.2h11.2a1.75 1.75 0 0 1 1.75 1.75v5.65a1.75 1.75 0 0 1-1.75 1.75H6.4a1.75 1.75 0 0 1-1.75-1.75v-5.65A1.75 1.75 0 0 1 6.4 10.2Z" />
      <path d="M12 14.05v2.25" />
    </>
  ),
};

export default function AdminMetricIcon({ type = 'sparkle', className = '' }) {
  return (
    <span className={`admin-premium-icon ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
        {iconPaths[type] || iconPaths.sparkle}
      </svg>
    </span>
  );
}

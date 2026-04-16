import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Gem,
  Menu,
  PaintbrushVertical,
  ScanLine,
  ShieldCheck,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

function baseIconProps(className) {
  return {
    className,
    strokeWidth: 1.9,
    'aria-hidden': 'true',
  };
}

function renderPremiumIcon(Icon, className) {
  return <Icon {...baseIconProps(className)} />;
}

export function SparkleIcon({ className = 'h-4 w-4' }) {
  return renderPremiumIcon(Sparkles, className);
}

export function PolishBottleIcon({ className = 'h-5 w-5' }) {
  return renderPremiumIcon(PaintbrushVertical, className);
}

export function GemIcon({ className = 'h-5 w-5' }) {
  return renderPremiumIcon(Gem, className);
}

export function CalendarIcon({ className = 'h-5 w-5' }) {
  return renderPremiumIcon(CalendarDays, className);
}

export function ValidationIcon({ className = 'h-5 w-5' }) {
  return renderPremiumIcon(BadgeCheck, className);
}

export function AdminShieldIcon({ className = 'h-5 w-5' }) {
  return renderPremiumIcon(ShieldCheck, className);
}

export function ScanIcon({ className = 'h-5 w-5' }) {
  return renderPremiumIcon(ScanLine, className);
}

export function MenuIcon({ className = 'h-5 w-5' }) {
  return renderPremiumIcon(Menu, className);
}

export function CloseIcon({ className = 'h-5 w-5' }) {
  return renderPremiumIcon(X, className);
}

export function ArrowLeftIcon({ className = 'h-5 w-5' }) {
  return renderPremiumIcon(ChevronLeft, className);
}

export function ArrowRightIcon({ className = 'h-5 w-5' }) {
  return renderPremiumIcon(ChevronRight, className);
}

export function LaunchIcon({ className = 'h-4 w-4' }) {
  return renderPremiumIcon(ArrowRight, className);
}

export function ErrorIcon({ className = 'h-5 w-5' }) {
  return renderPremiumIcon(AlertCircle, className);
}

export function SuccessIcon({ className = 'h-5 w-5' }) {
  return renderPremiumIcon(BadgeCheck, className);
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

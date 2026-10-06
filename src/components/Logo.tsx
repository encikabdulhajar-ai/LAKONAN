import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showSubtitle = true }) => {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Custom Mark: Open Academic Book nested inside an intelligent conversation dialogue node with a scholar compass star */}
      <div className={`${iconSize} rounded-xl bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-sky-950/20 ring-1 ring-white/20 shrink-0 relative overflow-hidden`}>
        {/* Subtle background glow */}
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-teal-400/30 rounded-full blur-sm pointer-events-none" />

        <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6 stroke-white stroke-[1.75]" strokeLinecap="round" strokeLinejoin="round">
          {/* Speech bubble outline */}
          <path d="M5 8C5 5.79 6.79 4 9 4H23C25.21 4 27 5.79 27 8V18C27 20.21 25.21 22 23 22H13L7 27V22H9" stroke="currentColor" strokeWidth="1.6" fill="rgba(255,255,255,0.06)" />
          {/* Open Academic Book spine & pages inside dialogue */}
          <path d="M10 16.5C12 15 14.5 15 16 16.5C17.5 15 20 15 22 16.5V11C20 9.5 17.5 9.5 16 11C14.5 9.5 12 9.5 10 11V16.5Z" fill="rgba(255,255,255,0.2)" stroke="currentColor" strokeWidth="1.6" />
          <path d="M16 11V16.5" stroke="currentColor" strokeWidth="1.6" />
          {/* Guiding research star dot */}
          <circle cx="16" cy="7.5" r="1.2" fill="#38bdf8" stroke="none" />
        </svg>
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight text-slate-900 font-sans ${titleSize}`}>
            LAKONAN
          </span>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 tracking-wide border border-sky-200">
            AI
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] font-medium text-slate-500 tracking-tight truncate max-w-[230px]">
            Layanan Konsultasi Akademik dan Penelitian
          </span>
        )}
      </div>
    </div>
  );
};

import React from 'react';

interface LogoKepriProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  invertedLabel?: boolean;
}

export const LogoKepri: React.FC<LogoKepriProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
  invertedLabel = false,
}) => {
  const sizeClasses = {
    xs: 'w-6 h-7',
    sm: 'w-9 h-11',
    md: 'w-12 h-14',
    lg: 'w-16 h-20',
    xl: 'w-24 h-28',
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative shrink-0 ${sizeClasses[size]}`}>
        <img
          src="/logo-kepri.svg"
          alt="Logo Provinsi Kepulauan Riau - Berpancang Amanah Bersauh Marwah"
          className="w-full h-full object-contain drop-shadow-md select-none transition-transform hover:scale-105"
          loading="eager"
        />
      </div>

      {showLabel && (
        <div className="flex flex-col min-w-0">
          <span
            className={`text-xs sm:text-sm font-extrabold uppercase tracking-tight leading-tight ${
              invertedLabel ? 'text-white' : 'text-slate-900'
            }`}
          >
            Dinas Perpustakaan dan Kearsipan
          </span>
          <span
            className={`text-[11px] sm:text-xs font-bold tracking-wide uppercase ${
              invertedLabel ? 'text-sky-300' : 'text-sky-700'
            }`}
          >
            Provinsi Kepulauan Riau
          </span>
        </div>
      )}
    </div>
  );
};

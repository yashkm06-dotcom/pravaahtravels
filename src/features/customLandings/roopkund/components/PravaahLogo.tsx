/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PravaahLogoProps {
  className?: string;
  theme?: 'light' | 'dark';
  variant?: 'light' | 'dark';
  collapsed?: boolean;
}

export const PravaahLogo: React.FC<PravaahLogoProps> = ({
  className = '',
  theme,
  variant,
  collapsed = false,
}) => {
  // Support both theme and variant prop
  const isDark = (variant === 'dark' || theme === 'dark') || (!variant && !theme) || (variant === 'light'); // Default to dark on header/footer
  const isExplicitLight = theme === 'light' && variant !== 'light';

  return (
    <div className={`flex items-center gap-3 select-none group cursor-pointer ${className}`}>
      {/* Pravaah Sacred Geometric Emblem - Flowing Himalayan Glacier and Rivers */}
      <div 
        className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-transform duration-500 group-hover:scale-105"
        style={{
          borderColor: isExplicitLight ? 'rgba(19, 78, 53, 0.3)' : 'rgba(229, 195, 120, 0.4)',
          backgroundColor: isExplicitLight ? 'rgba(19, 78, 53, 0.08)' : 'rgba(229, 195, 120, 0.1)'
        }}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 sm:w-6 sm:h-6"
        >
          {/* Twin Himalayan Ridgelines */}
          <path
            d="M5 23L13 10L19 19L23 13L27 23"
            stroke={isExplicitLight ? '#134E35' : '#E5C378'}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Sacred Flowing Stream (Pravaah) */}
          <path
            d="M6 26C10 24 13 27 17 25C21 23 23 26 26 24"
            stroke={isExplicitLight ? '#10B981' : '#E5C378'}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Peak Star / Summit Zenith */}
          <circle cx="13" cy="7.5" r="1.25" fill="#E5C378" />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col">
          <span
            className={`font-playfair text-base sm:text-lg font-bold tracking-[0.2em] uppercase leading-none transition-colors duration-300 ${
              isExplicitLight ? 'text-[#1D2530] group-hover:text-[#134E35]' : 'text-white group-hover:text-[#E5C378]'
            }`}
          >
            PRAVAAH
          </span>
          <span
            className={`text-[9px] sm:text-[10px] tracking-[0.28em] uppercase font-oswald font-medium mt-1 ${
              isExplicitLight ? 'text-[#134E35]' : 'text-[#E5C378]/90'
            }`}
          >
            HIMALAYAN EXPEDITIONS
          </span>
        </div>
      )}
    </div>
  );
};

export default PravaahLogo;

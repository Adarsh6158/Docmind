import React from 'react';
import { cn } from '../lib/utils';

interface SearchWaveBackgroundProps {
  className?: string;
}

/**
 * Minimal & Ultra-Premium Lavender Wave Background for DocMind Search & Chunks
 *
 * Clean, calm, luxury aesthetic inspired by Apple & Linear:
 * - 2 graceful, flowing silk wave ribbons framing top and bottom
 * - Soft, luminous pastel lavender tones (#E9DCFA, #F2EBFC, #FAF7FE)
 * - Delicate hairline crest contours for subtle organic depth
 * - Wide negative space keeping the center uncluttered and text perfectly crisp
 * - Refined obsidian ambiance in dark mode
 */
export const SearchWaveBackground: React.FC<SearchWaveBackgroundProps> = ({ className }) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-0 pointer-events-none select-none overflow-hidden z-0 transition-opacity duration-300',
        className
      )}
    >
      {/* Light Mode: Minimal, Luminous Pastel Lavender Waves */}
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full dark:hidden"
      >
        <defs>
          {/* Top Silk Wave Gradient */}
          <linearGradient id="swTopGrad" x1="0%" y1="0%" x2="60%" y2="100%">
            <stop offset="0%" stopColor="#E6D6FA" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#EFE5FD" stopOpacity="0.30" />
            <stop offset="75%" stopColor="#F7F2FE" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Top Secondary Whisper Wave */}
          <linearGradient id="swTopSubtle" x1="10%" y1="0%" x2="90%" y2="80%">
            <stop offset="0%" stopColor="#DFCBF8" stopOpacity="0.30" />
            <stop offset="50%" stopColor="#ECE0FD" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Bottom Silk Wave Gradient */}
          <linearGradient id="swBottomGrad" x1="100%" y1="100%" x2="30%" y2="20%">
            <stop offset="0%" stopColor="#E6D6FA" stopOpacity="0.42" />
            <stop offset="45%" stopColor="#EFE5FD" stopOpacity="0.25" />
            <stop offset="80%" stopColor="#F8F4FE" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Delicate Hairline Crest Gradients */}
          <linearGradient id="swCrestTop" x1="0%" y1="0%" x2="100%" y2="30%">
            <stop offset="0%" stopColor="#BA97EC" stopOpacity="0.45" />
            <stop offset="45%" stopColor="#CCAFF4" stopOpacity="0.35" />
            <stop offset="80%" stopColor="#DEC9FA" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="swCrestBottom" x1="100%" y1="100%" x2="0%" y2="40%">
            <stop offset="0%" stopColor="#BA97EC" stopOpacity="0.40" />
            <stop offset="50%" stopColor="#CCAFF4" stopOpacity="0.30" />
            <stop offset="90%" stopColor="#DEC9FA" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Clean Base Canvas */}
        <rect width="1440" height="900" fill="#FFFFFF" />

        {/* Top Harmonic Silk Wave */}
        <path
          d="M-20,0 L-20,240 C180,320 440,180 720,250 C980,315 1240,180 1460,220 L1460,0 Z"
          fill="url(#swTopGrad)"
        />
        {/* Top Wave Hairline Ridge */}
        <path
          d="M-20,240 C180,320 440,180 720,250 C980,315 1240,180 1460,220"
          stroke="url(#swCrestTop)"
          strokeWidth="1.25"
          fill="none"
        />

        {/* Subtle Top Counter-Curve */}
        <path
          d="M-20,0 L-20,150 C220,220 480,90 760,160 C1020,220 1260,110 1460,135 L1460,0 Z"
          fill="url(#swTopSubtle)"
        />

        {/* Bottom Silk Wave */}
        <path
          d="M-20,900 L-20,740 C260,650 560,780 860,680 C1120,590 1340,730 1460,670 L1460,900 Z"
          fill="url(#swBottomGrad)"
        />
        {/* Bottom Wave Hairline Ridge */}
        <path
          d="M-20,740 C260,650 560,780 860,680 C1120,590 1340,730 1460,670"
          stroke="url(#swCrestBottom)"
          strokeWidth="1.25"
          fill="none"
        />
      </svg>

      {/* Dark Mode: Luxury Obsidian Ambiance with Gentle Violet Wave Whispers */}
      <div className="hidden dark:block w-full h-full relative overflow-hidden bg-[#0c0c0e]">
        <svg
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="darkSwTop" x1="0%" y1="0%" x2="60%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.12" />
              <stop offset="60%" stopColor="#6D28D9" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#0c0c0e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="darkSwBottom" x1="100%" y1="100%" x2="30%" y2="20%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.10" />
              <stop offset="60%" stopColor="#4C1D95" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#0c0c0e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="darkSwCrest" x1="0%" y1="0%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#818CF8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Dark Top Wave */}
          <path
            d="M-20,0 L-20,240 C180,320 440,180 720,250 C980,315 1240,180 1460,220 L1460,0 Z"
            fill="url(#darkSwTop)"
          />
          <path
            d="M-20,240 C180,320 440,180 720,250 C980,315 1240,180 1460,220"
            stroke="url(#darkSwCrest)"
            strokeWidth="1"
            fill="none"
          />

          {/* Dark Bottom Wave */}
          <path
            d="M-20,900 L-20,740 C260,650 560,780 860,680 C1120,590 1340,730 1460,670 L1460,900 Z"
            fill="url(#darkSwBottom)"
          />
          <path
            d="M-20,740 C260,650 560,780 860,680 C1120,590 1340,730 1460,670"
            stroke="url(#darkSwCrest)"
            strokeWidth="1"
            fill="none"
          />
        </svg>

        {/* Ambient Ethereal Glow */}
        <div className="absolute -top-[10%] left-[20%] w-[35vw] h-[35vw] rounded-full bg-violet-950/20 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[30vw] h-[30vw] rounded-full bg-indigo-950/15 blur-[100px] pointer-events-none" />
      </div>
    </div>
  );
};

export default SearchWaveBackground;

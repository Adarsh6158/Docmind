import React from 'react';
import { cn } from '../lib/utils';

interface DocMindLogoProps {
  size?: number;
  className?: string;
  variant?: 'icon' | 'wordmark' | 'watermark';
  /** If true, omit the dark rounded background tile */
  unframed?: boolean;
}

/**
 * DocMind Official Product Brand Mark & Wordmark
 * Derived directly from official /public/favicon.svg and /public/docmind-wordmark.svg.
 * Bold geometric 'D' with electric-blue folded page accent on a #111318 rounded tile.
 */
export const DocMindLogo: React.FC<DocMindLogoProps> = ({
  size = 24,
  className,
  variant = 'icon',
  unframed = false,
}) => {
  // 1. Watermark: Large, subtle geometric silhouette for backgrounds
  if (variant === 'watermark') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('select-none pointer-events-none opacity-5 dark:opacity-[0.03]', className)}
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M132 112h126c108 0 174 56 174 144S366 400 258 400H132V112Zm82 76v136h44c58 0 91-23 91-68s-33-68-91-68h-44Z"
        />
        <path
          d="M304 112h-1l-1 77h77c-7-35-32-63-75-77Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  // 2. Wordmark: Official symbol + DocMind typography (theme adaptive)
  if (variant === 'wordmark') {
    const height = size;
    const width = Math.round((size * 900) / 220);

    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 900 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('select-none flex-shrink-0', className)}
        role="img"
        aria-label="DocMind"
      >
        <defs>
          <linearGradient id="docmind-wordmark-accent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#66D5FF" />
            <stop offset="1" stopColor="#3978FF" />
          </linearGradient>
        </defs>
        <g transform="translate(8 8) scale(.3983)">
          <rect x="20" y="20" width="472" height="472" rx="112" fill="#111318" />
          <path
            fill="#FFFFFF"
            fillRule="evenodd"
            d="M132 112h126c108 0 174 56 174 144S366 400 258 400H132V112Zm82 76v136h44c58 0 91-23 91-68s-33-68-91-68h-44Z"
          />
          <path
            d="M304 112h-1l-1 77h77c-7-35-32-63-75-77Z"
            fill="url(#docmind-wordmark-accent)"
          />
        </g>
        <text
          x="220"
          y="143"
          className="fill-[#17191F] dark:fill-[#F4F4F5]"
          fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
          fontSize="104"
          fontWeight="650"
          letterSpacing="-5"
        >
          DocMind
        </text>
      </svg>
    );
  }

  // 3. Icon (Favicon mark): Official 512x512 tile
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('select-none flex-shrink-0', className)}
      role="img"
      aria-label="DocMind Icon"
    >
      <defs>
        <linearGradient id="docmind-favicon-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#66D5FF" />
          <stop offset="1" stopColor="#3978FF" />
        </linearGradient>
      </defs>
      {!unframed && (
        <rect x="20" y="20" width="472" height="472" rx="112" fill="#111318" />
      )}
      <path
        fill={unframed ? 'currentColor' : '#FFFFFF'}
        fillRule="evenodd"
        d="M132 112h126c108 0 174 56 174 144S366 400 258 400H132V112Zm82 76v136h44c58 0 91-23 91-68s-33-68-91-68h-44Z"
      />
      <path
        d="M304 112h-1l-1 77h77c-7-35-32-63-75-77Z"
        fill="url(#docmind-favicon-accent)"
      />
    </svg>
  );
};

export default DocMindLogo;

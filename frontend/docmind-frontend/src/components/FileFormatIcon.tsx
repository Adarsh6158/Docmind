import React from 'react';
import { cn } from '../lib/utils';

export type FileFormat = 'pdf' | 'docx' | 'csv' | 'txt' | 'md' | 'unknown';

interface FileFormatIconProps {
  format?: FileFormat;
  filename?: string;
  contentType?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

/**
 * Resolves file format from explicit format string, filename, or MIME type
 */
function resolveFileFormat(filename?: string, contentType?: string, explicitFormat?: string): FileFormat {
  if (explicitFormat) {
    const clean = explicitFormat.toLowerCase().replace(/^\./, '');
    if (['pdf', 'docx', 'doc'].includes(clean)) return clean === 'doc' ? 'docx' : (clean as FileFormat);
    if (['csv', 'xlsx', 'xls'].includes(clean)) return 'csv';
    if (['md', 'markdown'].includes(clean)) return 'md';
    if (['txt', 'text'].includes(clean)) return 'txt';
  }

  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx' || ext === 'doc') return 'docx';
    if (ext === 'csv' || ext === 'tsv' || ext === 'xlsx' || ext === 'xls') return 'csv';
    if (ext === 'md' || ext === 'markdown') return 'md';
    if (ext === 'txt' || ext === 'log') return 'txt';
  }

  if (contentType) {
    const type = contentType.toLowerCase();
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('word') || type.includes('officedocument.wordprocessingml')) return 'docx';
    if (type.includes('csv') || type.includes('spreadsheet') || type.includes('excel')) return 'csv';
    if (type.includes('markdown')) return 'md';
    if (type.includes('text/plain')) return 'txt';
  }

  return 'unknown';
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const FORMAT_CONFIG: Record<FileFormat, { src: string; alt: string; label: string }> = {
  pdf: { src: '/icons/pdf.svg', alt: 'Adobe PDF Document', label: 'PDF' },
  docx: { src: '/icons/docx.svg', alt: 'Microsoft Word Document', label: 'DOCX' },
  csv: { src: '/icons/csv.svg', alt: 'Microsoft Excel / CSV Spreadsheet', label: 'CSV' },
  md: { src: '/icons/md.svg', alt: 'Markdown Document', label: 'MD' },
  txt: { src: '/icons/txt.svg', alt: 'Plain Text Document', label: 'TXT' },
  unknown: { src: '/icons/txt.svg', alt: 'Document', label: 'DOC' },
};

/**
 * Authentic Document Format Icons
 * Uses real, official downloaded vector assets:
 * - Adobe Acrobat Reader (PDF)
 * - Microsoft Office Word (DOCX)
 * - Microsoft Office Excel (CSV/XLSX)
 * - Official Markdown Mark (MD)
 * - Structured Document Text (TXT)
 */
export const FileFormatIcon: React.FC<FileFormatIconProps> = ({
  format,
  filename,
  contentType,
  size = 'sm',
  className,
  showBadge = false,
}) => {
  const resolved = format || resolveFileFormat(filename, contentType);
  const px = SIZE_MAP[size];
  const config = FORMAT_CONFIG[resolved] || FORMAT_CONFIG.unknown;

  const iconElement = (
    <img
      src={config.src}
      width={px}
      height={px}
      alt={config.alt}
      className={cn('shrink-0 select-none object-contain pointer-events-none rounded-[2px]', className)}
      loading="eager"
      decoding="async"
    />
  );

  if (!showBadge) {
    return iconElement;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#f5f5f5] dark:bg-white/[0.06] border border-[#e5e5e5] dark:border-white/[0.08] text-xs font-sans',
        className
      )}
    >
      {iconElement}
      <span className="text-[#171717] dark:text-[#f4f4f5] uppercase font-mono text-[10px] font-semibold">
        {config.label}
      </span>
    </span>
  );
};

export default FileFormatIcon;

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import {
  X, CheckCircle2, AlertCircle, Loader2, Plus, Trash2
} from 'lucide-react';
import { documentApi } from '../services/api';
import { useDocumentStore } from '../store/documentStore';
import type { UploadingFile } from '../types';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { FileFormatIcon } from './FileFormatIcon';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/csv': ['.csv'],
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export const UploadDialog: React.FC<UploadDialogProps> = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { fetchDocuments } = useDocumentStore();

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: UploadingFile[] = accepted.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      progress: 0,
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    const pending = files.filter((f) => f.status === 'pending');
    if (pending.length === 0) return;
    setIsUploading(true);

    await Promise.all(
      pending.map(async (uf) => {
        setFiles((prev) => prev.map((f) => (f.id === uf.id ? { ...f, status: 'uploading' } : f)));
        try {
          const res = await documentApi.upload(uf.file, (pct) => {
            setFiles((prev) => prev.map((f) => (f.id === uf.id ? { ...f, progress: pct } : f)));
          });
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uf.id ? { ...f, status: 'done', progress: 100, result: res.data } : f
            )
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Upload failed';
          setFiles((prev) => prev.map((f) => (f.id === uf.id ? { ...f, status: 'error', error: msg } : f)));
        }
      })
    );

    setIsUploading(false);
    await fetchDocuments();
    const successCount = files.filter((f) => f.status !== 'error').length;
    if (successCount > 0) toast.success(`${successCount} document(s) uploaded & indexed`);
  };

  const handleClose = () => {
    if (!isUploading) { setFiles([]); onClose(); }
  };

  const allDone = files.length > 0 && files.every((f) => f.status === 'done' || f.status === 'error');
  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg max-h-[92dvh] flex flex-col glass-panel rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[#e5e5e5] dark:border-white/[0.08] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-7 bg-[#f5f5f5] dark:bg-white/[0.08] border border-[#e5e5e5] dark:border-white/[0.1] rounded-lg flex items-center justify-center">
              <img src="/icons/UploadToCloud.png" alt="Upload" className="size-4 object-contain" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#171717] dark:text-[#f4f4f5] tracking-tight">Upload documents</h2>
              <p className="text-[11px] sm:text-xs text-[#737373] dark:text-[#a3a3a3]">PDF, DOCX, TXT, MD, and CSV supported</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="size-8 sm:size-7 flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-white/[0.06] rounded-lg transition-colors text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] disabled:opacity-40 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Drop zone */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1">
          <div
            {...getRootProps()}
            className={cn(
              'border border-dashed rounded-xl p-4 sm:p-8 text-center cursor-pointer transition-colors select-none active:scale-[0.99]',
              isDragActive
                ? 'border-[#151515] bg-[#fafafa] dark:border-white dark:bg-white/[0.04]'
                : 'border-[#e5e5e5] hover:border-neutral-400 bg-[#fafafa]/60 hover:bg-[#fafafa] dark:border-white/[0.12] dark:hover:border-white/[0.22] dark:bg-transparent dark:hover:bg-white/[0.02]'
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{
                  y: isDragActive ? -3 : [-1.5, 2, -1.5],
                  scale: isDragActive ? 1.08 : 1,
                }}
                transition={{
                  y: isDragActive
                    ? { type: 'spring', stiffness: 300, damping: 15 }
                    : { repeat: Infinity, duration: 3, ease: 'easeInOut' },
                  scale: { type: 'spring', stiffness: 300, damping: 15 },
                }}
                className="size-11 sm:size-12 rounded-2xl bg-white dark:bg-[#18181c] border border-[#e5e5e5] dark:border-white/[0.08] flex items-center justify-center shadow-2xs"
              >
                <img
                  loading="lazy"
                  src="/icons/UploadToCloud.png"
                  alt="Upload to Cloud"
                  className={cn(
                    'size-7 sm:size-8 object-contain drop-shadow-xs transition-opacity duration-300',
                    isDragActive ? 'opacity-100 scale-105' : 'opacity-85'
                  )}
                />
              </motion.div>
              <div>
                <p className="text-xs font-medium text-[#171717] dark:text-[#f4f4f5]">
                  {isDragActive ? 'Drop files here' : 'Tap to select documents'}
                </p>
                <p className="text-[#737373] dark:text-[#a3a3a3] text-[11px] mt-0.5">
                  or <span className="text-[#171717] dark:text-[#f4f4f5] underline underline-offset-2">browse files from device</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center mt-2">
                {(['pdf', 'docx', 'csv', 'md', 'txt'] as const).map((fmt) => (
                  <span
                    key={fmt}
                    className="inline-flex items-center gap-1 sm:gap-1.5 text-xs font-sans px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-white dark:bg-white/[0.06] text-[#171717] dark:text-[#f4f4f5] border border-[#e5e5e5] dark:border-white/[0.08] shadow-2xs"
                  >
                    <FileFormatIcon format={fmt} size="xs" />
                    <span className="font-mono text-[10px] sm:text-[11px] font-medium text-[#525252] dark:text-[#d4d4d8]">.{fmt}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          {files.length > 0 && (
            <div className="flex items-center justify-between mt-3 px-1 text-xs text-[#737373] dark:text-[#a3a3a3]">
              <span className="tabular-nums text-[11px] sm:text-xs">{files.length} file(s) · {formatBytes(totalSize)}</span>
              <button
                onClick={() => setFiles([])}
                disabled={isUploading}
                className="text-[#737373] hover:text-rose-600 dark:text-[#a3a3a3] dark:hover:text-rose-400 flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer text-[11px] sm:text-xs"
              >
                <Trash2 className="size-3" />
                <span>Clear queue</span>
              </button>
            </div>
          )}

          {/* File Queue List */}
          {files.length > 0 && (
            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {files.map((uf) => (
                <div key={uf.id} className="p-2.5 bg-[#fafafa] dark:bg-[#18181c] rounded-xl border border-[#e5e5e5] dark:border-white/[0.06] space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileFormatIcon filename={uf.file.name} size="sm" />
                      <p className="text-xs text-[#171717] dark:text-[#f4f4f5] font-medium truncate max-w-[220px]">{uf.file.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-mono tabular-nums text-[#a3a3a3]">{formatBytes(uf.file.size)}</span>
                      {uf.status === 'pending' && (
                        <button onClick={() => removeFile(uf.id)} className="text-[#a3a3a3] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer">
                          <X className="size-3" />
                        </button>
                      )}
                      {uf.status === 'uploading' && <Loader2 className="size-3 text-[#171717] dark:text-[#f4f4f5] animate-spin" />}
                      {uf.status === 'done' && <CheckCircle2 className="size-3.5 text-emerald-500" />}
                      {uf.status === 'error' && <AlertCircle className="size-3.5 text-rose-500" />}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#e5e5e5] dark:bg-white/[0.08] rounded-full h-1 overflow-hidden">
                    <div
                      className={cn(
                        'h-1 rounded-full transition-all duration-200',
                        uf.status === 'done' ? 'bg-emerald-500' :
                        uf.status === 'error' ? 'bg-rose-500' :
                        uf.status === 'uploading' ? 'bg-[#151515] dark:bg-white' : 'bg-transparent'
                      )}
                      style={{ width: uf.status === 'pending' ? '0%' : `${uf.progress}%` }}
                    />
                  </div>

                  {uf.status === 'error' && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">{uf.error}</p>
                  )}
                  {uf.status === 'done' && uf.result && (
                    <p className="text-xs font-sans font-medium text-emerald-600 dark:text-emerald-400">
                      ✓ {uf.result.chunksCreated ?? 0} vector chunks embedded
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 sm:px-5 sm:py-3.5 border-t border-[#e5e5e5] dark:border-white/[0.08] bg-[#fafafa] dark:bg-[#18181c] flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="flex-1 sm:flex-initial h-9 px-4 text-xs font-medium text-[#737373] hover:text-[#171717] dark:text-[#a3a3a3] dark:hover:text-[#f4f4f5] border border-[#e5e5e5] dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/[0.16] rounded-xl transition-colors disabled:opacity-50 cursor-pointer bg-white dark:bg-[#141416] shadow-2xs active:scale-95"
          >
            {allDone ? 'Done' : 'Cancel'}
          </button>
          {!allDone && (
            <button
              onClick={handleUpload}
              disabled={isUploading || pendingCount === 0}
              className={cn(
                'flex-1 sm:flex-initial h-9 flex items-center justify-center gap-1.5 px-4 text-xs font-medium rounded-xl border shadow-2xs cursor-pointer',
                !isUploading && pendingCount > 0
                  ? 'bg-[#171717] hover:bg-[#303030] active:bg-[#404040] text-white border-transparent transition-colors duration-150 ease-in-out'
                  : 'bg-[#f5f5f5] dark:bg-white/[0.04] text-[#a3a3a3] border-transparent cursor-not-allowed transition-colors duration-150 ease-in-out'
              )}
            >
              {isUploading ? (
                <><Loader2 className="size-3.5 animate-spin text-white" /> Ingesting…</>
              ) : (
                <><Plus className="size-3.5 text-white" /> Upload {pendingCount > 0 && `(${pendingCount})`}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadDialog;

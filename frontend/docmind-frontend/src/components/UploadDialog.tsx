import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, Plus,
  File, FileType, FilePieChart, Trash2
} from 'lucide-react';
import { documentApi } from '../services/api';
import { useDocumentStore } from '../store/documentStore';
import type { UploadingFile } from '../types';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

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

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="size-4 text-zinc-600 dark:text-zinc-300" strokeWidth={1.75} />;
  if (ext === 'csv') return <FilePieChart className="size-4 text-zinc-600 dark:text-zinc-300" strokeWidth={1.75} />;
  if (ext === 'docx') return <FileType className="size-4 text-zinc-600 dark:text-zinc-300" strokeWidth={1.75} />;
  return <File className="size-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.75} />;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="size-7 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.1] rounded-lg flex items-center justify-center">
              <Upload className="size-3.5 text-zinc-800 dark:text-zinc-200" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">Upload & Ingest</h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Supported formats: PDF, DOCX, TXT, MD, CSV</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="size-7 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-40 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Drop zone */}
        <div className="p-5">
          <div
            {...getRootProps()}
            className={cn(
              'border border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors select-none',
              isDragActive
                ? 'border-zinc-800 bg-zinc-50 dark:border-zinc-300 dark:bg-white/[0.04]'
                : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-100/50 dark:border-white/[0.12] dark:hover:border-white/[0.25] dark:bg-transparent dark:hover:bg-white/[0.02]'
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2.5">
              <div className="size-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shadow-xs">
                <Upload className="size-5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {isDragActive ? 'Drop files here' : 'Drag and drop documents here'}
                </p>
                <p className="text-zinc-500 text-[11px] mt-0.5">
                  or <span className="text-zinc-900 dark:text-zinc-300 underline underline-offset-2">choose from your device</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-1 justify-center mt-1">
                {['PDF', 'DOCX', 'TXT', 'MD', 'CSV'].map((ext) => (
                  <span key={ext} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.06]">
                    .{ext.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          {files.length > 0 && (
            <div className="flex items-center justify-between mt-3 px-1 text-[11px] font-mono">
              <span className="text-zinc-500 dark:text-zinc-400 tabular-nums">{files.length} file(s) · {formatBytes(totalSize)}</span>
              <button
                onClick={() => setFiles([])}
                disabled={isUploading}
                className="text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Trash2 className="size-3" />
                <span>Clear queue</span>
              </button>
            </div>
          )}

          {/* File Queue List */}
          {files.length > 0 && (
            <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {files.map((uf) => (
                <div key={uf.id} className="p-2.5 bg-zinc-50 dark:bg-zinc-950/80 rounded-xl border border-zinc-200 dark:border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(uf.file.name)}
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 font-mono truncate max-w-[220px]">{uf.file.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-mono tabular-nums text-zinc-500">{formatBytes(uf.file.size)}</span>
                      {uf.status === 'pending' && (
                        <button onClick={() => removeFile(uf.id)} className="text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors cursor-pointer">
                          <X className="size-3" />
                        </button>
                      )}
                      {uf.status === 'uploading' && <Loader2 className="size-3 text-zinc-600 dark:text-zinc-300 animate-spin" />}
                      {uf.status === 'done' && <CheckCircle2 className="size-3.5 text-emerald-500 dark:text-emerald-400" />}
                      {uf.status === 'error' && <AlertCircle className="size-3.5 text-rose-500 dark:text-rose-400" />}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-zinc-200 dark:bg-zinc-900 rounded-full h-1 overflow-hidden">
                    <div
                      className={cn(
                        'h-1 rounded-full transition-all duration-200',
                        uf.status === 'done' ? 'bg-emerald-500 dark:bg-emerald-400' :
                        uf.status === 'error' ? 'bg-rose-500' :
                        uf.status === 'uploading' ? 'bg-zinc-700 dark:bg-zinc-300' : 'bg-transparent'
                      )}
                      style={{ width: uf.status === 'pending' ? '0%' : `${uf.progress}%` }}
                    />
                  </div>

                  {uf.status === 'error' && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">{uf.error}</p>
                  )}
                  {uf.status === 'done' && uf.result && (
                    <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      ✓ {uf.result.chunksCreated ?? 0} vector chunks embedded
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-950/40">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-3.5 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.16] rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {allDone ? 'Done' : 'Cancel'}
          </button>
          {!allDone && (
            <button
              onClick={handleUpload}
              disabled={isUploading || pendingCount === 0}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-all border shadow-xs cursor-pointer',
                !isUploading && pendingCount > 0
                  ? 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 border-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:border-white/20 active:scale-[0.98]'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-transparent cursor-not-allowed opacity-50'
              )}
            >
              {isUploading ? (
                <><Loader2 className="size-3.5 animate-spin" /> Ingesting…</>
              ) : (
                <><Plus className="size-3.5" /> Upload {pendingCount > 0 && `(${pendingCount})`}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadDialog;

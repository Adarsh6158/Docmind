import React, { useState } from 'react';
import {
  FileText, Trash2, ChevronDown, ChevronUp,
  CheckCircle2, Clock, AlertCircle, Loader2,
  Upload, RefreshCw, X, FileType, FilePieChart, File,
  FolderOpen, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '../store/documentStore';
import { useConversationStore } from '../store/conversationStore';
import type { DocumentMetadataDto, DocumentStatus } from '../types';
import ChatsPanel from './ChatsPanel';
import { cn } from '../lib/utils';

interface SidebarProps {
  onUploadClick: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getFileIcon(contentType: string): React.ReactNode {
  if (contentType.includes('pdf')) return <FileText className="size-3.5 text-zinc-600 dark:text-zinc-300" strokeWidth={1.75} />;
  if (contentType.includes('word') || contentType.includes('docx')) return <FileType className="size-3.5 text-zinc-600 dark:text-zinc-300" strokeWidth={1.75} />;
  if (contentType.includes('csv')) return <FilePieChart className="size-3.5 text-zinc-600 dark:text-zinc-300" strokeWidth={1.75} />;
  return <File className="size-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.75} />;
}

const STATUS_CONFIG: Record<DocumentStatus, { icon: React.ReactNode; badgeClass: string; label: string }> = {
  INDEXED: {
    icon: <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 flex-shrink-0" />,
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400/90 dark:bg-emerald-400/[0.08] dark:border-emerald-400/20',
    label: 'Indexed',
  },
  PROCESSING: {
    icon: <Loader2 className="size-2.5 animate-spin text-amber-500 dark:text-amber-400 flex-shrink-0" />,
    badgeClass: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400/90 dark:bg-amber-400/[0.08] dark:border-amber-400/20',
    label: 'Processing',
  },
  UPLOADING: {
    icon: <Clock className="size-2.5 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />,
    badgeClass: 'text-zinc-700 bg-zinc-100 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700',
    label: 'Uploading',
  },
  FAILED: {
    icon: <AlertCircle className="size-2.5 text-rose-500 dark:text-rose-400 flex-shrink-0" />,
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400/90 dark:bg-rose-400/[0.08] dark:border-rose-400/20',
    label: 'Failed',
  },
};

const StatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.INDEXED;
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono border', cfg.badgeClass)}>
      {cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
};

const SkeletonDoc: React.FC = () => (
  <div className="p-3 rounded-xl border border-zinc-200 dark:border-white/[0.05] bg-white dark:bg-zinc-900/40 flex items-center gap-3 animate-pulse">
    <div className="size-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4" />
      <div className="h-2 bg-zinc-100/60 dark:bg-zinc-800/60 rounded w-1/2" />
    </div>
  </div>
);

const DocumentItem: React.FC<{ doc: DocumentMetadataDto }> = ({ doc }) => {
  const { selectedDocumentId, setSelectedDocumentId, deleteDocument } = useDocumentStore();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isSelected = selectedDocumentId === doc.id;

  const handleDelete = () => {
    if (confirmDelete) {
      deleteDocument(doc.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'rounded-xl border transition-all overflow-hidden',
        isSelected
          ? 'border-zinc-300 dark:border-white/[0.2] bg-zinc-100/80 dark:bg-zinc-800/80 shadow-xs'
          : 'border-zinc-200/80 dark:border-white/[0.06] bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-white/[0.12] hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
      )}
    >
      {/* Main item row */}
      <div
        className="flex items-start gap-2.5 p-2.5 cursor-pointer select-none"
        onClick={() => setSelectedDocumentId(isSelected ? null : doc.id)}
      >
        <div className={cn(
          'size-7 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors',
          isSelected
            ? 'bg-zinc-200 dark:bg-zinc-700/60 border-zinc-300 dark:border-white/[0.15]'
            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-white/[0.06]'
        )}>
          {getFileIcon(doc.contentType)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate leading-snug" title={doc.filename}>
            {doc.filename}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <StatusBadge status={doc.status} />
            <span className="text-[10px] font-mono text-zinc-500 tabular-nums">{formatBytes(doc.fileSize)}</span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
            className="size-6 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            aria-label={confirmDelete ? 'Confirm delete' : 'Delete document'}
            className={cn(
              'h-6 flex items-center justify-center rounded-md text-xs transition-colors cursor-pointer',
              confirmDelete
                ? 'px-1.5 bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/25 font-mono text-[10px]'
                : 'w-6 text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
            )}
          >
            {confirmDelete ? 'Delete?' : <Trash2 className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="px-2.5 pb-2.5 pt-1 border-t border-zinc-200 dark:border-white/[0.05] overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {doc.totalChunks != null && (
                <div className="bg-zinc-50 dark:bg-zinc-950/80 rounded-lg p-1.5 text-center border border-zinc-200 dark:border-white/[0.04]">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">{doc.totalChunks}</p>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">chunks</p>
                </div>
              )}
              {doc.totalPages != null && (
                <div className="bg-zinc-50 dark:bg-zinc-950/80 rounded-lg p-1.5 text-center border border-zinc-200 dark:border-white/[0.04]">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">{doc.totalPages}</p>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">pages</p>
                </div>
              )}
              <div className="bg-zinc-50 dark:bg-zinc-950/80 rounded-lg p-1.5 text-center border border-zinc-200 dark:border-white/[0.04]">
                <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">{formatDate(doc.createdAt)}</p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">added</p>
              </div>
            </div>
            {doc.errorMessage && (
              <div className="mt-1.5 px-2 py-1 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-md">
                <p className="text-[11px] text-rose-600 dark:text-rose-300">{doc.errorMessage}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ onUploadClick }) => {
  const {
    documents,
    isLoadingDocuments,
    fetchDocuments,
    selectedDocumentId,
    setSelectedDocumentId,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useDocumentStore();

  const { conversations, loadChats } = useConversationStore();
  const [sidebarTab, setSidebarTab] = useState<'documents' | 'chats'>('documents');

  const handleRefresh = () => {
    if (sidebarTab === 'documents') {
      fetchDocuments();
    } else {
      loadChats();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xs z-30 md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'flex flex-col h-full bg-zinc-50/70 dark:bg-[#0e0e11] border-r border-zinc-200 dark:border-white/[0.08] transition-all duration-200 flex-shrink-0 z-30 md:static fixed inset-y-0 left-0 top-13 md:top-0',
          isSidebarOpen ? 'w-72 shadow-xl md:shadow-none' : 'w-0 -translate-x-full md:translate-x-0 overflow-hidden border-r-0'
        )}
      >
        {/* Sidebar Mode Tabs */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-white/[0.08] flex-shrink-0 bg-zinc-100/50 dark:bg-zinc-950/40">
          <div className="flex items-center gap-0.5 bg-zinc-200/70 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-white/[0.06]">
            <button
              onClick={() => setSidebarTab('documents')}
              aria-label="View uploaded documents"
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                sidebarTab === 'documents'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-white/[0.08]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              )}
            >
              <FolderOpen className="size-3.5" />
              <span>Docs</span>
              <span className="text-[10px] font-mono tabular-nums text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950 px-1 rounded">
                {documents.length}
              </span>
            </button>

            <button
              onClick={() => setSidebarTab('chats')}
              aria-label="View chat history"
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                sidebarTab === 'chats'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-white/[0.08]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              )}
            >
              <MessageSquare className="size-3.5" />
              <span>Chats</span>
              <span className="text-[10px] font-mono tabular-nums text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950 px-1 rounded">
                {conversations.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={handleRefresh}
              aria-label="Refresh content"
              className="size-7 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              title="Refresh"
            >
              <RefreshCw className={cn('size-3.5', isLoadingDocuments && 'animate-spin text-zinc-900 dark:text-zinc-100')} />
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
              className="size-7 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 md:hidden"
              title="Close sidebar"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {sidebarTab === 'chats' ? (
          <ChatsPanel />
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Active filter chip */}
            {selectedDocumentId && (
              <div className="px-3 py-2 flex-shrink-0 border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-100 dark:bg-zinc-900/30">
                <button
                  onClick={() => setSelectedDocumentId(null)}
                  aria-label="Clear document filter"
                  className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] px-2.5 py-1 rounded-lg transition-all w-full justify-center cursor-pointer"
                >
                  <X className="size-3 text-zinc-500 dark:text-zinc-400" />
                  <span>Showing focused document (reset)</span>
                </button>
              </div>
            )}

            {/* Document list */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {isLoadingDocuments ? (
                <div className="space-y-1.5">
                  <SkeletonDoc />
                  <SkeletonDoc />
                  <SkeletonDoc />
                </div>
              ) : documents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center justify-center h-48 text-center px-4"
                >
                  <div className="size-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-xl flex items-center justify-center mb-2.5 shadow-xs">
                    <FileText className="size-5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 font-medium">No documents yet</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                    Upload PDF, DOCX, TXT, MD, or CSV files
                  </p>
                  <button
                    onClick={onUploadClick}
                    className="mt-2.5 text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-medium underline underline-offset-4 transition-colors cursor-pointer"
                  >
                    Upload document &rarr;
                  </button>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {documents.map((doc) => (
                    <DocumentItem key={doc.id} doc={doc} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;

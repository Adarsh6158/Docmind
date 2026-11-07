import React, { useState } from 'react';
import {
  FileText, Trash2, ChevronDown, ChevronUp,
  Clock, AlertCircle, Loader2,
  RefreshCw, X, FileType, FilePieChart, File,
  FolderOpen, MessageSquare, Upload, Plus
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
  if (contentType.includes('pdf')) return <FileText className="size-3.5 text-[#171717] dark:text-[#f4f4f5]" strokeWidth={1.75} />;
  if (contentType.includes('word') || contentType.includes('docx')) return <FileType className="size-3.5 text-[#171717] dark:text-[#f4f4f5]" strokeWidth={1.75} />;
  if (contentType.includes('csv')) return <FilePieChart className="size-3.5 text-[#171717] dark:text-[#f4f4f5]" strokeWidth={1.75} />;
  return <File className="size-3.5 text-[#737373] dark:text-[#a3a3a3]" strokeWidth={1.75} />;
}

const STATUS_CONFIG: Record<DocumentStatus, { icon: React.ReactNode; badgeClass: string; label: string }> = {
  INDEXED: {
    icon: <span className="size-1.5 rounded-full bg-emerald-500 flex-shrink-0" />,
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/[0.08] dark:border-emerald-500/20',
    label: 'Indexed',
  },
  PROCESSING: {
    icon: <Loader2 className="size-2.5 animate-spin text-amber-500 flex-shrink-0" />,
    badgeClass: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/[0.08] dark:border-amber-500/20',
    label: 'Processing',
  },
  UPLOADING: {
    icon: <Clock className="size-2.5 text-[#737373] flex-shrink-0" />,
    badgeClass: 'text-[#737373] bg-[#f5f5f5] border-[#e5e5e5] dark:text-[#a3a3a3] dark:bg-white/[0.06] dark:border-white/[0.08]',
    label: 'Uploading',
  },
  FAILED: {
    icon: <AlertCircle className="size-2.5 text-rose-500 flex-shrink-0" />,
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/[0.08] dark:border-rose-500/20',
    label: 'Failed',
  },
};

const StatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.INDEXED;
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-sans font-medium border', cfg.badgeClass)}>
      {cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
};

const SkeletonDoc: React.FC = () => (
  <div className="p-2.5 rounded-xl border border-[#e5e5e5] dark:border-white/[0.05] bg-white dark:bg-[#141416] flex items-center gap-2.5 animate-pulse">
    <div className="size-7 rounded-lg bg-[#f5f5f5] dark:bg-white/[0.06] flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 bg-[#f5f5f5] dark:bg-white/[0.06] rounded w-3/4" />
      <div className="h-2 bg-[#f5f5f5]/80 dark:bg-white/[0.04] rounded w-1/2" />
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
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className={cn(
        'rounded-xl transition-all overflow-hidden border',
        isSelected
          ? 'border-[#151515] dark:border-white/30 border-l-3 border-l-[#151515] dark:border-l-white bg-white dark:bg-[#18181c] shadow-2xs'
          : 'border-[#e5e5e5] dark:border-white/[0.06] bg-white dark:bg-[#141416] hover:border-neutral-300 dark:hover:border-white/[0.12]'
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
            ? 'bg-[#f5f5f5] dark:bg-white/[0.08] border-[#e5e5e5] dark:border-white/[0.12]'
            : 'bg-[#fafafa] dark:bg-[#1a1a1e] border-[#e5e5e5] dark:border-white/[0.06]'
        )}>
          {getFileIcon(doc.contentType)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#171717] dark:text-[#f4f4f5] truncate leading-snug" title={doc.filename}>
            {doc.filename}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <StatusBadge status={doc.status} />
            <span className="text-[10px] font-mono text-[#737373] dark:text-[#a3a3a3] tabular-nums">{formatBytes(doc.fileSize)}</span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
            className="size-6 flex items-center justify-center rounded-md text-[#a3a3a3] hover:text-[#171717] dark:text-[#737373] dark:hover:text-[#f4f4f5] hover:bg-[#f5f5f5] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            aria-label={confirmDelete ? 'Confirm delete' : 'Delete document'}
            className={cn(
              'h-6 flex items-center justify-center rounded-md text-xs transition-colors cursor-pointer',
              confirmDelete
                ? 'px-1.5 bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-200 dark:border-rose-500/25 font-sans font-medium text-[10px]'
                : 'w-6 text-[#a3a3a3] hover:text-rose-600 dark:text-[#737373] dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
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
            transition={{ duration: 0.12 }}
            className="px-2.5 pb-2.5 pt-1 border-t border-[#e5e5e5] dark:border-white/[0.05] overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {doc.totalChunks != null && (
                <div className="bg-[#fafafa] dark:bg-[#1a1a1e] rounded-lg p-1.5 text-center border border-[#e5e5e5] dark:border-white/[0.04]">
                  <p className="text-xs font-semibold text-[#171717] dark:text-[#f4f4f5] tabular-nums">{doc.totalChunks}</p>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">chunks</p>
                </div>
              )}
              {doc.totalPages != null && (
                <div className="bg-[#fafafa] dark:bg-[#1a1a1e] rounded-lg p-1.5 text-center border border-[#e5e5e5] dark:border-white/[0.04]">
                  <p className="text-xs font-semibold text-[#171717] dark:text-[#f4f4f5] tabular-nums">{doc.totalPages}</p>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">pages</p>
                </div>
              )}
              <div className="bg-[#fafafa] dark:bg-[#1a1a1e] rounded-lg p-1.5 text-center border border-[#e5e5e5] dark:border-white/[0.04]">
                <p className="text-[11px] font-medium text-[#171717] dark:text-[#f4f4f5] tabular-nums">{formatDate(doc.createdAt)}</p>
                <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">added</p>
              </div>
            </div>
            {doc.errorMessage && (
              <div className="mt-1.5 px-2 py-1 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-md">
                <p className="text-[11px] text-rose-600 dark:text-rose-400">{doc.errorMessage}</p>
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
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-2xs z-30 md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'flex flex-col h-full bg-[#fafafa] dark:bg-[#101013] border-r border-[#e5e5e5] dark:border-white/[0.08] transition-all duration-200 flex-shrink-0 z-30 md:static fixed inset-y-0 left-0 top-13 md:top-0',
          isSidebarOpen ? 'w-72 shadow-xl md:shadow-none' : 'w-0 -translate-x-full md:translate-x-0 overflow-hidden border-r-0'
        )}
      >
        {/* Sidebar Mode Tabs */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#e5e5e5] dark:border-white/[0.08] flex-shrink-0 bg-[#fafafa] dark:bg-[#101013]">
          <div className="flex items-center gap-0.5 bg-[#f0f0f0] dark:bg-[#18181c] p-0.5 rounded-lg border border-[#e5e5e5] dark:border-white/[0.06]">
            <button
              onClick={() => setSidebarTab('documents')}
              aria-label="View uploaded documents"
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                sidebarTab === 'documents'
                  ? 'bg-white dark:bg-[#25252b] text-[#171717] dark:text-[#f4f4f5] shadow-2xs border border-black/[0.04] dark:border-white/[0.08]'
                  : 'text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5]'
              )}
            >
              <FolderOpen className="size-3.5" />
              <span>Docs</span>
              <span className="text-[10px] font-mono tabular-nums text-[#737373] dark:text-[#a3a3a3] bg-[#f5f5f5] dark:bg-[#101013] px-1 rounded">
                {documents.length}
              </span>
            </button>

            <button
              onClick={() => setSidebarTab('chats')}
              aria-label="View chat history"
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                sidebarTab === 'chats'
                  ? 'bg-white dark:bg-[#25252b] text-[#171717] dark:text-[#f4f4f5] shadow-2xs border border-black/[0.04] dark:border-white/[0.08]'
                  : 'text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5]'
              )}
            >
              <MessageSquare className="size-3.5" />
              <span>Chats</span>
              <span className="text-[10px] font-mono tabular-nums text-[#737373] dark:text-[#a3a3a3] bg-[#f5f5f5] dark:bg-[#101013] px-1 rounded">
                {conversations.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {sidebarTab === 'documents' && (
              <button
                onClick={onUploadClick}
                aria-label="Upload document"
                className="size-7 flex items-center justify-center hover:bg-[#e5e5e5] dark:hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer text-[#737373] hover:text-[#171717] dark:text-[#a3a3a3] dark:hover:text-[#f4f4f5]"
                title="Upload document"
              >
                <Plus className="size-3.5" />
              </button>
            )}
            <button
              onClick={handleRefresh}
              aria-label="Refresh content"
              className="size-7 flex items-center justify-center hover:bg-[#e5e5e5] dark:hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer text-[#737373] hover:text-[#171717] dark:text-[#a3a3a3] dark:hover:text-[#f4f4f5]"
              title="Refresh"
            >
              <RefreshCw className={cn('size-3.5', isLoadingDocuments && 'animate-spin text-[#171717] dark:text-[#f4f4f5]')} />
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
              className="size-7 flex items-center justify-center hover:bg-[#e5e5e5] dark:hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer text-[#737373] hover:text-[#171717] dark:text-[#a3a3a3] dark:hover:text-[#f4f4f5] md:hidden"
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
              <div className="px-3 py-2 flex-shrink-0 border-b border-[#e5e5e5] dark:border-white/[0.06] bg-white dark:bg-[#141416]">
                <button
                  onClick={() => setSelectedDocumentId(null)}
                  aria-label="Clear document filter"
                  className="flex items-center gap-1.5 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] bg-[#fafafa] dark:bg-[#18181c] hover:bg-[#f0f0f0] border border-[#e5e5e5] dark:border-white/[0.08] px-2.5 py-1 rounded-lg transition-all w-full justify-center cursor-pointer shadow-2xs"
                >
                  <X className="size-3 text-[#a3a3a3]" />
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
                <div className="p-4 my-2 rounded-2xl border border-dashed border-[#e5e5e5] dark:border-white/[0.08] bg-white/60 dark:bg-[#141416]/40 text-center flex flex-col items-center">
                  <div className="size-9 rounded-xl bg-[#f5f5f5] dark:bg-white/[0.06] border border-[#e5e5e5] dark:border-white/[0.08] flex items-center justify-center mb-2.5 shadow-2xs">
                    <FolderOpen className="size-4 text-[#737373] dark:text-[#a3a3a3]" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs font-semibold text-[#171717] dark:text-[#f4f4f5]">No indexed documents</p>
                  <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-1 leading-relaxed max-w-[200px]">
                    Upload contracts, specs, or reports to query and ground answers.
                  </p>
                  <button
                    onClick={onUploadClick}
                    className="mt-3.5 inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-[#151515] text-white hover:bg-black dark:bg-white dark:text-[#151515] dark:hover:bg-neutral-100 text-xs font-medium transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
                  >
                    <Upload className="size-3" strokeWidth={2} />
                    <span>Upload document</span>
                  </button>
                  <div className="flex flex-wrap gap-1 justify-center mt-3 pt-2.5 border-t border-[#f0f0f0] dark:border-white/[0.04] w-full">
                    {['PDF', 'DOCX', 'TXT', 'MD', 'CSV'].map((ext) => (
                      <span key={ext} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#f5f5f5] dark:bg-white/[0.04] text-[#737373] dark:text-[#a3a3a3]">
                        .{ext.toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>
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

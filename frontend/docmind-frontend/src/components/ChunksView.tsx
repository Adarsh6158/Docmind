import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, Loader2, FileText, RefreshCw, ChevronDown, ChevronUp,
  Search, Hash, BookOpen, Database, Copy, Check, Tag, X
} from 'lucide-react';
import { chatApi } from '../services/api';
import { useDocumentStore } from '../store/documentStore';
import type { CitationDto } from '../types';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { FileFormatIcon } from './FileFormatIcon';
import { SearchWaveBackground } from './SearchWaveBackground';

const ChunkCard: React.FC<{ chunk: CitationDto; index: number }> = ({ chunk, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const score = chunk.similarityScore != null ? chunk.similarityScore : null;
  const pct = score != null ? (score * 100).toFixed(1) : null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(chunk.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Chunk text copied');
  };

  return (
    <div className={cn(
      'border rounded-xl bg-white dark:bg-[#141416] overflow-hidden transition-colors shadow-2xs',
      expanded ? 'border-[#151515]/30 dark:border-white/[0.22]' : 'border-[#e5e5e5] dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/[0.14]'
    )}>
      {/* Chunk header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Index badge */}
        <div className="size-7 bg-[#f5f5f5] dark:bg-white/[0.08] border border-[#e5e5e5] dark:border-white/[0.08] rounded-md flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-mono font-medium text-[#171717] dark:text-[#f4f4f5]">#{chunk.chunkIndex ?? index}</span>
        </div>

        {/* File & meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <FileFormatIcon filename={chunk.fileName} size="xs" />
            <p className="text-xs font-medium text-[#171717] dark:text-[#f4f4f5] truncate">{chunk.fileName}</p>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {chunk.pageNumber != null && (
              <span className="text-[11px] text-[#737373] dark:text-[#a3a3a3] flex items-center gap-1">
                <FileText className="size-2.5" /> Page {chunk.pageNumber}
              </span>
            )}
            <span className="text-[11px] text-[#737373] dark:text-[#a3a3a3] line-clamp-1 max-w-[280px]">
              {chunk.snippet.slice(0, 75)}…
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {pct != null && (
            <span className="text-[10px] font-mono tabular-nums bg-[#f5f5f5] dark:bg-white/[0.06] text-[#737373] dark:text-[#a3a3a3] border border-[#e5e5e5] dark:border-white/[0.06] px-1.5 py-0.5 rounded">
              {pct}%
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="size-6 flex items-center justify-center text-[#a3a3a3] hover:text-[#171717] dark:text-[#737373] dark:hover:text-[#f4f4f5] rounded hover:bg-[#f5f5f5] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Copy chunk"
            aria-label="Copy chunk"
          >
            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
          </button>
          <div className="text-[#a3a3a3]">
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[#e5e5e5] dark:border-white/[0.06] bg-[#fafafa] dark:bg-[#1a1a1e] p-3.5 space-y-3">
          <div className="relative bg-white dark:bg-[#101013] border border-[#e5e5e5] dark:border-white/[0.06] rounded-lg p-3">
            <p className="text-xs text-[#171717] dark:text-[#f4f4f5] leading-relaxed whitespace-pre-wrap font-sans">{chunk.snippet}</p>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1 bg-[#f5f5f5] hover:bg-[#e5e5e5] dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-[#e5e5e5] dark:border-white/[0.08] rounded text-[#737373] hover:text-[#171717] dark:text-[#a3a3a3] dark:hover:text-[#f4f4f5] transition-colors cursor-pointer"
              aria-label="Copy snippet"
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            </button>
          </div>

          {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] mb-1.5 flex items-center gap-1.5">
                <Hash className="size-3" /> Metadata attributes
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {Object.entries(chunk.metadata)
                  .filter(([k]) => !['snippet'].includes(k))
                  .map(([k, v]) => (
                    <div key={k} className="bg-[#f5f5f5] dark:bg-white/[0.04] border border-[#e5e5e5] dark:border-white/[0.05] rounded-md p-2">
                      <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] capitalize">{k.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-[#171717] dark:text-[#f4f4f5] mt-0.5 truncate font-sans">{String(v)}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ChunksView: React.FC = () => {
  const { selectedDocumentId, documents } = useDocumentStore();
  const [chunks, setChunks] = useState<CitationDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [textFilter, setTextFilter] = useState('');

  const selectedDoc = documents.find((d) => d.id === selectedDocumentId);

  const loadChunks = useCallback(async (q = query) => {
    setIsLoading(true);
    try {
      const res = await chatApi.searchSimilarity({
        query: q.trim() || 'document content text data information',
        documentId: selectedDocumentId ?? undefined,
        topK: 50,
        similaritySearch: 0.0,
      });
      setChunks(res.data.matches);
      setHasLoaded(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load chunks');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDocumentId, query]);

  useEffect(() => {
    if (selectedDocumentId) loadChunks();
    else { setChunks([]); setHasLoaded(false); }
  }, [selectedDocumentId, loadChunks]);

  const filtered = textFilter
    ? chunks.filter((c) =>
        c.snippet.toLowerCase().includes(textFilter.toLowerCase()) ||
        c.fileName.toLowerCase().includes(textFilter.toLowerCase())
      )
    : chunks;

  const uniqueFiles = [...new Set(chunks.map((c) => c.fileName))];

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-white dark:bg-[#0c0c0e] transition-colors duration-150">
      {/* Subtle Premium Lavender-White Wave Background */}
      <SearchWaveBackground />

      {/* Header */}
      <div className="relative z-10 px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-[#e5e5e5]/80 dark:border-white/[0.08] flex-shrink-0 bg-white/40 dark:bg-[#141416]/80 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-semibold text-[#171717] dark:text-[#f4f4f5] tracking-tight">Vector chunks</h1>
            {hasLoaded && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-mono tabular-nums bg-white dark:bg-white/[0.06] border border-[#e5e5e5] dark:border-white/[0.06] text-[#737373] dark:text-[#a3a3a3] px-1.5 sm:px-2 py-0.5 rounded-md shadow-2xs">
                  {filtered.length} / {chunks.length}
                </span>
                {uniqueFiles.length > 1 && (
                  <span className="text-[11px] sm:text-xs text-[#737373] dark:text-[#a3a3a3] tabular-nums hidden sm:inline">· {uniqueFiles.length} files</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => loadChunks()}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs border border-[#e5e5e5] dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/[0.16] text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer bg-white dark:bg-[#141416] shadow-2xs font-sans"
          >
            <RefreshCw className={cn('size-3', isLoading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Vector query input */}
        <div className="flex gap-2 mb-2">
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#16161a] border border-[#e5e5e5] dark:border-white/[0.1] focus-within:border-[#151515] dark:focus-within:border-white/30 rounded-xl px-3 py-1.5 transition-colors shadow-2xs">
            <Database className="size-3.5 text-[#a3a3a3] flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadChunks()}
              placeholder="Query terms to probe vector cluster…"
              className="flex-1 bg-transparent text-base sm:text-xs text-[#171717] dark:text-[#f4f4f5] placeholder-[#a3a3a3] outline-none"
            />
          </div>
          <button
            onClick={() => loadChunks()}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border',
              !isLoading
                ? 'bg-[#151515] text-white hover:bg-black dark:bg-[#ffffff] dark:text-[#151515] dark:hover:bg-neutral-100 active:scale-[0.98] border-transparent shadow-2xs'
                : 'bg-[#f5f5f5] dark:bg-white/[0.04] text-[#a3a3a3] border-transparent cursor-not-allowed'
            )}
          >
            {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <BookOpen className="size-3.5" />}
            <span>Load</span>
          </button>
        </div>

        {/* Sub-filter */}
        {hasLoaded && chunks.length > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-[#16161a] border border-[#e5e5e5] dark:border-white/[0.06] rounded-lg px-3 py-1.5 shadow-2xs">
            <Search className="size-3.5 text-[#a3a3a3] flex-shrink-0" />
            <input
              type="text"
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              placeholder="Filter loaded chunks by text content…"
              className="flex-1 bg-transparent text-base sm:text-xs text-[#171717] dark:text-[#f4f4f5] placeholder-[#a3a3a3] outline-none"
            />
            {textFilter && (
              <button onClick={() => setTextFilter('')} className="text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] text-xs cursor-pointer p-0.5">
                <X className="size-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chunks Canvas */}
      <div className="relative z-10 flex-1 overflow-y-auto p-3.5 sm:p-6">
        {!hasLoaded && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
            <div className="size-11 bg-[#f5f5f5] dark:bg-[#18181c] rounded-xl flex items-center justify-center mb-3 border border-[#e5e5e5] dark:border-white/[0.08] shadow-2xs">
              <Layers className="size-4.5 text-[#a3a3a3]" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-[#171717] dark:text-[#f4f4f5] mb-1">Vector chunk index</h2>
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3] leading-relaxed mb-4">
              {selectedDoc
                ? `Browse chunked vector splits for "${selectedDoc.filename}" stored in pgvector.`
                : 'Select a document from the sidebar or load the global indexed corpus.'}
            </p>
            <button
              onClick={() => loadChunks()}
              className="px-4 py-2 bg-[#151515] text-white hover:bg-black dark:bg-[#ffffff] dark:text-[#151515] dark:hover:bg-neutral-100 active:scale-[0.98] text-xs font-medium rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              Load chunks
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="size-5 text-[#737373] dark:text-[#a3a3a3] animate-spin" />
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Loading chunk representations…</p>
          </div>
        )}

        {hasLoaded && !isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Tag className="size-8 text-[#a3a3a3] mx-auto mb-2.5" />
            <p className="text-xs font-medium text-[#171717] dark:text-[#f4f4f5]">{textFilter ? 'No matching chunks for filter' : 'No vector chunks found'}</p>
            <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-1">Upload documents to verify chunk splitting</p>
          </div>
        )}

        {hasLoaded && !isLoading && filtered.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-2">
            {filtered.map((chunk, i) => (
              <ChunkCard key={`${chunk.documentId}-${chunk.chunkIndex}-${i}`} chunk={chunk} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChunksView;

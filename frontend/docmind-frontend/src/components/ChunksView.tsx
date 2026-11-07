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
      'border rounded-xl bg-white dark:bg-[#121215] overflow-hidden transition-colors shadow-xs',
      expanded ? 'border-zinc-300 dark:border-white/[0.18]' : 'border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.14]'
    )}>
      {/* Chunk header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Index badge */}
        <div className="size-7 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-md flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-300">#{chunk.chunkIndex ?? index}</span>
        </div>

        {/* File & meta */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate font-mono">{chunk.fileName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {chunk.pageNumber != null && (
              <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                <FileText className="size-2.5" /> p.{chunk.pageNumber}
              </span>
            )}
            <span className="text-[11px] font-mono text-zinc-500 line-clamp-1 max-w-[260px]">
              {chunk.snippet.slice(0, 70)}…
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {pct != null && (
            <span className="text-[10px] font-mono tabular-nums bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.06] px-1.5 py-0.5 rounded">
              {pct}%
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="size-6 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Copy chunk"
            aria-label="Copy chunk"
          >
            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
          </button>
          <div className="text-zinc-400 dark:text-zinc-500">
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-zinc-200 dark:border-white/[0.06] bg-zinc-50/70 dark:bg-zinc-950/60 p-3.5 space-y-3">
          <div className="relative bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/[0.06] rounded-lg p-3">
            <p className="text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">{chunk.snippet}</p>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] rounded text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              aria-label="Copy snippet"
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            </button>
          </div>

          {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1 font-medium">
                <Hash className="size-3" /> Metadata Attributes
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {Object.entries(chunk.metadata)
                  .filter(([k]) => !['snippet'].includes(k))
                  .map(([k, v]) => (
                    <div key={k} className="bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.05] rounded-md p-2">
                      <p className="text-[9px] font-mono text-zinc-500 capitalize">{k.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-zinc-800 dark:text-zinc-300 mt-0.5 truncate font-mono">{String(v)}</p>
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
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-[#09090b] transition-colors duration-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] flex-shrink-0 bg-zinc-50 dark:bg-[#0e0e11]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="size-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.1] rounded-md flex items-center justify-center">
              <Layers className="size-3.5 text-zinc-800 dark:text-zinc-200" strokeWidth={1.75} />
            </div>
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">Vector Chunks Inspector</h2>
            {hasLoaded && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono tabular-nums bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded">
                  {filtered.length} / {chunks.length} chunks
                </span>
                {uniqueFiles.length > 1 && (
                  <span className="text-[10px] font-mono text-zinc-500 tabular-nums">{uniqueFiles.length} files</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => loadChunks()}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.16] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 px-2.5 py-1 rounded-md transition-colors disabled:opacity-40 cursor-pointer font-mono"
          >
            <RefreshCw className={cn('size-3', isLoading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Vector query input */}
        <div className="flex gap-2 mb-2.5">
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#141418] border border-zinc-300 dark:border-white/[0.1] focus-within:border-zinc-500 dark:focus-within:border-white/[0.22] rounded-xl px-3 py-1.5 transition-colors shadow-xs">
            <Database className="size-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadChunks()}
              placeholder="Query terms to probe specific vector cluster (optional)"
              className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none font-mono"
            />
          </div>
          <button
            onClick={() => loadChunks()}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border',
              !isLoading
                ? 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white active:scale-[0.98] border-zinc-800 dark:border-white/10'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
            )}
          >
            {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <BookOpen className="size-3.5" />}
            <span>Load</span>
          </button>
        </div>

        {/* Sub-filter */}
        {hasLoaded && chunks.length > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-[#141418] border border-zinc-200 dark:border-white/[0.06] rounded-lg px-3 py-1.5">
            <Search className="size-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
            <input
              type="text"
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              placeholder="Filter loaded chunks by text content…"
              className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none font-mono"
            />
            {textFilter && (
              <button onClick={() => setTextFilter('')} className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 text-xs cursor-pointer">
                <X className="size-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Chunks Canvas */}
      <div className="flex-1 overflow-y-auto p-6">
        {!hasLoaded && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
            <div className="size-12 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center mb-3 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
              <Layers className="size-5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Vector Chunk Index</h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">
              {selectedDoc
                ? `Browse chunked vector splits for "${selectedDoc.filename}" stored in pgvector.`
                : 'Select a document from the sidebar or load the global indexed corpus.'}
            </p>
            <button
              onClick={() => loadChunks()}
              className="px-4 py-2 bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white active:scale-[0.98] text-xs font-medium rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Load Chunks
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="size-6 text-zinc-500 dark:text-zinc-400 animate-spin" />
            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">Loading chunk representations…</p>
          </div>
        )}

        {hasLoaded && !isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Tag className="size-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-2.5" />
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{textFilter ? 'No matching chunks for filter' : 'No vector chunks found'}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Upload documents to verify chunk splitting</p>
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

import React, { useState } from 'react';
import {
  Search, Loader2, ChevronDown, ChevronUp,
  Layers, SlidersHorizontal, Tag, BarChart2, X, FileText
} from 'lucide-react';
import { chatApi } from '../services/api';
import { useDocumentStore } from '../store/documentStore';
import type { CitationDto, SearchResultDto } from '../types';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { FileFormatIcon } from './FileFormatIcon';
import { SearchWaveBackground } from './SearchWaveBackground';

const SEARCH_MODES = [
  { label: 'All Semantics', placeholder: 'Search concepts, facts, or keywords across vector space…' },
  { label: 'Clauses & Provisions', placeholder: 'Query specific clauses, stipulations, or liabilities…' },
  { label: 'Facts & Statistics', placeholder: 'Retrieve quantitative data points, dates, or figures…' },
  { label: 'Definitions', placeholder: 'Look up defined terminology, technical terms, or entities…' },
];

const ResultCard: React.FC<{ match: CitationDto; index: number }> = ({ match, index }) => {
  const [expanded, setExpanded] = useState(false);
  const score = match.similarityScore ?? 0;
  const pct = (score * 100).toFixed(1);

  return (
    <div className="border border-[#e5e5e5] dark:border-white/[0.08] rounded-xl overflow-hidden bg-white dark:bg-[#141416] hover:border-neutral-300 dark:hover:border-white/[0.14] transition-colors shadow-2xs">
      <div className="p-3.5 sm:p-4">
        {/* Header row */}
        <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
          <div className="size-6 bg-[#f5f5f5] dark:bg-white/[0.08] border border-[#e5e5e5] dark:border-white/[0.08] rounded-md flex items-center justify-center text-[11px] font-mono font-medium text-[#171717] dark:text-[#f4f4f5] flex-shrink-0">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <FileFormatIcon filename={match.fileName} size="xs" />
                  <p className="text-xs font-semibold text-[#171717] dark:text-[#f4f4f5] truncate">{match.fileName}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {match.pageNumber && (
                    <span className="text-[11px] text-[#737373] dark:text-[#a3a3a3] flex items-center gap-1">
                      <FileText className="size-3" /> Page {match.pageNumber}
                    </span>
                  )}
                  {match.chunkIndex != null && (
                    <span className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Chunk #{match.chunkIndex}</span>
                  )}
                </div>
              </div>

              {/* Score badge */}
              <div className="text-right flex-shrink-0">
                <span className="text-[10px] sm:text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-md border border-[#e5e5e5] dark:border-white/[0.08] bg-[#fafafa] dark:bg-white/[0.06] text-[#171717] dark:text-[#f4f4f5]">
                  {pct}% match
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Similarity progress bar */}
        <div className="w-full bg-[#e5e5e5] dark:bg-white/[0.1] rounded-full h-1 mb-3 overflow-hidden">
          <div className="h-1 bg-[#151515] dark:bg-white rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>

        {/* Snippet */}
        <p className={cn('text-xs text-[#171717] dark:text-[#f4f4f5] font-sans leading-relaxed bg-[#fafafa] dark:bg-[#1a1a1e] p-3 rounded-lg border border-[#e5e5e5]/80 dark:border-white/[0.04]', !expanded && 'line-clamp-3')}>
          {match.snippet}
        </p>

        {match.snippet.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-[#737373] hover:text-[#171717] dark:text-[#a3a3a3] dark:hover:text-[#f4f4f5] mt-2 transition-colors cursor-pointer"
          >
            {expanded ? <><ChevronUp className="size-3" /> Show less</> : <><ChevronDown className="size-3" /> Show more</>}
          </button>
        )}

        {/* Metadata pills */}
        {match.metadata && Object.keys(match.metadata).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#e5e5e5] dark:border-white/[0.06]">
            {Object.entries(match.metadata)
              .filter(([k]) => !['documentId', 'fileName', 'snippet'].includes(k))
              .slice(0, 5)
              .map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1 text-[11px] bg-[#f5f5f5] dark:bg-white/[0.06] text-[#737373] dark:text-[#a3a3a3] px-2 py-0.5 rounded-md border border-[#e5e5e5] dark:border-white/[0.06]">
                  <Tag className="size-2.5 text-[#a3a3a3]" />
                  <span className="text-[#a3a3a3]">{k}:</span> {String(v)}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const SearchView: React.FC = () => {
  const { selectedDocumentId, documents } = useDocumentStore();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResultDto | null>(null);
  const [topK, setTopK] = useState(10);
  const [minSimilarity, setMinSimilarity] = useState(0.3);
  const [selectedType, setSelectedType] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const selectedDoc = documents.find((d) => d.id === selectedDocumentId);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await chatApi.searchSimilarity({
        query: query.trim(),
        documentId: selectedDocumentId ?? undefined,
        topK,
        similaritySearch: minSimilarity,
      });
      setResults(res.data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const EXAMPLE_QUERIES = [
    'payment terms', 'termination clause', 'liability cap', 'force majeure',
    'intellectual property', 'governing law', 'warranty',
  ];

  return (
    <div className="relative flex flex-col h-full overflow-hidden bg-white dark:bg-[#0c0c0e] transition-colors duration-150">
      {/* Subtle Premium Lavender-White Wave Background */}
      <SearchWaveBackground />

      {/* Search Header */}
      <div className="relative z-10 px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-[#e5e5e5]/80 dark:border-white/[0.08] flex-shrink-0 bg-white/40 dark:bg-[#141416]/80 backdrop-blur-md">
        {/* Title row */}
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-semibold text-[#171717] dark:text-[#f4f4f5] tracking-tight">Semantic vector search</h1>
            {selectedDoc && (
              <span className="text-[11px] sm:text-xs text-[#737373] dark:text-[#a3a3a3] bg-[#e5e5e5] dark:bg-white/[0.08] px-2 py-0.5 rounded-md border border-neutral-300 dark:border-white/[0.06] truncate max-w-[120px] sm:max-w-[180px]">
                {selectedDoc.filename}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer font-sans',
              showFilters
                ? 'bg-white border-[#e5e5e5] text-[#171717] dark:bg-white/[0.1] dark:border-white/[0.16] dark:text-[#f4f4f5] shadow-2xs'
                : 'border-transparent text-[#737373] hover:text-[#171717] hover:bg-black/[0.02] dark:text-[#a3a3a3] dark:hover:text-[#f4f4f5] dark:hover:bg-white/[0.04]'
            )}
          >
            <SlidersHorizontal className="size-3" />
            <span>Parameters {showFilters && '•'}</span>
          </button>
        </div>

        {/* Filter Presets */}
        <div className="flex gap-1.5 mb-2.5 sm:mb-3 overflow-x-auto pb-0.5 no-scrollbar">
          {SEARCH_MODES.map((mode, i) => (
            <button
              key={i}
              onClick={() => setSelectedType(i)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 cursor-pointer active:scale-95',
                selectedType === i
                  ? 'bg-white dark:bg-[#25252b] text-[#171717] dark:text-[#f4f4f5] border border-[#e5e5e5] dark:border-white/[0.12] shadow-2xs'
                  : 'bg-[#f5f5f5] dark:bg-white/[0.04] border border-[#e5e5e5]/60 dark:border-white/[0.04] text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5]'
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Search Input Bar */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#16161a] border border-[#e5e5e5] dark:border-white/[0.1] focus-within:border-[#151515] dark:focus-within:border-white/30 rounded-xl px-3 sm:px-3.5 py-2 transition-colors shadow-2xs">
            <Search className="size-4 text-[#a3a3a3] flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={SEARCH_MODES[selectedType].placeholder}
              className="flex-1 bg-transparent text-base sm:text-sm text-[#171717] dark:text-[#f4f4f5] placeholder-[#a3a3a3] outline-none font-sans"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] transition-colors cursor-pointer p-0.5"
                aria-label="Clear query"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border',
              query.trim() && !isSearching
                ? 'bg-[#151515] text-white hover:bg-black dark:bg-[#ffffff] dark:text-[#151515] dark:hover:bg-neutral-100 active:scale-[0.98] border-transparent shadow-2xs'
                : 'bg-[#f5f5f5] dark:bg-white/[0.04] text-[#a3a3a3] border-transparent cursor-not-allowed'
            )}
          >
            {isSearching ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>

        {/* Advanced Parameters Panel */}
        {showFilters && (
          <div className="mt-3 p-3.5 sm:p-4 bg-[#f5f5f5] dark:bg-[#18181c] rounded-xl border border-[#e5e5e5] dark:border-white/[0.08] shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-[#737373] dark:text-[#a3a3a3]">Top Matches (k)</span>
                  <span className="text-[#171717] dark:text-[#f4f4f5] tabular-nums font-semibold">{topK}</span>
                </div>
                <input
                  type="range" min={1} max={25} value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-full accent-[#151515] dark:accent-white cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-[10px] text-[#a3a3a3] font-mono">
                  <span>1</span><span>25</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5 text-xs">
                  <span className="text-[#737373] dark:text-[#a3a3a3]">Min Similarity Threshold</span>
                  <span className="text-[#171717] dark:text-[#f4f4f5] tabular-nums font-semibold">{(minSimilarity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min={0} max={1} step={0.05} value={minSimilarity}
                  onChange={(e) => setMinSimilarity(Number(e.target.value))}
                  className="w-full accent-[#151515] dark:accent-white cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-[10px] text-[#a3a3a3] font-mono">
                  <span>0%</span><span>100%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Query suggestion chips */}
        {!results && !isSearching && (
          <div className="flex items-center gap-1.5 mt-2.5 sm:mt-3 overflow-x-auto pb-0.5 no-scrollbar flex-nowrap sm:flex-wrap">
            <span className="text-xs text-[#737373] dark:text-[#a3a3a3] flex-shrink-0">Suggested:</span>
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => setQuery(q)}
                className="text-xs bg-white dark:bg-[#16161a] border border-[#e5e5e5] dark:border-white/[0.06] text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] hover:border-neutral-300 dark:hover:border-white/[0.14] px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-2xs font-sans whitespace-nowrap flex-shrink-0 active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Canvas */}
      <div className="relative z-10 flex-1 overflow-y-auto p-3.5 sm:p-6">
        {!results && !isSearching && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
            <div className="size-11 bg-[#f5f5f5] dark:bg-[#18181c] rounded-xl flex items-center justify-center mb-3 border border-[#e5e5e5] dark:border-white/[0.08] shadow-2xs">
              <Search className="size-4.5 text-[#a3a3a3]" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-[#171717] dark:text-[#f4f4f5] mb-1">Search document knowledge base</h2>
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3] leading-relaxed">
              Find clauses, provisions, concepts, and statistics indexed with cosine similarity embeddings.
            </p>
          </div>
        )}

        {isSearching && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="size-5 text-[#737373] dark:text-[#a3a3a3] animate-spin" />
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Searching vector embeddings…</p>
          </div>
        )}

        {results && !isSearching && (
          <div className="max-w-4xl mx-auto">
            {/* Results bar */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e5e5e5] dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BarChart2 className="size-4 text-[#737373] dark:text-[#a3a3a3]" />
                <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                  <span className="font-semibold text-[#171717] dark:text-[#f4f4f5] tabular-nums">{results.totalMatches}</span> matches for "{results.query}"
                </span>
              </div>

              {results.totalMatches > 0 && (
                <button
                  onClick={() => setResults(null)}
                  className="text-xs text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] transition-colors cursor-pointer"
                >
                  Clear results
                </button>
              )}
            </div>

            {results.totalMatches === 0 ? (
              <div className="text-center py-16">
                <Layers className="size-8 text-[#a3a3a3] mx-auto mb-2.5" />
                <p className="text-xs font-medium text-[#171717] dark:text-[#f4f4f5]">No matching chunks found</p>
                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-1">Adjust similarity threshold in parameters or try different keywords</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.matches.map((match, i) => (
                  <ResultCard key={i} match={match} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;

import React, { useState } from 'react';
import {
  Search, Loader2, FileText, ChevronDown, ChevronUp,
  Layers, SlidersHorizontal, Tag, BarChart2, X
} from 'lucide-react';
import { chatApi } from '../services/api';
import { useDocumentStore } from '../store/documentStore';
import type { CitationDto, SearchResultDto } from '../types';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

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
    <div className="border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden bg-white dark:bg-[#121215] hover:border-zinc-300 dark:hover:border-white/[0.14] transition-colors shadow-xs">
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="size-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-md flex items-center justify-center text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-400 flex-shrink-0">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate font-mono max-w-sm">{match.fileName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {match.pageNumber && (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono flex items-center gap-1">
                      <FileText className="size-3" /> p.{match.pageNumber}
                    </span>
                  )}
                  {match.chunkIndex != null && (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">chunk #{match.chunkIndex}</span>
                  )}
                </div>
              </div>

              {/* Score badge */}
              <div className="text-right flex-shrink-0">
                <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                  {pct}% match
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Similarity progress bar */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1 mb-3 overflow-hidden">
          <div className="h-1 bg-zinc-800 dark:bg-zinc-300 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>

        {/* Snippet */}
        <p className={cn('text-xs text-zinc-800 dark:text-zinc-300 font-mono leading-relaxed bg-zinc-50 dark:bg-zinc-950/70 p-3 rounded-lg border border-zinc-200/80 dark:border-white/[0.04]', !expanded && 'line-clamp-3')}>
          {match.snippet}
        </p>

        {match.snippet.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 mt-2 transition-colors cursor-pointer"
          >
            {expanded ? <><ChevronUp className="size-3" /> Show less</> : <><ChevronDown className="size-3" /> Show more</>}
          </button>
        )}

        {/* Metadata pills */}
        {match.metadata && Object.keys(match.metadata).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-200 dark:border-white/[0.06]">
            {Object.entries(match.metadata)
              .filter(([k]) => !['documentId', 'fileName', 'snippet'].includes(k))
              .slice(0, 5)
              .map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1 text-[10px] font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded border border-zinc-200 dark:border-white/[0.06]">
                  <Tag className="size-2.5 text-zinc-400 dark:text-zinc-500" />
                  <span className="text-zinc-400 dark:text-zinc-500">{k}:</span> {String(v)}
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
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-[#09090b] transition-colors duration-200">
      {/* Search Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] flex-shrink-0 bg-zinc-50 dark:bg-[#0e0e11]">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="size-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.1] rounded-md flex items-center justify-center">
              <Search className="size-3.5 text-zinc-800 dark:text-zinc-200" strokeWidth={1.75} />
            </div>
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">Semantic Vector Search</h2>
            {selectedDoc && (
              <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-300 dark:border-white/[0.06]">
                {selectedDoc.filename}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer font-mono',
              showFilters
                ? 'bg-zinc-200 border-zinc-300 text-zinc-900 dark:bg-zinc-800 dark:border-white/[0.16] dark:text-zinc-100'
                : 'border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:border-white/[0.06] dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/40'
            )}
          >
            <SlidersHorizontal className="size-3" />
            <span>Parameters {showFilters && '•'}</span>
          </button>
        </div>

        {/* Filter Presets */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-0.5 no-scrollbar">
          {SEARCH_MODES.map((mode, i) => (
            <button
              key={i}
              onClick={() => setSelectedType(i)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 cursor-pointer',
                selectedType === i
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-white/[0.12] shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/[0.05] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Search Input Bar */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#141418] border border-zinc-300 dark:border-white/[0.1] focus-within:border-zinc-500 dark:focus-within:border-white/[0.22] rounded-xl px-3.5 py-2 transition-colors shadow-xs">
            <Search className="size-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={SEARCH_MODES[selectedType].placeholder}
              className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer"
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
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border',
              query.trim() && !isSearching
                ? 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white active:scale-[0.98] border-zinc-800 dark:border-white/10'
                : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-transparent cursor-not-allowed opacity-50'
            )}
          >
            {isSearching ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
            <span>Search</span>
          </button>
        </div>

        {/* Advanced Parameters Panel */}
        {showFilters && (
          <div className="mt-3 p-4 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-white/[0.08]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between mb-1.5 text-xs font-mono">
                  <span className="text-zinc-600 dark:text-zinc-400">Top Matches (k)</span>
                  <span className="text-zinc-900 dark:text-zinc-200 tabular-nums">{topK}</span>
                </div>
                <input
                  type="range" min={1} max={25} value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-full accent-zinc-800 dark:accent-zinc-300"
                />
                <div className="flex justify-between mt-1 text-[10px] text-zinc-500 dark:text-zinc-600 font-mono">
                  <span>1</span><span>25</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5 text-xs font-mono">
                  <span className="text-zinc-600 dark:text-zinc-400">Min Similarity Threshold</span>
                  <span className="text-zinc-900 dark:text-zinc-200 tabular-nums">{(minSimilarity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min={0} max={1} step={0.05} value={minSimilarity}
                  onChange={(e) => setMinSimilarity(Number(e.target.value))}
                  className="w-full accent-zinc-800 dark:accent-zinc-300"
                />
                <div className="flex justify-between mt-1 text-[10px] text-zinc-500 dark:text-zinc-600 font-mono">
                  <span>0%</span><span>100%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Query suggestion chips */}
        {!results && !isSearching && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">Suggestions:</span>
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => setQuery(q)}
                className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-white/[0.14] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Canvas */}
      <div className="flex-1 overflow-y-auto p-6">
        {!results && !isSearching && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
            <div className="size-12 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex items-center justify-center mb-3 border border-zinc-200 dark:border-white/[0.08] shadow-xs">
              <Search className="size-5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Vector Search across corpus</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Find grounded clauses, provisions, concepts, and statistics indexed with cosine similarity embeddings.
            </p>
          </div>
        )}

        {isSearching && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="size-6 text-zinc-500 dark:text-zinc-400 animate-spin" />
            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">Scanning vector embeddings…</p>
          </div>
        )}

        {results && !isSearching && (
          <div className="max-w-4xl mx-auto">
            {/* Results bar */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BarChart2 className="size-4 text-zinc-500 dark:text-zinc-400" />
                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{results.totalMatches}</span> matches for "{results.query}"
                </span>
              </div>

              {results.totalMatches > 0 && (
                <button
                  onClick={() => setResults(null)}
                  className="text-xs font-mono text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  Clear results
                </button>
              )}
            </div>

            {results.totalMatches === 0 ? (
              <div className="text-center py-16">
                <Layers className="size-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-2.5" />
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">No matching chunks found</p>
                <p className="text-[11px] text-zinc-500 mt-1">Adjust similarity threshold in parameters or try different keywords</p>
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

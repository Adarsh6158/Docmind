import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markdown';
import {
  Send, Bot, User, Loader2, ChevronDown, ChevronUp, FileText,
  Zap, RotateCcw, Square, Copy, Check, Sparkles, Layers, ArrowUpRight,
  AlertCircle, Plus, X
} from 'lucide-react';
import { chatApi } from '../services/api';
import { useDocumentStore } from '../store/documentStore';
import { useConversationStore } from '../store/conversationStore';
import type { ConversationMessage, CitationDto } from '../types';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

/* ─── Structured Prompt Groups ─────────────────────────────────── */
const PROMPT_GROUPS = [
  {
    category: 'Analysis & Synthesis',
    items: [
      {
        label: 'Executive Summary',
        prompt: 'Generate a high-level executive summary of the core findings across all indexed documents.',
        desc: 'Extract key themes, high-priority insights, and strategic takeaways.'
      },
      {
        label: 'Action Items & Next Steps',
        prompt: 'Extract concrete action items, ownership, and target timelines mentioned in the text.',
        desc: 'Identify deliverables, assigned stakeholders, and milestone deadlines.'
      },
    ],
  },
  {
    category: 'Governance & Clauses',
    items: [
      {
        label: 'Key Clauses & Obligations',
        prompt: 'Identify binding commitments, legal obligations, and critical clauses.',
        desc: 'Isolate covenants, warranty stipulations, and contractual duties.'
      },
      {
        label: 'Risk & Liability Assessment',
        prompt: 'Highlight identified risks, liability terms, and operational exposure.',
        desc: 'Spot indemnification clauses, liability caps, and governance risks.'
      },
    ],
  },
  {
    category: 'Facts & Data Points',
    items: [
      {
        label: 'Key Metrics & Figures',
        prompt: 'Compile key statistical figures, financial metrics, and performance benchmarks.',
        desc: 'Collate revenue numbers, growth rates, margins, and quantitative stats.'
      },
      {
        label: 'Definitions & Terminology',
        prompt: 'List domain-specific terminology, specialized acronyms, and defined concepts.',
        desc: 'Clarify technical abbreviations, definitions, and domain entities.'
      },
    ],
  },
];

/* ─── Prism syntax highlighter renderer ─── */
function renderPrismTokens(tokens: (string | Prism.Token)[], keyPrefix = ''): React.ReactNode[] {
  return tokens.map((token, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (typeof token === 'string') {
      return token;
    }
    const className = `token ${token.type} ${Array.isArray(token.alias) ? token.alias.join(' ') : token.alias || ''}`;
    if (typeof token.content === 'string') {
      return (
        <span key={key} className={className}>
          {token.content}
        </span>
      );
    }
    if (Array.isArray(token.content)) {
      return (
        <span key={key} className={className}>
          {renderPrismTokens(token.content as (string | Prism.Token)[], key)}
        </span>
      );
    }
    return (
      <span key={key} className={className}>
        {String(token.content)}
      </span>
    );
  });
}

/* ─── Code Block with syntax highlight & copy ─── */
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Code copied');
  };

  const normalizedLang = (language || 'text').toLowerCase();
  const grammar = Prism.languages[normalizedLang] || Prism.languages.text;
  const tokens = grammar ? Prism.tokenize(code, grammar) : [code];

  return (
    <div className="my-3 rounded-xl border border-[#e5e5e5] dark:border-white/[0.08] bg-[#f8fafc] dark:bg-[#0d0e12] overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#f1f5f9] dark:bg-[#16171d] border-b border-[#e5e5e5] dark:border-white/[0.06] text-[#737373] dark:text-[#a3a3a3] font-mono text-[11px]">
        <span className="font-mono text-xs text-[#737373] dark:text-[#a3a3a3] lowercase">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] px-2 py-0.5 rounded bg-[#e2e8f0] dark:bg-white/[0.08] hover:bg-[#cbd5e1] dark:hover:bg-white/[0.14] transition-colors cursor-pointer"
        >
          {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto">
        <pre className="font-mono text-xs leading-relaxed text-[#171717] dark:text-[#f4f4f5] m-0 p-0 bg-transparent border-0">
          <code className={`language-${normalizedLang}`}>{renderPrismTokens(tokens, 'code')}</code>
        </pre>
      </div>
    </div>
  );
};

/* ─── Markdown Content Component ─── */
const MarkdownContent: React.FC<{ content: string; isStreaming?: boolean }> = ({ content, isStreaming }) => {
  return (
    <div className="text-sm leading-relaxed overflow-hidden text-[#171717] dark:text-[#f4f4f5] space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            return <p className="mb-2.5 last:mb-0 leading-relaxed text-pretty">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="text-lg font-semibold text-[#171717] dark:text-[#f4f4f5] mt-4 mb-2 pb-1 border-b border-[#e5e5e5] dark:border-white/[0.08] first:mt-0 text-balance">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-base font-semibold text-[#171717] dark:text-[#f4f4f5] mt-3.5 mb-1.5 first:mt-0 text-balance">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm font-semibold text-[#171717] dark:text-[#f4f4f5] mt-3 mb-1 first:mt-0">{children}</h3>;
          },
          ul({ children }) {
            return <ul className="list-disc ml-5 pl-1 space-y-1.5 my-2 text-[#374151] dark:text-[#d1d5db]">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal ml-5 pl-1 space-y-1.5 my-2 text-[#374151] dark:text-[#d1d5db]">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed pl-0.5">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-[#1f78ff] bg-black/[0.02] dark:bg-white/[0.02] px-3.5 py-1.5 rounded-r-md text-[#4b5563] dark:text-[#9ca3af] italic my-2 text-xs leading-relaxed">
                {children}
              </blockquote>
            );
          },
          hr() {
            return <hr className="border-[#e5e5e5] dark:border-white/[0.08] my-3" />;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1f78ff] dark:text-[#60a5fa] hover:underline underline-offset-2 transition-colors font-medium"
              >
                {children}
              </a>
            );
          },
          strong({ children }) {
            return <strong className="font-semibold text-[#111827] dark:text-[#ffffff]">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-[#6b7280] dark:text-[#9ca3af]">{children}</em>;
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-[#e5e5e5] dark:border-white/[0.08]">
                <table className="min-w-full divide-y divide-[#e5e5e5] dark:divide-white/[0.08] text-left text-xs">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-[#f9fafb] dark:bg-white/[0.04]">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-[#e5e5e5] dark:divide-white/[0.04] bg-white dark:bg-[#0c0c0e]">{children}</tbody>;
          },
          th({ children }) {
            return <th className="px-3 py-2 font-medium text-[#111827] dark:text-[#f9fafb]">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-1.5 text-[#374151] dark:text-[#d1d5db]">{children}</td>;
          },
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isMultiLine = codeString.includes('\n');
            if (match || isMultiLine) {
              return <CodeBlock language={match ? match[1] : ''} code={codeString} />;
            }
            return (
              <code className="px-1.5 py-0.5 mx-0.5 bg-[#f3f4f6] dark:bg-white/[0.06] text-[#111827] dark:text-[#e5e7eb] rounded text-[12px] font-mono border border-[#e5e7eb] dark:border-white/[0.08]">
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && <span className="cursor-blink" />}
    </div>
  );
};

/* ─── Grounding Citation Card ─── */
const CitationCard: React.FC<{ citation: CitationDto; index: number }> = ({ citation, index }) => {
  const [expanded, setExpanded] = useState(false);
  const score = citation.similarityScore ?? 0;
  const pct = (score * 100).toFixed(0);

  return (
    <div className="border border-[#e5e5e5] dark:border-white/[0.08] rounded-xl overflow-hidden bg-white dark:bg-[#141416] hover:border-neutral-300 dark:hover:border-white/[0.14] transition-colors shadow-2xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 p-2.5 text-left cursor-pointer"
      >
        <span className="flex-shrink-0 size-5 bg-[#f5f5f5] dark:bg-white/[0.08] text-[#171717] dark:text-[#f4f4f5] rounded-md text-[11px] flex items-center justify-center font-mono border border-[#e5e5e5] dark:border-white/[0.06]">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <FileText className="size-3 text-[#737373] dark:text-[#a3a3a3] flex-shrink-0" />
            <p className="text-xs text-[#171717] dark:text-[#f4f4f5] font-sans font-medium truncate">{citation.fileName}</p>
            {citation.pageNumber && (
              <span className="text-[11px] text-[#737373] dark:text-[#a3a3a3] font-sans flex-shrink-0">Page {citation.pageNumber}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-[#e5e5e5] dark:bg-white/[0.1] rounded-full overflow-hidden">
              <div className="h-1 bg-[#151515] dark:bg-white rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-mono text-[#737373] dark:text-[#a3a3a3] tabular-nums flex-shrink-0">{pct}% match</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="size-3.5 text-[#a3a3a3] flex-shrink-0" /> : <ChevronDown className="size-3.5 text-[#a3a3a3] flex-shrink-0" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-[#e5e5e5] dark:border-white/[0.06]">
          <p className="text-xs text-[#737373] dark:text-[#a3a3a3] leading-relaxed font-sans mt-2 bg-[#fafafa] dark:bg-[#1a1a1e] p-2.5 rounded-lg border border-[#e5e5e5] dark:border-white/[0.04]">
            {citation.snippet}
          </p>
        </div>
      )}
    </div>
  );
};

/* ─── Message Component with 5 Explicit States ─── */
const MessageItem: React.FC<{
  message: ConversationMessage;
  onRetry?: () => void;
}> = ({ message, onRetry }) => {
  const isUser = message.messageType === 'USER';
  const [showCitations, setShowCitations] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const timeStr = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';

  /* ── User Message (Clean Right-Aligned) ── */
  if (isUser) {
    return (
      <div className="flex flex-col items-end max-w-3xl mx-auto w-full group">
        <div className="max-w-[85%] sm:max-w-[75%] bg-[#151515] text-white dark:bg-[#1f1f23] dark:text-[#f4f4f5] rounded-2xl rounded-tr-xs px-4 py-2.5 text-sm leading-relaxed shadow-2xs">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {timeStr && (
          <span className="text-[11px] font-sans text-[#a3a3a3] mt-1 pr-1">
            {timeStr}
          </span>
        )}
      </div>
    );
  }

  /* ── Assistant States Evaluation ── */
  const isError = message.content?.startsWith('Error:') || message.content?.includes('AxiosError') || message.content?.includes('Failed to fetch');
  const isWaiting = message.isStreaming && !message.content;
  const isStreamingWithContent = message.isStreaming && !!message.content;
  const isCompleted = !message.isStreaming && !!message.content && !isError;
  const isEmpty = !message.isStreaming && (!message.content || message.content.trim() === '');

  return (
    <div className="flex items-start gap-3 max-w-3xl mx-auto w-full group">
      {/* Assistant Avatar */}
      <div className="size-7 rounded-lg bg-[#f5f5f5] dark:bg-white/[0.08] border border-[#e5e5e5] dark:border-white/[0.1] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
        <Bot className="size-3.5 text-[#171717] dark:text-[#f4f4f5]" />
      </div>

      {/* Assistant Content Container */}
      <div className="flex-1 min-w-0">
        {/* Header line: Name + Time + Latency + Actions */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#171717] dark:text-[#f4f4f5]">DocMind</span>
            {timeStr && (
              <span className="text-[11px] font-sans text-[#a3a3a3]">{timeStr}</span>
            )}
            {message.responseTimeMs !== undefined && message.responseTimeMs > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-mono text-[#737373] dark:text-[#a3a3a3] tabular-nums">
                <Zap className="size-2 text-[#a3a3a3]" />
                {message.responseTimeMs}ms
              </span>
            )}
          </div>

          {/* Copy action for completed responses */}
          {isCompleted && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-[#737373] hover:text-[#171717] dark:text-[#a3a3a3] dark:hover:text-[#f4f4f5] transition-opacity cursor-pointer px-1.5 py-0.5 rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              title="Copy response"
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>

        {/* State 1: Waiting / Synthesizing (Never a big empty bubble) */}
        {isWaiting && (
          <div className="flex items-center gap-2.5 py-2 text-xs text-[#737373] dark:text-[#a3a3a3]">
            <div className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-[#171717] dark:bg-[#f4f4f5] animate-pulse" />
              <span className="size-1.5 rounded-full bg-[#171717] dark:bg-[#f4f4f5] animate-pulse [animation-delay:200ms]" />
              <span className="size-1.5 rounded-full bg-[#171717] dark:bg-[#f4f4f5] animate-pulse [animation-delay:400ms]" />
            </div>
            <span className="font-medium text-[#737373] dark:text-[#a3a3a3]">Searching knowledge base & synthesizing…</span>
          </div>
        )}

        {/* State 2 & 3: Streaming or Completed Content */}
        {(isStreamingWithContent || isCompleted) && (
          <div className="bg-[#fafafa]/80 dark:bg-[#141416]/90 border border-[#e5e5e5] dark:border-white/[0.06] rounded-2xl rounded-tl-xs p-4 shadow-2xs">
            <MarkdownContent content={message.content} isStreaming={message.isStreaming} />
          </div>
        )}

        {/* State 4: Failed Response with Retry Action */}
        {isError && (
          <div className="rounded-xl p-3.5 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 text-xs shadow-2xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="size-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-rose-950 dark:text-rose-200">Unable to generate response</p>
                <p className="text-rose-700 dark:text-rose-300 mt-0.5 text-[11px] leading-relaxed">
                  Could not reach the document intelligence service. Verify that the backend service is running and retry.
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium hover:bg-rose-50 dark:hover:bg-rose-900/50 transition-colors cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="size-3" />
                    <span>Retry query</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* State 5: Empty Response */}
        {isEmpty && (
          <div className="text-xs text-[#737373] dark:text-[#a3a3a3] italic py-1">
            No answer could be retrieved for this query. Try rephrasing with different keywords.
          </div>
        )}

        {/* Grounding Citations */}
        {isCompleted && (message.citations?.length ?? 0) > 0 && (
          <div className="mt-2.5">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="flex items-center gap-1.5 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] transition-colors cursor-pointer"
            >
              <FileText className="size-3 text-[#a3a3a3]" />
              <span>{message.citations!.length} citation{message.citations!.length > 1 ? 's' : ''}</span>
              {showCitations ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>
            {showCitations && (
              <div className="mt-2 space-y-1.5">
                {message.citations!.map((c, i) => (
                  <CitationCard key={i} citation={c} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ChatView: React.FC = () => {
  const { selectedDocumentId, setSelectedDocumentId, documents } = useDocumentStore();
  const {
    activeConversationId,
    messages: allMessages,
    streamingMode,
    setStreamingMode,
    newChat,
    appendMessage,
    updateLastMessageContent,
    updateMessageMetadata,
  } = useConversationStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoScrollRef = useRef(true);

  const messages = allMessages[activeConversationId] || [];
  const selectedDoc = documents.find((d) => d.id === selectedDocumentId);

  useEffect(() => {
    if (autoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    autoScrollRef.current = scrollHeight - scrollTop - clientHeight < 60;
  };

  /* ── Streaming Sender ── */
  const sendStreaming = useCallback(async (question: string, convId: string) => {
    setIsStreaming(true);
    abortRef.current = new AbortController();

    const assistantMsgId = crypto.randomUUID();
    const startTime = Date.now();

    await appendMessage(convId, {
      id: assistantMsgId,
      messageType: 'ASSISTANT',
      content: '',
      isStreaming: true,
      createdAt: new Date().toISOString(),
    });

    try {
      const response = await chatApi.stream(
        {
          question,
          documentId: selectedDocumentId || undefined,
          conversationId: convId,
        },
        abortRef.current.signal
      );

      if (!response.ok) {
        throw new Error(`Service returned HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const textChunk = decoder.decode(value, { stream: true });
          accumulated += textChunk;
          updateLastMessageContent(convId, assistantMsgId, accumulated, true);
        }
      }

      const latency = Date.now() - startTime;
      updateLastMessageContent(convId, assistantMsgId, accumulated, false);
      await updateMessageMetadata(convId, assistantMsgId, {
        isStreaming: false,
        responseTimeMs: latency,
      });
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        const errorMsg = (err as Error)?.message || 'Service unavailable';
        updateLastMessageContent(convId, assistantMsgId, `Error: ${errorMsg}`, false);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [selectedDocumentId, appendMessage, updateLastMessageContent, updateMessageMetadata]);

  /* ── Normal Sender ── */
  const sendNormal = useCallback(async (question: string, convId: string) => {
    setIsLoading(true);
    const startTime = Date.now();
    const assistantMsgId = crypto.randomUUID();

    // Append waiting placeholder
    await appendMessage(convId, {
      id: assistantMsgId,
      messageType: 'ASSISTANT',
      content: '',
      isStreaming: true,
      createdAt: new Date().toISOString(),
    });

    try {
      const res = await chatApi.query({
        question,
        documentId: selectedDocumentId || undefined,
        conversationId: convId,
      });

      const latency = Date.now() - startTime;
      updateLastMessageContent(convId, assistantMsgId, res.data.answer, false);
      await updateMessageMetadata(convId, assistantMsgId, {
        citations: res.data.citations,
        responseTimeMs: res.data.responseTimeMs || latency,
        isStreaming: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Service unavailable';
      updateLastMessageContent(convId, assistantMsgId, `Error: ${msg}`, false);
      await updateMessageMetadata(convId, assistantMsgId, { isStreaming: false });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDocumentId, appendMessage, updateLastMessageContent, updateMessageMetadata]);

  /* ── Send Dispatcher ── */
  const sendMessage = useCallback(async (question: string) => {
    if (!question.trim() || isLoading || isStreaming) return;
    setShowTemplates(false);

    const convId = activeConversationId || crypto.randomUUID();
    const userMsg: ConversationMessage = {
      id: crypto.randomUUID(),
      messageType: 'USER',
      content: question.trim(),
      createdAt: new Date().toISOString(),
    };

    setInput('');
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }

    await appendMessage(convId, userMsg);

    if (streamingMode) {
      await sendStreaming(question.trim(), convId);
    } else {
      await sendNormal(question.trim(), convId);
    }
    inputRef.current?.focus();
  }, [isLoading, isStreaming, activeConversationId, streamingMode, appendMessage, sendStreaming, sendNormal]);

  const stopStream = () => {
    abortRef.current?.abort();
  };

  const handleNewChat = () => {
    newChat();
    setShowTemplates(true);
    abortRef.current?.abort();
  };

  const isBusy = isLoading || isStreaming;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0c0c0e] transition-colors duration-150">
      {/* Subheader Toolbar: Unified Workspace Control Strip */}
      <div className="flex items-center justify-between h-10 px-5 border-b border-[#e5e5e5] dark:border-white/[0.08] flex-shrink-0 bg-[#fafafa] dark:bg-[#141416]">
        {/* Left: Document Scope Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#737373] dark:text-[#a3a3a3]">Scope:</span>
          {selectedDoc ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-white/[0.06] border border-[#e5e5e5] dark:border-white/[0.08] text-[#171717] dark:text-[#f4f4f5] font-medium font-sans text-xs shadow-2xs">
              <FileText className="size-3 text-[#737373] dark:text-[#a3a3a3]" />
              <span className="truncate max-w-[200px]">{selectedDoc.filename}</span>
              <button
                onClick={() => setSelectedDocumentId(null)}
                className="text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] ml-0.5 cursor-pointer"
                title="Clear filter and search all documents"
              >
                <X className="size-3" />
              </button>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#f0f0f0] dark:bg-white/[0.04] text-[#171717] dark:text-[#f4f4f5] font-medium text-xs">
              All documents
            </span>
          )}
        </div>

        {/* Right: Stream Toggle & New Chat Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStreamingMode(!streamingMode)}
            className={cn(
              'flex items-center gap-1.5 text-xs h-7 px-2.5 rounded-md border transition-all cursor-pointer font-sans select-none',
              streamingMode
                ? 'bg-white border-[#e5e5e5] text-[#171717] dark:bg-white/[0.08] dark:border-white/[0.1] dark:text-[#f4f4f5] shadow-2xs'
                : 'border-transparent text-[#737373] hover:text-[#171717] dark:text-[#a3a3a3] dark:hover:text-[#f4f4f5]'
            )}
            title={streamingMode ? 'Streaming enabled' : 'Click to enable streaming'}
          >
            <span className={cn('size-1.5 rounded-full', streamingMode ? 'bg-emerald-500' : 'bg-[#a3a3a3]')} />
            <span>Streaming</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 text-xs h-7 px-2.5 rounded-md border border-[#e5e5e5] dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/[0.16] text-[#171717] dark:text-[#f4f4f5] bg-white dark:bg-white/[0.04] shadow-2xs transition-colors cursor-pointer font-sans"
            >
              <Plus className="size-3.5" />
              <span>New chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Canvas */}
      <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Empty State: Structured Prompts */}
        {messages.length === 0 && showTemplates && (
          <div className="max-w-2xl mx-auto pt-4 pb-4">
            <div className="text-center mb-8">
              <div className="size-10 rounded-xl bg-[#f5f5f5] dark:bg-[#18181c] border border-[#e5e5e5] dark:border-white/[0.1] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <Layers className="size-4.5 text-[#171717] dark:text-[#f4f4f5]" strokeWidth={1.75} />
              </div>
              <h2 className="text-lg font-semibold text-[#171717] dark:text-[#f4f4f5] text-balance tracking-tight">
                DocMind Assistant
              </h2>
              <p className="text-[#737373] dark:text-[#a3a3a3] text-xs leading-relaxed max-w-sm mx-auto mt-1 text-pretty">
                {selectedDoc
                  ? `Querying "${selectedDoc.filename}". Select a prompt or type below.`
                  : 'Ask grounded questions across all indexed documents in your knowledge base.'}
              </p>
            </div>

            {/* Prompt Suggestion Groups */}
            <div className="space-y-4">
              {PROMPT_GROUPS.map((group) => (
                <div key={group.category} className="space-y-2">
                  <h3 className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] px-1">
                    {group.category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => sendMessage(item.prompt)}
                        className="text-left p-3 rounded-xl bg-[#fafafa] hover:bg-white dark:bg-[#141416] dark:hover:bg-[#1a1a1f] border border-[#e5e5e5] dark:border-white/[0.06] hover:border-neutral-300 dark:hover:border-white/[0.14] transition-all group cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-xs font-medium text-[#171717] dark:text-[#f4f4f5] mb-1">
                          <span>{item.label}</span>
                          <ArrowUpRight className="size-3 text-[#a3a3a3] group-hover:text-[#171717] dark:group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-[#737373] dark:text-[#a3a3a3] text-[11px] line-clamp-2 leading-relaxed">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg, idx) => {
          const prevUserMsg = messages
            .slice(0, idx)
            .reverse()
            .find((m) => m.messageType === 'USER');
          const retryHandler = prevUserMsg ? () => sendMessage(prevUserMsg.content) : undefined;

          return (
            <MessageItem
              key={msg.id}
              message={msg}
              onRetry={retryHandler}
            />
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Chat Composer */}
      <div className="px-4 pb-4 pt-2 border-t border-[#e5e5e5] dark:border-white/[0.06] flex-shrink-0 bg-white dark:bg-[#0c0c0e]">
        <div className="max-w-3xl mx-auto">
          <div className={cn(
            'rounded-2xl border transition-all shadow-xs',
            'bg-white dark:bg-[#141416]',
            isBusy
              ? 'border-[#e5e5e5] dark:border-white/[0.08]'
              : 'border-[#e5e5e5] dark:border-white/[0.1] focus-within:border-[#151515] dark:focus-within:border-white/40 focus-within:ring-2 focus-within:ring-black/[0.04] dark:focus-within:ring-white/[0.04]'
          )}>
            {/* Input area */}
            <div className="px-4 pt-3.5 pb-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder={
                  isBusy
                    ? 'Synthesizing response…'
                    : selectedDoc
                    ? `Ask a question about ${selectedDoc.filename}…`
                    : 'Ask a question across all indexed documents…'
                }
                rows={1}
                disabled={isBusy}
                className="w-full bg-transparent text-sm text-[#171717] dark:text-[#f4f4f5] placeholder-[#a3a3a3] resize-none outline-none leading-relaxed disabled:opacity-50"
                style={{ minHeight: '26px', maxHeight: '160px' }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = 'auto';
                  t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
                }}
              />
            </div>

            {/* Internal Bottom Bar */}
            <div className="flex items-center justify-between px-3.5 py-2 border-t border-[#f0f0f0] dark:border-white/[0.04] bg-[#fafafa]/60 dark:bg-[#111114] rounded-b-2xl">
              {/* Left: Active Scope indicator */}
              <div className="flex items-center gap-1.5 text-xs text-[#737373] dark:text-[#a3a3a3]">
                <Layers className="size-3 text-[#a3a3a3]" />
                <span className="truncate max-w-[200px]">
                  {selectedDoc ? selectedDoc.filename : 'All indexed documents'}
                </span>
              </div>

              {/* Right: Keyboard Shortcut Hint & Send/Stop Actions */}
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-[#a3a3a3] font-sans hidden sm:inline">
                  <kbd className="font-mono text-[10px] bg-neutral-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-[#e5e5e5] dark:border-white/[0.08]">↵</kbd> send · <kbd className="font-mono text-[10px] bg-neutral-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-[#e5e5e5] dark:border-white/[0.08]">shift+↵</kbd> newline
                </span>

                {isStreaming ? (
                  <button
                    onClick={stopStream}
                    className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-[#151515] text-white dark:bg-white dark:text-[#151515] text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                  >
                    <Square className="size-2.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isBusy}
                    className={cn(
                      'size-7 rounded-lg flex items-center justify-center transition-all cursor-pointer',
                      input.trim() && !isBusy
                        ? 'bg-[#151515] text-white hover:bg-black dark:bg-[#ffffff] dark:text-[#151515] dark:hover:bg-neutral-100 active:scale-[0.98] shadow-2xs'
                        : 'bg-[#f0f0f0] dark:bg-white/[0.06] text-[#a3a3a3] cursor-not-allowed'
                    )}
                    aria-label="Send message"
                  >
                    {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;

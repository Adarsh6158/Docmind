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
  Zap, RotateCcw, Square, Copy, Check, Sparkles, Layers, ArrowUpRight
} from 'lucide-react';
import { chatApi } from '../services/api';
import { useDocumentStore } from '../store/documentStore';
import { useConversationStore } from '../store/conversationStore';
import type { ConversationMessage, CitationDto } from '../types';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

/* ─── Premium starter prompt templates (Clean, Restrained) ──────── */
const PROMPT_STARTERS = [
  {
    category: 'Analysis & Synthesis',
    items: [
      { label: 'Executive Summary', prompt: 'Provide a concise executive summary of the key findings in this document.' },
      { label: 'Action Items & Next Steps', prompt: 'Extract all concrete action items, responsibilities, and deadlines.' },
    ],
  },
  {
    category: 'Governance & Clauses',
    items: [
      { label: 'Key Clauses & Obligations', prompt: 'What are the critical contractual clauses, rights, and obligations?' },
      { label: 'Risk & Liability Assessment', prompt: 'Identify potential risks, ambiguities, and liability exposures.' },
    ],
  },
  {
    category: 'Facts & Data Points',
    items: [
      { label: 'Key Metrics & Figures', prompt: 'List all metrics, numerical figures, and performance indicators.' },
      { label: 'Definitions & Terminology', prompt: 'Explain the core specialized concepts and definitions used.' },
    ],
  },
];

/* ─── Prism token-to-React renderer ─── */
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

/* ─── Code block component ─── */
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
    <div className="my-3 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-100 dark:bg-[#0c0c0e] overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-200/70 dark:bg-[#141418] border-b border-zinc-200 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
        <span className="font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-300">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-0.5 rounded bg-zinc-300/60 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto">
        <pre className="font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 m-0 p-0 bg-transparent border-0">
          <code className={`language-${normalizedLang}`}>{renderPrismTokens(tokens, 'code')}</code>
        </pre>
      </div>
    </div>
  );
};

/* ─── ReactMarkdown Renderer ─── */
const MarkdownContent: React.FC<{ content: string; isStreaming?: boolean }> = ({ content, isStreaming }) => {
  return (
    <div className="text-sm leading-relaxed overflow-hidden text-zinc-800 dark:text-zinc-200 space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            return <p className="mb-2.5 last:mb-0 leading-relaxed text-pretty">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-4 mb-2 pb-1 border-b border-zinc-200 dark:border-white/[0.08] first:mt-0 text-balance">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-3.5 mb-1.5 first:mt-0 text-balance">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-3 mb-1 first:mt-0">{children}</h3>;
          },
          ul({ children }) {
            return <ul className="list-disc ml-5 pl-1 space-y-1.5 my-2 text-zinc-700 dark:text-zinc-300">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal ml-5 pl-1 space-y-1.5 my-2 text-zinc-700 dark:text-zinc-300">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed pl-0.5">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-zinc-400 dark:border-zinc-500 bg-black/[0.02] dark:bg-white/[0.02] px-3.5 py-1.5 rounded-r-md text-zinc-600 dark:text-zinc-300 italic my-2 text-xs leading-relaxed">
                {children}
              </blockquote>
            );
          },
          hr() {
            return <hr className="border-zinc-200 dark:border-white/[0.08] my-3" />;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 transition-colors font-medium"
              >
                {children}
              </a>
            );
          },
          strong({ children }) {
            return <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-zinc-600 dark:text-zinc-300">{children}</em>;
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-white/[0.08]">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/[0.08] text-left text-xs">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-zinc-100 dark:bg-zinc-900/80">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04] bg-white dark:bg-[#0c0c0e]">{children}</tbody>;
          },
          th({ children }) {
            return <th className="px-3 py-2 font-medium text-zinc-800 dark:text-zinc-200">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-1.5 text-zinc-700 dark:text-zinc-300">{children}</td>;
          },
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isMultiLine = codeString.includes('\n');
            if (match || isMultiLine) {
              return <CodeBlock language={match ? match[1] : ''} code={codeString} />;
            }
            return (
              <code className="px-1.5 py-0.5 mx-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded text-[12px] font-mono border border-zinc-200 dark:border-white/[0.08]">
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

/* ─── Citation Card ─── */
const CitationCard: React.FC<{ citation: CitationDto; index: number }> = ({ citation, index }) => {
  const [expanded, setExpanded] = useState(false);
  const score = citation.similarityScore ?? 0;
  const pct = (score * 100).toFixed(0);

  return (
    <div className="border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden bg-white dark:bg-zinc-950/60 hover:border-zinc-300 dark:hover:border-white/[0.14] transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 p-2.5 text-left cursor-pointer"
      >
        <span className="flex-shrink-0 size-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md text-[11px] flex items-center justify-center font-mono border border-zinc-200 dark:border-white/[0.06]">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <FileText className="size-3 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
            <p className="text-xs text-zinc-800 dark:text-zinc-200 font-mono truncate">{citation.fileName}</p>
            {citation.pageNumber && (
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono flex-shrink-0">p.{citation.pageNumber}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-1 bg-zinc-700 dark:bg-zinc-400 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 tabular-nums flex-shrink-0">{pct}% match</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="size-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" /> : <ChevronDown className="size-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-zinc-200 dark:border-white/[0.06]">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono mt-2 bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-200 dark:border-white/[0.04]">
            {citation.snippet}
          </p>
        </div>
      )}
    </div>
  );
};

/* ─── Message Bubble ─── */
const MessageBubble: React.FC<{ message: ConversationMessage }> = ({ message }) => {
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

  return (
    <div className={cn('flex gap-3 group max-w-3xl mx-auto w-full', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'size-7 rounded-lg flex items-center justify-center flex-shrink-0 border mt-0.5',
        isUser
          ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-white/[0.1] text-zinc-800 dark:text-zinc-200'
          : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-white/[0.12] text-zinc-900 dark:text-zinc-100'
      )}>
        {isUser ? <User className="size-3.5" strokeWidth={1.75} /> : <Bot className="size-3.5" strokeWidth={1.75} />}
      </div>

      {/* Bubble Container */}
      <div className={cn('max-w-[82%] min-w-0', isUser ? 'items-end' : 'items-start')}>
        <div className={cn(
          'rounded-2xl px-4 py-3 text-sm shadow-xs',
          isUser
            ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-800 dark:border-white/[0.08] rounded-tr-xs'
            : 'bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 rounded-tl-xs'
        )}>
          {isUser ? (
            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} isStreaming={message.isStreaming} />
          )}
        </div>

        {/* Footer info: time, response latency, copy */}
        <div className={cn('flex items-center gap-2 mt-1 px-1', isUser ? 'justify-end' : 'justify-start')}>
          {timeStr && (
            <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-600">
              {timeStr}
            </span>
          )}

          {!isUser && message.responseTimeMs !== undefined && message.responseTimeMs > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 tabular-nums">
              <Zap className="size-2.5 text-zinc-400" />
              {message.responseTimeMs}ms
            </span>
          )}

          {!isUser && !message.isStreaming && message.content && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all cursor-pointer ml-1"
              title="Copy answer"
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            </button>
          )}
        </div>

        {/* Grounding Citations */}
        {!isUser && (message.citations?.length ?? 0) > 0 && !message.isStreaming && (
          <div className="mt-2.5">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer font-mono"
            >
              <FileText className="size-3 text-zinc-500 dark:text-zinc-400" />
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

/* ─── Typing Indicator ─── */
const TypingIndicator = () => (
  <div className="flex gap-3 max-w-3xl mx-auto w-full">
    <div className="size-7 flex-shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.12] flex items-center justify-center">
      <Bot className="size-3.5 text-zinc-700 dark:text-zinc-200" />
    </div>
    <div className="bg-zinc-50 dark:bg-[#121215] border border-zinc-200 dark:border-white/[0.08] rounded-2xl rounded-tl-xs px-3.5 py-2.5 flex items-center gap-1">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  </div>
);

export const ChatView: React.FC = () => {
  const { selectedDocumentId, documents } = useDocumentStore();
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
        throw new Error(`Streaming failed with status: ${response.status}`);
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
        const errorMsg = (err as Error)?.message || 'Stream connection failed';
        toast.error(errorMsg);
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

    try {
      const res = await chatApi.query({
        question,
        documentId: selectedDocumentId || undefined,
        conversationId: convId,
      });

      const latency = Date.now() - startTime;
      await appendMessage(convId, {
        id: crypto.randomUUID(),
        messageType: 'ASSISTANT',
        content: res.data.answer,
        citations: res.data.citations,
        responseTimeMs: res.data.responseTimeMs || latency,
        createdAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(msg);
      await appendMessage(convId, {
        id: crypto.randomUUID(),
        messageType: 'ASSISTANT',
        content: `Error: ${msg}`,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDocumentId, appendMessage]);

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
  const charCount = input.length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#09090b] transition-colors duration-200">
      {/* Subheader Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-zinc-200 dark:border-white/[0.08] flex-shrink-0 bg-zinc-50 dark:bg-[#0e0e11]">
        <div className="flex items-center gap-2">
          <Layers className="size-3.5 text-zinc-500 dark:text-zinc-400" />
          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {selectedDoc ? selectedDoc.filename : 'All Documents Scope'}
          </span>
          {selectedDoc && (
            <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-white/[0.06]">
              Filtered
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Streaming Toggle */}
          <button
            onClick={() => setStreamingMode(!streamingMode)}
            className={cn(
              'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer font-mono',
              streamingMode
                ? 'bg-zinc-100 border-zinc-300 text-zinc-800 dark:bg-zinc-800/80 dark:border-white/[0.1] dark:text-zinc-200'
                : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300'
            )}
            title={streamingMode ? 'Streaming enabled' : 'Normal mode'}
          >
            <span className={cn('size-1.5 rounded-full', streamingMode ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-zinc-400 dark:bg-zinc-600')} />
            <span>Streaming</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.16] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3" />
              <span>New</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Canvas */}
      <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && showTemplates && (
          <div className="max-w-2xl mx-auto pt-8 pb-4">
            <div className="text-center mb-8">
              <div className="size-11 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.1] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Sparkles className="size-5 text-zinc-700 dark:text-zinc-200" strokeWidth={1.75} />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 text-balance tracking-tight">
                DocMind Assistant
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto mt-1 text-pretty">
                {selectedDoc
                  ? `Querying "${selectedDoc.filename}". Select a prompt or type below.`
                  : 'Ask grounded questions across all indexed documents in your knowledge base.'}
              </p>
            </div>

            {/* Prompt Suggestion Cards */}
            <div className="space-y-4">
              {PROMPT_STARTERS.map((cat) => (
                <div key={cat.category} className="space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
                    {cat.category}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.items.map((t) => (
                      <button
                        key={t.label}
                        onClick={() => sendMessage(t.prompt)}
                        className="text-left p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100/90 dark:bg-[#121215] dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.14] transition-all group cursor-pointer shadow-xs"
                      >
                        <div className="flex items-center justify-between text-xs font-medium text-zinc-800 dark:text-zinc-200 mb-1">
                          <span>{t.label}</span>
                          <ArrowUpRight className="size-3 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors" />
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-500 text-[11px] line-clamp-1 group-hover:text-zinc-700 dark:group-hover:text-zinc-400 transition-colors leading-relaxed">
                          {t.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && !isStreaming && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input Box Footer */}
      <div className="px-4 pb-4 pt-2 border-t border-zinc-200 dark:border-white/[0.06] flex-shrink-0 bg-zinc-50 dark:bg-[#0e0e11]">
        <div className="max-w-3xl mx-auto">
          {/* Active Streaming Indicator */}
          {isStreaming && (
            <div className="flex items-center gap-1.5 mb-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>Generating response…</span>
            </div>
          )}

          <div className="bg-white dark:bg-[#141418] border border-zinc-300 dark:border-white/[0.1] focus-within:border-zinc-500 dark:focus-within:border-white/[0.22] rounded-xl px-3.5 py-2.5 transition-colors shadow-xs flex gap-2.5 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
              }}
              placeholder={
                isBusy ? 'Processing query…' :
                selectedDoc ? `Ask about ${selectedDoc.filename}…` :
                'Ask questions across your documents…'
              }
              rows={1}
              disabled={isBusy}
              className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 resize-none outline-none leading-relaxed disabled:opacity-50"
              style={{ minHeight: '22px', maxHeight: '140px' }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = `${Math.min(t.scrollHeight, 140)}px`;
              }}
            />

            {isStreaming ? (
              <button
                onClick={stopStream}
                className="size-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 flex items-center justify-center cursor-pointer transition-colors"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="size-3" />
              </button>
            ) : (
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isBusy}
                className={cn(
                  'size-7 rounded-lg flex items-center justify-center transition-all cursor-pointer',
                  input.trim() && !isBusy
                    ? 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white active:scale-[0.98]'
                    : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                )}
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-1.5 px-1 text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
            <span>Enter to send · Shift+Enter for newline</span>
            <div className="flex items-center gap-2">
              {charCount > 0 && <span className="tabular-nums">{charCount} chars</span>}
              {messages.length > 0 && <span className="tabular-nums">{messages.length} msgs</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;

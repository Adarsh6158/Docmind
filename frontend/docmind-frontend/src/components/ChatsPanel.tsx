import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare, Plus, Trash2, Clock, Search, Edit2, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversationStore } from '../store/conversationStore';
import { useDocumentStore } from '../store/documentStore';
import type { Conversation } from '../types';
import { cn } from '../lib/utils';

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function getGroupLabel(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    const startOfLast7Days = new Date(startOfToday.getTime() - 7 * 86400000);

    if (date >= startOfToday) return 'Today';
    if (date >= startOfYesterday) return 'Yesterday';
    if (date >= startOfLast7Days) return 'Previous 7 Days';
    return 'Older';
  } catch {
    return 'Older';
  }
}

const SkeletonChat: React.FC = () => (
  <div className="p-2.5 rounded-xl border border-[#e5e5e5] dark:border-white/[0.05] bg-white dark:bg-[#141416] flex items-center gap-2.5 animate-pulse">
    <div className="size-6 rounded-lg bg-[#f5f5f5] dark:bg-white/[0.06] flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3 bg-[#f5f5f5] dark:bg-white/[0.06] rounded w-4/5" />
      <div className="h-2 bg-[#f5f5f5]/80 dark:bg-white/[0.04] rounded w-1/3" />
    </div>
  </div>
);

const ChatItem: React.FC<{
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}> = ({ conversation, isActive, onSelect, onDelete, onRename }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(conversation.title);
    setIsEditing(true);
  };

  const handleSaveEdit = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.stopPropagation();
    if (editTitle.trim() && editTitle.trim() !== conversation.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(conversation.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit(e as unknown as React.MouseEvent);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.12 }}
      onClick={isEditing ? undefined : onSelect}
      className={cn(
        'group relative flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none',
        isActive
          ? 'border-[#151515] dark:border-white/[0.25] bg-white dark:bg-[#18181c] shadow-2xs text-[#171717] dark:text-[#f4f4f5]'
          : 'border-[#e5e5e5] dark:border-white/[0.05] bg-white dark:bg-[#141416] hover:border-neutral-300 dark:hover:border-white/[0.1] text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5]'
      )}
    >
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <div
          className={cn(
            'size-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
            isActive
              ? 'bg-[#f5f5f5] dark:bg-white/[0.1] text-[#171717] dark:text-[#f4f4f5]'
              : 'bg-[#fafafa] dark:bg-[#1a1a1e] text-[#a3a3a3] group-hover:text-[#171717] dark:group-hover:text-[#f4f4f5]'
          )}
        >
          <MessageSquare className="size-3.5" strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-white dark:bg-[#101013] border border-[#151515] dark:border-white/30 text-[#171717] dark:text-[#f4f4f5] text-xs rounded px-2 py-0.5 focus:outline-none font-sans"
                aria-label="Edit chat title"
              />
              <button
                onClick={handleSaveEdit}
                aria-label="Save title"
                className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded cursor-pointer"
              >
                <Check className="size-3.5" />
              </button>
              <button
                onClick={handleCancelEdit}
                aria-label="Cancel"
                className="p-1 text-[#a3a3a3] hover:text-[#171717] dark:text-[#737373] dark:hover:text-[#f4f4f5] rounded cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium truncate leading-snug">
                {conversation.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="size-2.5 text-[#a3a3a3] flex-shrink-0" />
                <span className="text-[11px] font-sans text-[#a3a3a3]">
                  {formatRelativeTime(conversation.updatedAt)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={handleStartEdit}
            aria-label="Rename conversation"
            className="size-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-[#f5f5f5] dark:hover:bg-white/[0.06] text-[#a3a3a3] hover:text-[#171717] dark:text-[#737373] dark:hover:text-[#f4f4f5] transition-all cursor-pointer"
            title="Rename"
          >
            <Edit2 className="size-3" />
          </button>
          <button
            onClick={handleDelete}
            aria-label={confirmDelete ? 'Confirm delete' : 'Delete conversation'}
            className={cn(
              'h-6 flex items-center justify-center rounded-md text-xs transition-all cursor-pointer',
              confirmDelete
                ? 'px-1.5 bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-200 dark:border-rose-500/25 font-sans font-medium text-[10px]'
                : 'w-6 opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-[#a3a3a3] hover:text-rose-600 dark:text-[#737373] dark:hover:text-rose-400'
            )}
            title="Delete"
          >
            {confirmDelete ? 'Delete?' : <Trash2 className="size-3" />}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export const ChatsPanel: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    isLoadingChats,
    newChat,
    selectChat,
    deleteChat,
    renameChat,
  } = useConversationStore();
  const { setActiveTab } = useDocumentStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewChat = () => {
    newChat();
    setActiveTab('chat');
  };

  const handleSelectChat = (id: string) => {
    selectChat(id);
    setActiveTab('chat');
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const groupedConversations = useMemo(() => {
    const groups: Record<string, Conversation[]> = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    filteredConversations.forEach((chat) => {
      const label = getGroupLabel(chat.updatedAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(chat);
    });

    return groups;
  }, [filteredConversations]);

  const groupKeys = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top action bar: New Conversation + Search */}
      <div className="p-2.5 space-y-2 border-b border-[#e5e5e5] dark:border-white/[0.06] flex-shrink-0 bg-[#fafafa] dark:bg-[#101013]">
        <button
          onClick={handleNewChat}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium',
            'bg-[#151515] text-white hover:bg-black dark:bg-[#ffffff] dark:text-[#151515] dark:hover:bg-neutral-100',
            'active:scale-[0.98] transition-all shadow-2xs cursor-pointer'
          )}
        >
          <div className="flex items-center gap-2">
            <Plus className="size-3.5" strokeWidth={2} />
            <span>New Conversation</span>
          </div>
          <span className="text-[10px] font-mono opacity-60">⌘K</span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 size-3.5 text-[#a3a3a3]" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#141416] border border-[#e5e5e5] dark:border-white/[0.08] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#171717] dark:text-[#f4f4f5] placeholder-[#a3a3a3] outline-none focus:border-[#151515] dark:focus:border-white/20 transition-colors shadow-2xs font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {isLoadingChats ? (
          <div className="space-y-1.5">
            <SkeletonChat />
            <SkeletonChat />
            <SkeletonChat />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="size-9 bg-white dark:bg-[#141416] border border-[#e5e5e5] dark:border-white/[0.08] rounded-xl flex items-center justify-center mb-2 shadow-2xs">
              <MessageSquare className="size-4 text-[#a3a3a3]" strokeWidth={1.5} />
            </div>
            <p className="text-xs text-[#171717] dark:text-[#f4f4f5] font-medium">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </p>
            <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
              {searchQuery ? 'Try another search query' : 'Start a new conversation to ask questions'}
            </p>
          </div>
        ) : (
          groupKeys.map((group) => {
            const chats = groupedConversations[group];
            if (!chats || chats.length === 0) return null;

            return (
              <div key={group} className="space-y-1">
                <p className="text-xs font-medium text-[#737373] dark:text-[#a3a3a3] px-2 py-0.5">
                  {group}
                </p>
                <div className="space-y-1">
                  <AnimatePresence mode="popLayout">
                    {chats.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        conversation={chat}
                        isActive={chat.id === activeConversationId}
                        onSelect={() => handleSelectChat(chat.id)}
                        onDelete={() => deleteChat(chat.id)}
                        onRename={(newTitle) => renameChat(chat.id, newTitle)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatsPanel;

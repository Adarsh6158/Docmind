import React, { useState, useRef, useEffect } from 'react';
import {
  Layers, MessageSquare, Search, Database, Upload, PanelLeft, FileText,
  LogOut, Shield, ChevronDown, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDocumentStore } from '../store/documentStore';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  onUploadClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onUploadClick }) => {
  const {
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,
    documents,
    selectedDocumentId,
    setSelectedDocumentId
  } = useDocumentStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tabs: { id: 'chat' | 'search' | 'chunks'; label: string; icon: React.FC<{ className?: string; strokeWidth?: number }> }[] = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'chunks', label: 'Chunks', icon: Database },
  ];

  const selectedDoc = documents.find((d) => d.id === selectedDocumentId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="flex items-center justify-between h-13 px-4 bg-white dark:bg-[#0e0e11] border-b border-zinc-200 dark:border-white/[0.08] flex-shrink-0 z-20 select-none transition-colors duration-200">
      {/* Left: sidebar toggle + brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            'size-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
            'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 active:scale-[0.98]'
          )}
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className={cn('size-4', !isSidebarOpen && 'text-zinc-900 dark:text-zinc-100')} strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="size-6.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.12] flex items-center justify-center shadow-xs">
            <Layers className="size-3.5 text-zinc-900 dark:text-zinc-200" strokeWidth={2} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">DocMind</span>
            <span className="text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/[0.06] px-1.5 py-0.2 rounded-md">
              v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Center: segmented navigation */}
      <nav className="flex items-center">
        <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/[0.06] rounded-lg p-0.5 shadow-inner">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200/80 dark:border-white/[0.08]'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-white/[0.04]'
                )}
              >
                <Icon className="size-3.5" strokeWidth={isActive ? 2 : 1.75} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Right: theme toggle + document context badge + upload + profile */}
      <div className="flex items-center gap-2">
        {selectedDoc && (
          <div className="hidden md:flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/[0.08] pl-2.5 pr-1.5 py-1 rounded-lg text-xs max-w-[200px]">
            <FileText className="size-3 text-zinc-500 dark:text-zinc-400 flex-shrink-0" strokeWidth={1.75} />
            <span className="text-zinc-700 dark:text-zinc-300 truncate font-mono text-[11px]">{selectedDoc.filename}</span>
            <button
              onClick={() => setSelectedDocumentId(null)}
              className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 rounded transition-colors cursor-pointer ml-0.5"
              title="Clear document filter"
              aria-label="Clear document filter"
            >
              <X className="size-3" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Theme Toggle Button */}
        <ThemeToggle />

        <button
          onClick={onUploadClick}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
            'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white active:scale-[0.98] transition-all cursor-pointer',
            'border border-zinc-800 dark:border-white/20 shadow-xs'
          )}
        >
          <Upload className="size-3.5" strokeWidth={2} />
          <span>Upload</span>
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              'flex items-center gap-2 py-1 pl-1 pr-2 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800/80',
              'border border-zinc-200 dark:border-white/[0.08] rounded-lg transition-colors cursor-pointer group'
            )}
            aria-label="User menu"
          >
            <div className="size-5.5 rounded-md bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-white/[0.1] flex items-center justify-center text-[10px] font-semibold text-zinc-800 dark:text-zinc-200">
              {getInitials(user?.username)}
            </div>
            <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium max-w-[80px] truncate hidden sm:block">
              {user?.username || 'User'}
            </span>
            <ChevronDown className={cn('size-3 text-zinc-400 dark:text-zinc-500 transition-transform duration-150', isMenuOpen && 'rotate-180')} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-white/[0.1] rounded-xl shadow-xl py-1 z-50">
              <div className="px-3.5 py-2.5 border-b border-zinc-200 dark:border-white/[0.06]">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.username}</p>
                  {user?.role && (
                    <span className="text-[9px] uppercase font-mono font-medium tracking-wider px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] flex items-center gap-1">
                      <Shield className="size-2.5" />
                      {user.role}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{user?.email}</p>
              </div>

              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="size-3.5" strokeWidth={1.75} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

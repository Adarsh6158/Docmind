import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Search, Database, Upload, PanelLeft,
  LogOut, Shield, ChevronDown, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDocumentStore } from '../store/documentStore';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import ThemeToggle from './ThemeToggle';
import { DocMindLogo } from './DocMindLogo';
import { FileFormatIcon } from './FileFormatIcon';

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
    <header className="flex items-center justify-between h-13 px-3 sm:px-4 bg-white dark:bg-[#141416] border-b border-[#e5e5e5] dark:border-white/[0.08] flex-shrink-0 z-20 select-none transition-colors duration-150">
      {/* Left: sidebar toggle + brand */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            'size-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
            'hover:bg-[#f5f5f5] dark:hover:bg-white/[0.06] text-[#737373] hover:text-[#171717] dark:text-[#a3a3a3] dark:hover:text-[#f4f4f5] active:scale-[0.98]'
          )}
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className={cn('size-4', !isSidebarOpen && 'text-[#171717] dark:text-[#f4f4f5]')} strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <DocMindLogo size={24} className="rounded-lg shadow-2xs" />
          <span className="text-sm font-semibold text-[#171717] dark:text-[#f4f4f5] tracking-tight font-sans">
            DocMind
          </span>
        </div>
      </div>

      {/* Center: segmented navigation (desktop only - mobile uses dedicated bottom nav) */}
      <nav className="hidden md:flex items-center">
        <div className="flex items-center gap-0.5 bg-[#f5f5f5] dark:bg-[#1c1c20] border border-[#e5e5e5]/80 dark:border-white/[0.06] rounded-lg p-0.5 shadow-2xs">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-white dark:bg-[#28282d] text-[#171717] dark:text-[#f4f4f5] shadow-2xs border border-black/[0.04] dark:border-white/[0.08]'
                    : 'text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
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
      <div className="flex items-center gap-1.5 sm:gap-2">
        {selectedDoc && (
          <div className="hidden lg:flex items-center gap-1.5 bg-[#f5f5f5] dark:bg-[#1c1c20] border border-[#e5e5e5] dark:border-white/[0.08] pl-2 pr-1.5 py-1 rounded-lg text-xs max-w-[180px]">
            <FileFormatIcon filename={selectedDoc.filename} contentType={selectedDoc.contentType} size="xs" />
            <span className="text-[#171717] dark:text-[#f4f4f5] truncate font-medium text-xs">{selectedDoc.filename}</span>
            <button
              onClick={() => setSelectedDocumentId(null)}
              className="p-0.5 text-[#a3a3a3] hover:text-[#171717] dark:text-[#737373] dark:hover:text-[#f4f4f5] rounded transition-colors cursor-pointer ml-0.5"
              title="Clear document filter"
              aria-label="Clear document filter"
            >
              <X className="size-3" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Upload Action */}
        <button
          onClick={onUploadClick}
          className={cn(
            'flex items-center justify-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-xs font-medium',
            'bg-[#151515] text-white hover:bg-black dark:bg-[#ffffff] dark:text-[#151515] dark:hover:bg-neutral-100 active:scale-[0.98] transition-all cursor-pointer',
            'shadow-2xs'
          )}
          title="Upload document"
          aria-label="Upload document"
        >
          <Upload className="size-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              'flex items-center gap-1.5 sm:gap-2 h-8 pl-1 pr-1.5 sm:pr-2 bg-[#f5f5f5] hover:bg-[#efefef] dark:bg-[#1c1c20] dark:hover:bg-white/[0.08]',
              'border border-[#e5e5e5] dark:border-white/[0.08] rounded-lg transition-colors cursor-pointer group'
            )}
            aria-label="User menu"
          >
            <div className="size-6 rounded-md bg-[#e5e5e5] dark:bg-white/[0.1] flex items-center justify-center text-[10px] font-semibold text-[#171717] dark:text-[#f4f4f5]">
              {getInitials(user?.username)}
            </div>
            <span className="text-xs text-[#171717] dark:text-[#f4f4f5] font-medium max-w-[80px] truncate hidden sm:block">
              {user?.username || 'User'}
            </span>
            <ChevronDown className={cn('size-3 text-[#737373] dark:text-[#a3a3a3] transition-transform duration-150', isMenuOpen && 'rotate-180')} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-54 max-w-[calc(100vw-24px)] bg-white dark:bg-[#18181b] border border-[#e5e5e5] dark:border-white/[0.1] rounded-xl shadow-xl py-1 z-50">
              <div className="px-3.5 py-2.5 border-b border-[#e5e5e5] dark:border-white/[0.06]">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-[#171717] dark:text-[#f4f4f5] truncate">{user?.username}</p>
                  {user?.role && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#f5f5f5] dark:bg-white/[0.06] text-[#737373] dark:text-[#a3a3a3] border border-[#e5e5e5] dark:border-white/[0.08] flex items-center gap-1 capitalize">
                      <Shield className="size-2.5" />
                      {user.role.toLowerCase()}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] truncate">{user?.email}</p>
              </div>

              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
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

import React from 'react';
import { useDocumentStore } from '../store/documentStore';
import { cn } from '../lib/utils';

interface MobileBottomNavProps {
  onDocsClick?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onDocsClick }) => {
  const { activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, documents } = useDocumentStore();

  const handleTabClick = (tabId: 'chat' | 'search' | 'chunks') => {
    setActiveTab(tabId);
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  const handleDocsToggle = () => {
    if (onDocsClick) {
      onDocsClick();
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const navItems = [
    {
      id: 'chat' as const,
      label: 'Chat',
      iconSrc: '/icons/chats.gif',
      isActive: activeTab === 'chat' && !isSidebarOpen,
      onClick: () => handleTabClick('chat'),
    },
    {
      id: 'search' as const,
      label: 'Search',
      iconSrc: '/icons/search.png',
      isActive: activeTab === 'search' && !isSidebarOpen,
      onClick: () => handleTabClick('search'),
    },
    {
      id: 'chunks' as const,
      label: 'Chunks',
      iconSrc: '/icons/chunks.png',
      isActive: activeTab === 'chunks' && !isSidebarOpen,
      onClick: () => handleTabClick('chunks'),
    },
    {
      id: 'docs' as const,
      label: 'Docs',
      iconSrc: '/icons/docs.png',
      badge: documents.length > 0 ? documents.length : undefined,
      isActive: isSidebarOpen,
      onClick: handleDocsToggle,
    },
  ];

  return (
    <nav
      className="md:hidden flex-shrink-0 z-30 select-none bg-white/95 dark:bg-[#121215]/95 backdrop-blur-xl border-t border-[#e5e5e5] dark:border-white/[0.08] transition-colors"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ id, label, iconSrc, badge, isActive, onClick }) => (
          <button
            key={id}
            onClick={onClick}
            className={cn(
              'flex flex-col items-center justify-center min-w-[64px] py-1 px-2.5 rounded-xl transition-all cursor-pointer relative active:scale-95',
              isActive
                ? 'text-[#151515] dark:text-white'
                : 'text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5]'
            )}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div
              className={cn(
                'relative flex items-center justify-center size-7 rounded-lg transition-all',
                isActive
                  ? 'bg-black/[0.05] dark:bg-white/[0.08] shadow-2xs'
                  : 'bg-transparent'
              )}
            >
              <img
                src={iconSrc}
                alt={label}
                className={cn(
                  'size-5 object-contain transition-transform duration-200',
                  isActive ? 'scale-110 drop-shadow-xs' : 'opacity-85'
                )}
              />
              {badge !== undefined && (
                <span
                  className={cn(
                    'absolute -top-1 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-sans font-medium flex items-center justify-center',
                    isActive
                      ? 'bg-[#151515] text-white dark:bg-white dark:text-[#151515]'
                      : 'bg-[#737373] text-white dark:bg-[#a3a3a3] dark:text-[#151515]'
                  )}
                >
                  {badge}
                </span>
              )}
            </div>
            <span
              className={cn(
                'text-[10px] tracking-tight mt-0.5 font-sans',
                isActive ? 'font-semibold text-[#151515] dark:text-white' : 'font-medium opacity-80'
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;


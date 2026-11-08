import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useDocumentStore } from './store/documentStore';
import { useConversationStore } from './store/conversationStore';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import SearchView from './components/SearchView';
import ChunksView from './components/ChunksView';
import UploadDialog from './components/UploadDialog';
import MobileBottomNav from './components/MobileBottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthModal } from './components/AuthModal';
import Login from './pages/Login';
import Register from './pages/Register';

const Dashboard: React.FC = () => {
  const { activeTab, fetchDocuments, setIsSidebarOpen } = useDocumentStore();
  const { loadChats } = useConversationStore();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isAuthModalOpen = useAuthStore((state) => state.isAuthModalOpen);
  const pendingPrompt = useAuthStore((state) => state.pendingPrompt);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const closeAuthModal = useAuthStore((state) => state.closeAuthModal);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleUploadClick = () => {
    if (!token || !user) {
      toast('Please sign in to upload documents', { icon: '🔒' });
      openAuthModal();
      return;
    }
    setIsUploadOpen(true);
  };

  // Responsive sidebar: open on desktop, strictly closed on mobile so homepage is shown first
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }

    let prevWidth = window.innerWidth;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      // If crossing into mobile, ensure drawer is closed so homepage is presented
      if (currentWidth < 768 && prevWidth >= 768) {
        setIsSidebarOpen(false);
      } else if (currentWidth >= 768 && prevWidth < 768) {
        setIsSidebarOpen(true);
      }
      prevWidth = currentWidth;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsSidebarOpen]);

  useEffect(() => {
    if (token && user) {
      fetchDocuments();
      loadChats();
    }
  }, [token, user, fetchDocuments, loadChats]);

  return (
    <div className="relative flex flex-col h-dvh overflow-hidden bg-[#fafafa] dark:bg-[#08080d] text-[#1c1c1c] dark:text-[#ededf2] selection:bg-violet-500/25 selection:text-current">
      {/* Ambient Atmospheric Lighting Orbs (Inspired by PersonalPortfolio Parallax architecture) */}
      <div className="hidden md:block pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-violet-500/7 to-indigo-500/7 dark:from-violet-500/10 dark:to-purple-500/10 blur-[130px] opacity-70" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-indigo-500/7 to-blue-500/7 dark:from-indigo-500/8 dark:to-cyan-500/8 blur-[130px] opacity-60" />
      </div>

      <Navbar onUploadClick={handleUploadClick} />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar onUploadClick={handleUploadClick} />

        {/* Main application workspace */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-white/40 dark:bg-[#08080d]/40 backdrop-blur-xs">
          {activeTab === 'chat' && <ChatView />}
          {activeTab === 'search' && <SearchView />}
          {activeTab === 'chunks' && <ChunksView />}
        </main>
      </div>

      {/* Dedicated native mobile bottom tab bar */}
      <MobileBottomNav />

      <UploadDialog isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        pendingPrompt={pendingPrompt}
      />
    </div>
  );
};

const App: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Main Application - Open to visitors, prompts authentication upon sending chat */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: isDark ? '#141416' : '#ffffff',
              color: isDark ? '#f4f4f5' : '#171717',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e5e5e5',
              borderRadius: '10px',
              fontSize: '13px',
              boxShadow: isDark
                ? '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
                : '0 8px 24px -4px rgba(0, 0, 0, 0.08)',
              padding: '9px 14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: isDark ? '#141416' : '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: isDark ? '#141416' : '#ffffff' },
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;

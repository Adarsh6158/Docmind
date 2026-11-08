import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';

const Dashboard: React.FC = () => {
  const { activeTab, fetchDocuments, setIsSidebarOpen } = useDocumentStore();
  const { loadChats } = useConversationStore();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

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
    <div className="flex flex-col h-dvh overflow-hidden bg-white dark:bg-[#0c0c0e] text-[#171717] dark:text-[#f4f4f5] selection:bg-neutral-200 dark:selection:bg-neutral-800">
      <Navbar onUploadClick={() => setIsUploadOpen(true)} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar onUploadClick={() => setIsUploadOpen(true)} />

        {/* Main application workspace */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-white dark:bg-[#0c0c0e]">
          {activeTab === 'chat' && <ChatView />}
          {activeTab === 'search' && <SearchView />}
          {activeTab === 'chunks' && <ChunksView />}
        </main>
      </div>

      {/* Dedicated native mobile bottom tab bar */}
      <MobileBottomNav />

      <UploadDialog isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
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

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/*" element={<Navigate to="/" replace />} />
          </Route>
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

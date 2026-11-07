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
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';

const Dashboard: React.FC = () => {
  const { activeTab, fetchDocuments } = useDocumentStore();
  const { loadChats } = useConversationStore();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    if (token && user) {
      fetchDocuments();
      loadChats();
    }
  }, [token, user, fetchDocuments, loadChats]);

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <Navbar onUploadClick={() => setIsUploadOpen(true)} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar onUploadClick={() => setIsUploadOpen(true)} />

        {/* Main application workspace */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-white dark:bg-[#09090b]">
          {activeTab === 'chat' && <ChatView />}
          {activeTab === 'search' && <SearchView />}
          {activeTab === 'chunks' && <ChunksView />}
        </main>
      </div>

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
              background: isDark ? '#121215' : '#ffffff',
              color: isDark ? '#f4f4f5' : '#09090b',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e4e4e7',
              borderRadius: '12px',
              fontSize: '13px',
              boxShadow: isDark
                ? '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
              padding: '10px 14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: isDark ? '#121215' : '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: isDark ? '#121215' : '#ffffff' },
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;

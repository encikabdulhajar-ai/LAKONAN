import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navigation, PageId } from './components/Navigation.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { LakonanAiChat } from './pages/LakonanAiChat.tsx';
import { History } from './pages/History.tsx';
import { Consultations } from './pages/Consultations.tsx';
import { ConsultantRequests } from './pages/ConsultantRequests.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { ServiceProgressDashboard } from './pages/ServiceProgressDashboard.tsx';
import { Profile } from './pages/Profile.tsx';
import { LoginView } from './components/LoginView.tsx';
import { RegistrationModal } from './components/RegistrationModal.tsx';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const { currentUser, userProfile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [selectedStageId, setSelectedStageId] = useState<string | undefined>(undefined);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);
  const [registrationModalDismissed, setRegistrationModalDismissed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs text-slate-400 tracking-wider font-medium uppercase">
          Memuat LAKONAN AI...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  // Mandatory registration profile completion check
  const needsRegistration =
    !registrationModalDismissed &&
    Boolean(
      currentUser &&
        (!userProfile?.isProfileComplete || !userProfile?.libraryCardNumber || !userProfile?.phone)
    );

  const handleNavigate = (page: PageId, extra?: { stageId?: string; sessionId?: string }) => {
    if (extra?.stageId) {
      setSelectedStageId(extra.stageId);
    }
    if (extra?.sessionId) {
      setActiveSessionId(extra.sessionId);
    } else if (page === 'lakonan-ai' && !extra?.sessionId) {
      setActiveSessionId(undefined);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueSession = (sessionId: string, stageId: string) => {
    setActiveSessionId(sessionId);
    setSelectedStageId(stageId);
    setCurrentPage('lakonan-ai');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-800">
      {/* Mandatory Registration Modal for New Users */}
      <RegistrationModal
        isOpen={needsRegistration}
        onComplete={() => setRegistrationModalDismissed(true)}
      />

      {/* Navigation Layout */}
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
        {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
        {currentPage === 'lakonan-ai' && (
          <LakonanAiChat
            initialStageId={selectedStageId}
            initialSessionId={activeSessionId}
          />
        )}
        {currentPage === 'riwayat' && (
          <History
            onContinueSession={handleContinueSession}
            onNavigateToNew={() => handleNavigate('lakonan-ai')}
          />
        )}
        {currentPage === 'konsultasi' && <Consultations />}
        {currentPage === 'profil' && <Profile />}
        {currentPage === 'permintaan-konsultasi' && <ConsultantRequests />}
        {currentPage === 'progress-layanan' && (
          <ServiceProgressDashboard onNavigate={handleNavigate} />
        )}
        {currentPage === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

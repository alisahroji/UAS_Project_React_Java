import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/providers/ToastProvider';
import { AuthProvider } from './components/providers/AuthProvider';
import { AppLayout } from './components/layout/AppLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthOnlyRoute } from './components/layout/AuthOnlyRoute';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { JobMarketplace } from './pages/jobs/JobMarketplace';
import { JobDetail } from './pages/jobs/JobDetail';
import { JobCreate } from './pages/jobs/JobCreate';
import { JobEdit } from './pages/jobs/JobEdit';
import { ProposalList } from './pages/proposals/ProposalList';
import { ProposalDetail } from './pages/proposals/ProposalDetail';
import { ProposalsReceivedPage } from './pages/proposals/ProposalsReceivedPage';
import { ProjectList } from './pages/projects/ProjectList';
import { ProjectDetail } from './pages/projects/ProjectDetail';
import { ChatPage } from './pages/chat/ChatPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { LandingPage } from './pages/landing/LandingPage';
import './index.css';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              
              {/* Auth Only Routes (Redirect if logged in) */}
              <Route element={<AuthOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>
            </Route>

            {/* Application Routes */}
            <Route element={<AppLayout />}>
              {/* Publicly readable App Routes */}
              <Route path="/jobs" element={<JobMarketplace />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/profile" element={<ProfilePage />} />

{/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/jobs/create" element={<JobCreate />} />
              <Route path="/jobs/:id/edit" element={<JobEdit />} />
              
              <Route path="/proposals" element={<ProposalList />} />
              <Route path="/proposals/received" element={<ProposalsReceivedPage />} />
              <Route path="/proposals/:id" element={<ProposalDetail />} />
              
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              
              <Route path="/chat/:proposalId" element={<ChatPage />} />
              
              <Route path="/messages" element={<MessagesPage />} />
            </Route>
              
              {/* Fallback */}
              <Route path="*" element={<PlaceholderPage title="404 Not Found" description="The page you are looking for doesn't exist." />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

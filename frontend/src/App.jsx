import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Sidebar from './components/layout/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MahasiswaListPage from './pages/MahasiswaListPage';
import MahasiswaDetailPage from './pages/MahasiswaDetailPage';
import MLTrainingPage from './pages/MLTrainingPage';
import MLEvaluationPage from './pages/MLEvaluationPage';
import ProfilePage from './pages/ProfilePage';

const ProtectedRoute = ({ roles }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute roles={['admin', 'dosen_pa']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/mahasiswa" element={<MahasiswaListPage />} />
            <Route path="/mahasiswa/:nim" element={<MahasiswaDetailPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/ml/training" element={<MLTrainingPage />} />
            <Route path="/ml/evaluation" element={<MLEvaluationPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'dosen_pa', 'mahasiswa']} />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

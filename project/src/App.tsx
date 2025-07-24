import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts
import PatientLayout from './Layouts/PatinetLayout';
import DoctorLayout from './Layouts/DoctorLayout';

// Shared Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Patient Pages
import ScanReportPage from './pages/ScanReportPage';
import ScanMedicinePage from './pages/ScanMedicinePage';
import DiagnosisPage from './pages/DiagnosisPage';
import VaultPage from './pages/VaultPage';

// Doctor Pages
import DoctorDashboard from './pages/Doctorpages/DoctorDashboard';
import DoctorReviewPage from './pages/Doctorpages/DoctorReviewPage';
import DoctorReviewRequestPage from './pages/Doctorpages/DoctorReviewRequestPage';

function AppRoutes() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  const Layout = isDoctor ? DoctorLayout : PatientLayout;

  return (
    <Layout>
      <Routes>
        {/* Shared routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Patient-only routes */}
        {!isDoctor && (
          <>
            <Route path="/scan-report" element={<ScanReportPage />} />
            <Route path="/scan-medicine" element={<ScanMedicinePage />} />
            <Route path="/diagnosis" element={<DiagnosisPage />} />
            <Route path="/vault" element={<VaultPage />} />
          </>
        )}

        {/* Doctor-only routes */}
        {isDoctor && (
          <>
            <Route path="/dashboard" element={<DoctorDashboard />} />
            <Route path="/review" element={<DoctorReviewPage />} />
            <Route path="/review-requests" element={<DoctorReviewRequestPage />} />
          </>
        )}
        
        {/* Optional: fallback route */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

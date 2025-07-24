// 📁 src/layouts/PatientLayout.tsx
import React from 'react';
import Navbar from '../components/Layout/Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

const PatientLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        {children}
      </main>
    </>
  );
};

export default PatientLayout;

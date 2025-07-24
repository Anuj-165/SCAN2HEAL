// 📁 src/layouts/DoctorLayout.tsx
import React from 'react';
import DoctorNavbar from '../components/Layout/DoctorNavbar';

interface LayoutProps {
  children: React.ReactNode;
}

const DoctorLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <DoctorNavbar />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        {children}
      </main>
    </>
  );
};

export default DoctorLayout;

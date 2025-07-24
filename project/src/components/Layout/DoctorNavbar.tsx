import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Stethoscope, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DoctorNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // ✅ Home is placed first
  const doctorNavLinks = [
    { to: '/', label: 'Home' },                              // ✅ Home
    { to: '/dashboard', label: 'Dashboard' },                // DoctorDashboard.tsx
    { to: '/review-requests', label: 'Review Requests' },    // DoctorReviewRequestPage.tsx
    { to: '/review', label: 'Reviewed Reports' },            // DoctorReviewPage.tsx
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Stethoscope className="h-8 w-8 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300" />
              <div className="absolute -inset-1 bg-blue-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 dark:from-blue-400 dark:to-teal-400 bg-clip-text text-transparent">
              Scan2Heal - Doctor
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {doctorNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive(link.to)
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600 dark:text-white" />
                <span className="text-sm text-gray-800 dark:text-white">{user.name}</span>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DoctorNavbar;

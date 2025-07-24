import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';




import React, { useEffect, useState } from 'react';
import {
  User,
  Star,
  Activity,
  ShieldCheck,
  BarChart3,
  Loader,
} from 'lucide-react';
import Card from '../../components/UI/Card';
import ApiService from '../../services/api'; // adjust path as needed

interface DoctorData {
  name: string;
  email: string;
  specialization: string;
  experience: string;
  rank: string;
  badges: string[];
  patientsHandled: number;
  feedbackCount: number;
  accuracyTrend?: number[]; // for future chart
}

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [doctorInfo, setDoctorInfo] = useState<DoctorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await ApiService.getDoctorDashboard();
        setDoctorInfo(data);
      } catch (error) {
        console.error('Failed to fetch doctor dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  if (user?.role !== 'doctor') {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader className="animate-spin text-blue-500 w-12 h-12" />
      </div>
    );
  }

  if (!doctorInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 dark:text-red-300">
        Failed to load dashboard data.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-blue-700 dark:text-blue-300 mb-10">
          Doctor Dashboard
        </h1>

        {/* Doctor Profile */}
        <Card className="p-6 mb-8">
          <div className="flex items-center space-x-6">
            <div className="bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold">
              {doctorInfo.name?.[0] || 'D'}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {doctorInfo.name || 'Doctor'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">{doctorInfo.email}</p>
              <p className="text-gray-600 dark:text-gray-300">
                {doctorInfo.specialization || 'Specialist'} • {doctorInfo.experience || 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 text-white">
          <Card className="p-5 text-center">
            <User className="mx-auto text-blue-500 mb-2" />
            <h3 className="text-lg font-medium">Patients Handled</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
              {doctorInfo.patientsHandled ?? 0}
            </p>
          </Card>

          <Card className="p-5 text-center">
            <Activity className="mx-auto text-green-500 mb-2" />
            <h3 className="text-lg font-medium">Reports Reviewed</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-300">
              {doctorInfo.feedbackCount ?? 0}
            </p>
          </Card>

          <Card className="p-5 text-center">
            <Star className="mx-auto text-yellow-500 mb-2" />
            <h3 className="text-lg font-medium">Rank</h3>
            <p className="text-2xl font-bold text-yellow-500">{doctorInfo.rank || 'Unranked'}</p>
          </Card>

          <Card className="p-5 text-center">
            <ShieldCheck className="mx-auto text-purple-500 mb-2" />
            <h3 className="text-lg font-medium">Badges</h3>
            {doctorInfo.badges?.length > 0 ? (
              <ul className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                {doctorInfo.badges.map((badge, index) => (
                  <li key={index}>• {badge}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No badges yet.</p>
            )}
          </Card>
        </div>

        {/* Chart Placeholder */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart3 className="mr-2 text-indigo-500" />
            AI Analysis Accuracy
          </h2>
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-300">
            {/* Replace below placeholder with Chart.js or Recharts graph */}
            [AI Accuracy Chart Placeholder]
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;

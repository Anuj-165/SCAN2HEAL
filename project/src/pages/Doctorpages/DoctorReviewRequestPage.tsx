import React, { useEffect, useState } from 'react';
import { Eye, Activity, FileText } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { Link, Navigate } from 'react-router-dom';
import ApiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

type ReportRequest = {
  id: number;
  patient_name: string;
  report_name?: string; // medical file name
  type: 'symptom-based' | 'medical-report'; // clarify type
  uploaded: string;
  symptoms?: string[]; // for symptom-based reports
  extracted_text?: string; // for medical reports
};

const DoctorReviewRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ReportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);

        // Fetch both types of reports simultaneously
        const [medicalReports, symptomReports] = await Promise.all([
          ApiService.getPendingReports(),
          ApiService.getPendingSymptomReports(),
        ]);

        // Normalize both arrays to match ReportRequest type
        const formattedMedical = medicalReports.map((r: any) => ({
          id: r.id,
          patient_name: r.patient_name,
          report_name: r.report_name,
          type: 'medical-report' as const,
          uploaded: r.uploaded,
          extracted_text: r.extracted_text,
        }));

        const formattedSymptom = symptomReports.map((r: any) => ({
          id: r.id,
          patient_name: r.patient_name,
          symptoms: r.symptoms,
          type: 'symptom-based' as const,
          uploaded: r.uploaded,
        }));

        // Combine into a single array
        setRequests([...formattedMedical, ...formattedSymptom]);
      } catch (err) {
        console.error(err);
        setError('Failed to load review requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (user?.role !== 'doctor') {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-6">
          Review Requests
        </h1>

        <Card className="overflow-x-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-300">
              Loading...
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : requests.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400">
              No pending reports
            </div>
          ) : (
            <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b dark:border-gray-700">
                    <td className="px-4 py-3 font-medium">{req.patient_name}</td>
                    <td className="px-4 py-3">
                      {req.type === 'symptom-based' ? (
                        <span>
                          {req.symptoms?.length || 0} reported symptoms
                        </span>
                      ) : (
                        req.report_name || 'Medical Report'
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize flex items-center gap-2">
                      {req.type === 'symptom-based' ? (
                        <>
                          <Activity className="w-4 h-4 text-blue-500" />
                          Symptom-based
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 text-purple-500" />
                          Medical Report
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(req.uploaded).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/review?id=${req.id}&type=${req.type}`}>
                        <Button size="sm" icon={Eye} variant="outline">
                          Review
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DoctorReviewRequestsPage;

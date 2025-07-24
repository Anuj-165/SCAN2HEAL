import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { CheckCircle, XCircle, Brain, FileText, Send, Download, Activity } from 'lucide-react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import ApiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const DoctorReviewPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('id');
  const type = queryParams.get('type'); // 'symptom' or 'medical'
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState<any>(null);
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (!id) return;
        console.log('Fetched ID:', id, 'Type:', type);
        

        let data;
        if (type === 'symptom-based') {
          data = await ApiService.getSymptomReportDetail(Number(id));
        } else {
          data = await ApiService.getDoctorReportDetail(Number(id));
        }

        setReport({
        ...data,
        type: type === 'symptom' ? 'symptom-based' : 'medical',
        symptoms: typeof data.symptoms === 'string' ? JSON.parse(data.symptoms) : data.symptoms,
      });
      } catch (err) {
        alert('Failed to load report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, type]);

 const handleSubmit = async () => {
  if (accepted === null || !id) {
    return alert('Please review the AI decision.');
  }

  setIsSubmitting(true);
  try {
    if (type === 'symptom-based') {
      await ApiService.reviewSymptomReport(Number(id), accepted, remarks);
    } else {
      await ApiService.submitDoctorReview(Number(id), accepted, remarks);
    }

    alert('Review submitted and stored in vault!');
    navigate('/doctor/review-requests');
  } catch (err) {
    alert('Failed to submit review.');
    console.error(err);
  } finally {
    setIsSubmitting(false);
  }
};


  if (user?.role !== 'doctor') {
    return <Navigate to="/" />;
  }

  if (loading) {
    return <p className="text-gray-700 dark:text-gray-300 px-4 pt-10">Loading report...</p>;
  }

  if (!report) {
    return <p className="text-red-500 px-4 pt-10">Report not found.</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          Doctor Review – #{report.id}
        </h1>

        {/* Patient Details */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-purple-600 dark:text-purple-300">
            <FileText className="mr-2" /> Patient Details
          </h2>
          <p className="text-gray-800 dark:text-gray-100 mb-1">
            <strong>Patient:</strong> {report.patient_name || 'Unknown'}
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-1">
            <strong>Age:</strong> {report.patient_age ?? 'N/A'}
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-1">
            <strong>Gender:</strong> {report.patient_gender ?? 'N/A'}
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            <strong>Uploaded:</strong>{' '}
            {report.uploaded ? new Date(report.uploaded).toLocaleString() : 'N/A'}
          </p>

          {/* Symptoms */}
          
          {Array.isArray(report.symptoms) && report.symptoms.length > 0 && (
            <div className="mt-4">
              <strong className="text-gray-700 dark:text-gray-300">Reported Symptoms:</strong>
              <ul className="list-disc list-inside text-gray-800 dark:text-gray-100 mt-2">
                {report.symptoms.map((sym: string, idx: number) => (
                  <li key={idx}>{sym}</li>
                ))}
              </ul>
            </div>
            
          )}

          {/* Report File */}
          {report.report_file_download_url && (
            <a
              href={report.report_file_download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition"
            >
              <Download className="w-5 h-5 mr-2" /> Download Report File
            </a>
          )}
        </Card>

        {/* AI Analysis */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-600 dark:text-blue-300">
            <Brain className="mr-2" /> AI's Analysis
          </h2>
          <p className="text-gray-800 dark:text-gray-100 mb-2">
            <strong>AI Summary:</strong> {report.analysis || 'No AI summary found.'}
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            <strong>AI Detailed Findings:</strong> {report.ai_analysis || 'N/A'}
          </p>

          {report.suggested_diseases && report.suggested_diseases.length > 0 && (
            <div className="mt-4">
              <strong className="text-gray-700 dark:text-gray-300">Suggested Conditions:</strong>
              <ul className="list-disc list-inside text-gray-800 dark:text-gray-100 mt-2">
                {report.suggested_diseases.map((disease: string, idx: number) => (
                  <li key={idx}>{disease}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Review */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-green-600 dark:text-green-300">
            <Activity className="mr-2" /> Doctor Review
          </h2>
          <div className="flex items-center space-x-6 mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="review"
                value="accept"
                checked={accepted === true}
                onChange={() => setAccepted(true)}
              />
              <span className="text-green-700 dark:text-green-300 flex items-center">
                <CheckCircle className="w-5 h-5 mr-1" /> Accept AI Diagnosis
              </span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="review"
                value="reject"
                checked={accepted === false}
                onChange={() => setAccepted(false)}
              />
              <span className="text-red-700 dark:text-red-300 flex items-center">
                <XCircle className="w-5 h-5 mr-1" /> Reject AI Diagnosis
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Remarks (optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-3 rounded-xl border bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              rows={4}
              placeholder="Provide additional comments or corrections if needed..."
            />
          </div>
        </Card>

        <Button
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={accepted === null}
          icon={Send}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
};

export default DoctorReviewPage;

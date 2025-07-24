import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FolderOpen, FileText, Eye, Download, Trash2, Upload,
  Calendar, Shield, Lock, Search, Filter, MoreVertical, LogOut, Star
} from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import { MedicalReport } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const VaultPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'vault' | 'profile'>('vault');
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vaultReviews, setVaultReviews] = useState<any[]>([]);
  const [selectedReviewType, setSelectedReviewType] = useState<'medical' | 'symptom'>('medical');
  const [ratings, setRatings] = useState<{ [reviewId: string]: number }>({});


  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newReport: MedicalReport = {
      id: Date.now().toString(),
      name: file.name,
      type: 'Lab Report',
      uploadDate: new Date().toISOString(),
      extractedText: 'Auto-extracted content will appear here...',
      analysis: 'AI-based report analysis pending...'
    };

    setReports(prev => [...prev, newReport]);
    e.target.value = '';
  };

  const reportTypes = ['all', 'Lab Report', 'Radiology', 'Prescription', 'Cardiac'];

  const filteredReports = reports.filter(report => {
    const matchesSearch =
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || report.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Lab Report': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Radiology': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Prescription': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Cardiac': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const handleDeleteReport = (id: string) => {
    setReports(prev => prev.filter(report => report.id !== id));
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No access token found');

      const response = await fetch('http://localhost:8000/api/reports/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch: ${response.status} ${text}`);
      }

      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchVaultReviews = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('http://localhost:8000/api/vault/reviews/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch vault reviews');
      const data = await res.json();
      const reviews = Array.isArray(data) ? data : data.results || [];
      setVaultReviews(reviews);
    } catch (err) {
      console.error("Error fetching vault reviews:", err);
    }
  };

  const submitDoctorRating = async (doctor_name: string, stars: number) => {
  try {
    setRatings(prev => ({ ...prev, [doctor_name]: stars })); // UI update

    const token = localStorage.getItem('authToken');
    if (!token) throw new Error("No auth token found");

    const res = await fetch('http://localhost:8000/api/doctor/rate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ doctor_name, stars })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to submit rating: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    console.log("Rating submitted successfully:", data);
  } catch (error) {
    console.error("Error submitting rating:", error);
  }
};


  useEffect(() => {
    fetchReports();
    fetchVaultReviews();
  }, []);

  const symptomReviews = useMemo(
    () => vaultReviews.filter(r => r.source?.toLowerCase().includes('symptom')),
    [vaultReviews]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 py-8">
      <input
        type="file"
        accept=".pdf,.jpg,.png,.jpeg"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Secure Health Vault
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Your personal medical records vault with military-grade encryption.
            Securely store, organize, and access all your health documents in one place.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2 rounded-xl font-medium ${activeTab === 'vault'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
              }`}
          >
            My Reports
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl font-medium ${activeTab === 'profile'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
              }`}
          >
            My Profile
          </button>
        </div>

        {/* Vault View */}
        {activeTab === 'vault' && (
          <>
            {/* Encryption Card */}
            <Card className="p-6 mb-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-8 w-8 text-green-600" />
                  <Lock className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-1">
                    Military-Grade Security Active
                  </h3>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Your medical records are protected with AES-256 encryption and blockchain-based security protocols.
                    Only you have access to your health data.
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-green-600 mb-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Secure</span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {reports.length} files encrypted
                  </p>
                </div>
              </div>
            </Card>

            {/* Search + Upload */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search medical reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {reportTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </option>
                  ))}
                </select>
              </div>
              <Button icon={Upload} variant="gradient" onClick={handleUploadClick}>
                Upload New Report
              </Button>
            </div>

            {/* Report Cards */}
            {filteredReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="p-6 hover group cursor-pointer" hover>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {report.name}
                    </h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                        {report.type}
                      </span>
                      <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(report.uploadDate)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {report.extractedText}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="View Report">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors" title="Download Report">
                          <Download className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteReport(report.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete Report">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600">
                        <Lock className="h-3 w-3" />
                        <span className="text-xs">Encrypted</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <FolderOpen className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Reports Found
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Start by uploading your first medical report to build your secure health vault.
                </p>
                <Button icon={Upload} variant="gradient" onClick={handleUploadClick}>
                  Upload Your First Report
                </Button>
              </Card>
            )}
          </>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card className="p-6 max-w-2xl mx-auto text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full text-white flex items-center justify-center text-3xl font-bold">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{user?.name}</h2>
                <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
                <p className="text-gray-600 dark:text-gray-300 mt-2"><strong>Age:</strong> {user?.age ?? 'N/A'}</p>
                <p className="text-gray-600 dark:text-gray-300"><strong>Gender:</strong> {user?.gender ?? 'N/A'}</p>
                <p className="text-gray-600 dark:text-gray-300"><strong>Phone:</strong> {user?.phone ?? 'N/A'}</p>
              </div>
              <div className="flex gap-4 mt-6">
                <Button variant="outline">Edit Profile</Button>
                <Button variant="secondary" onClick={handleLogout} icon={LogOut}>Logout</Button>
              </div>
            </div>

            {/* Reviews Toggle */}
            {(reports.length > 0 || symptomReviews.length > 0) && (
              <div className="mt-8">
                <div className="flex justify-center gap-4 mb-4">
                  <button
                    onClick={() => setSelectedReviewType('medical')}
                    className={`px-4 py-2 rounded-xl font-medium ${selectedReviewType === 'medical'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
                      }`}
                  >
                    Medical Reviews
                  </button>
                  <button
                    onClick={() => setSelectedReviewType('symptom')}
                    className={`px-4 py-2 rounded-xl font-medium ${selectedReviewType === 'symptom'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
                      }`}
                  >
                    Symptom-Based Reviews
                  </button>
                </div>

                {selectedReviewType === 'medical' ? (
                  reports.some(r => r.doctor_verdict || r.doctor_remarks) ? (
                    <div className="mt-8 w-full text-left">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                        Doctor Feedback on Your Reports
                      </h3>
                      {reports
                        .filter(r => r.doctor_verdict || r.doctor_remarks)
                        .map(r => (
                          <div
                            key={r.id}
                            className="mb-4 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transform hover:-translate-y-1 transition-all duration-200"
                          >
                            <p className="font-semibold text-gray-800 dark:text-white">{r.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              <strong>Status:</strong> {r.doctor_verdict ? 'Accepted' : 'Rejected'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Remarks:</strong> {r.doctor_remarks ?? 'No remarks provided'}
                            </p>
                            <div className="flex items-center mt-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-5 w-5 cursor-pointer transition-colors ${(ratings[r.id] ?? 0) >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                   onClick={() => {setRatings(prev => ({ ...prev, [r.id]: star }));submitDoctorRating(r.doctor_name ?? 'Unknown Doctor', star);}}

                                />
                              ))}
                              <span className="ml-2 text-sm text-gray-500">
                                Rate {r.doctor_name || 'Doctor'}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">No medical reviews available yet.</p>
                  )
                ) : (
                  symptomReviews.length > 0 ? (
                    <div className="mt-8 w-full text-left">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                        Symptom-Based Doctor Feedback
                      </h3>
                      {symptomReviews.map((review, idx) => (
                        <div
                          key={idx}
                          className="mb-4 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transform hover:-translate-y-1 transition-all duration-200"
                        >
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {review.disease || 'General Diagnosis'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <strong>Remarks:</strong> {review.remarks ?? 'No remarks provided'}
                          </p>
                          <div className="flex items-center mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-5 w-5 cursor-pointer transition-colors ${(ratings[review.id] ?? 0) >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                onClick={() => {setRatings(prev => ({ ...prev, [review.id]: star }));
                                submitDoctorRating(review.doctor_name ?? 'Unknown Doctor', star);}}
                              />
                            ))}
                            <span className="ml-2 text-sm text-gray-500">
                              Rate {review.doctor_name || 'Doctor'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">No symptom-based reviews yet.</p>
                  )
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default VaultPage;

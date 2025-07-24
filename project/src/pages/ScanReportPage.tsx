import React, { useState, useRef } from 'react';
import {
  Upload, FileText, Eye, Download, AlertCircle, CheckCircle, X, Brain, Activity, TrendingUp, Stethoscope
} from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ApiService, { OCRResult } from '../services/api';

const ScanReportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [processingDetails, setProcessingDetails] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [selectedDisease, setSelectedDisease] = useState<string>('');

  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('');
  const [suggestedDoctors, setSuggestedDoctors] = useState<any[]>([]);
  const [doctorError, setDoctorError] = useState('');

  /* NEW: doctor send state */
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/'))) {
      setFile(selectedFile);
      setExtractedText('');
      setAnalysis('');
      setError('');
      setConfidence(0);
      setProcessingDetails(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.type.startsWith('image/')) {
        setFile(droppedFile);
        setExtractedText('');
        setAnalysis('');
        setError('');
        setConfidence(0);
        setProcessingDetails(null);
      }
    }
  };

  const processOCR = async () => {
    if (!file || !selectedDisease) {
      setError('Please select a file and a disease type to scan.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuggestedDoctors([]);
    setSelectedDoctorId('');
    setSendError('');
    setSendSuccess('');

    try {
      const response: OCRResult = await ApiService.processOCR(file, selectedDisease);
      console.log('🧠 Full OCR Response:', response);

      if (response && response.final_decision && response.matched_parameters) {
        const matchedText = Object.entries(response.matched_parameters)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');

        // NOTE: response.medicines is typed as string[], but your earlier UI expected objects.
        // We'll handle both.
        const medicinesText = Array.isArray(response.medicines) && response.medicines.length
          ? response.medicines
              .map((m: any) =>
                typeof m === 'string'
                  ? `• ${m}`
                  : `• ${m.name} – ${m.link ?? ''}`
              )
              .join('\n')
          : 'None';

        const recommendationsText = response.recommendations.length
          ? response.recommendations.map((r) => `• ${r}`).join('\n')
          : 'None';

        const fullAnalysis = `
Prediction: ${response.final_decision}

Severity: ${response.severity}
Threshold Status: ${response.threshold_status}

Matched Parameters:
${matchedText}

🔹 Recommended Medicines:
${medicinesText}

📋 Recommendations:
${recommendationsText}
        `.trim();

        setExtractedText(response.ocr_text || '');
        setAnalysis(fullAnalysis);
        setConfidence(90); // If API returns real confidence, use it.
        setProcessingDetails({
          engines: 'OCR + ML',
          fileType: file.type,
          timestamp: new Date(),
        });

        // Suggest doctors
        try {
          const suggestionRes = await ApiService.suggestDoctors(selectedDisease);
          setSuggestedDoctors(suggestionRes.doctors);
          setDoctorError('');
        } catch (err) {
          console.error('Doctor Suggestion Error:', err);
          setDoctorError('Could not fetch doctor suggestions.');
        }
      } else {
        throw new Error('OCR failed or incomplete data returned.');
      }
    } catch (err: any) {
      console.error('OCR Error:', err);
      setError(err?.message || 'Failed to process report.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToVault = async () => {
    if (!extractedText || !file || !selectedDisease || !analysis || !patientName || !age || !gender) {
      setError('Please fill all patient details and analyze a report before saving.');
      return;
    }

    try {
      const res = await ApiService.addReport({
        name: patientName,
        age: Number(age),
        gender,
        reportContent: extractedText,
        prediction: selectedDisease,
      });
      alert(res.message);
    } catch (err) {
      alert('Error saving report. Try logging in or check server.');
    }
  };

  const downloadReport = () => {
    if (!analysis) return;
    const content = `
MEDICAL REPORT ANALYSIS
File: ${file?.name}
Confidence: ${confidence}%
Disease: ${selectedDisease.toUpperCase()}
Generated: ${new Date().toLocaleString()}

--- AI Analysis ---
${analysis}

--- Extracted Text ---
${extractedText}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* NEW: send report to doctor */
const handleSendToDoctor = async () => {
  if (!selectedDoctorId) {
    setSendError('Please select a doctor.');
    return;
  }

  if (!analysis && !extractedText) {
    setSendError('Nothing to send. Please analyze a report first.');
    return;
  }

  if (!patientName || !age || !gender) {
    setSendError('Please fill in all patient details before sending.');
    return;
  }

  if (!file) {
    setSendError('Please upload the medical report file before sending.');
    return;
  }

  setIsSending(true);
  setSendError('');
  setSendSuccess('');

  try {
    const res = await ApiService.sendToDoctor({
      doctor_id: Number(selectedDoctorId),
      report_file: file,
      ai_analysis: analysis,
      patient_name: patientName,
      patient_age: Number(age),
      patient_gender: gender, // Yeh line add karni hi padegi agar API expect kare
    });

    if (res?.success) {
      setSendSuccess(res.message || 'Report sent successfully!');
    } else {
      setSendError(res?.message || 'Failed to send report.');
    }
  } catch (err: any) {
    console.error('Send to Doctor Error:', err);
    setSendError(err?.message || 'Failed to send report.');
  } finally {
    setIsSending(false);
  }
};



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 py-8 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent mb-4">
            AI-Powered Medical Report Scanner
          </h1>
          <p className="text-xl text-white/80">
            Upload reports, select disease, and get AI-powered diagnosis & insights.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel */}
          <Card className="p-8 text-white">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Upload className="h-6 w-6 mr-2 text-blue-400" /> Upload Medical Report
            </h2>

            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <p className="text-lg font-medium">Drag and drop your file here</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  className="cursor-pointer px-4 py-2 border rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700"
                >
                  Browse Files
                </button>
                <p className="text-xs text-white/60">Max 50MB – PDF, JPG, PNG, TIFF</p>
              </div>
            </div>

            {file && (
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-blue-600" />
                    <div>
                      <p className="font-medium text-white">{file.name}</p>
                      <p className="text-sm text-white/60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                    <X />
                  </button>
                </div>
              </div>
            )}

            {/* Patient Details */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-white">Patient Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-white"
                  placeholder="Enter patient name"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-white">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-white"
                  placeholder="Enter age"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-white">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-white"
                >
                  <option value="">-- Select Gender --</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Disease Dropdown */}
            <div className="mt-6">
              <label className="block mb-1 text-sm font-medium text-white">Select Target Disease</label>
              <select
                value={selectedDisease}
                onChange={(e) => setSelectedDisease(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border bg-gray-800 text-white border-gray-600"
              >
                <option value="">-- Select Disease --</option>
                <option value="diabetes">Diabetes</option>
                <option value="heart">Heart</option>
                <option value="liver">Liver</option>
                <option value="kidney">Kidney</option>
                <option value="dengue">Dengue</option>
              </select>
            </div>

            {error && (
              <div className="mt-4 text-red-400 bg-red-100/20 p-3 rounded-md flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <Button
                onClick={processOCR}
                disabled={!file || isProcessing}
                loading={isProcessing}
                icon={Brain}
                className="w-full"
              >
                {isProcessing ? 'Analyzing...' : 'Analyze Report with AI'}
              </Button>

              {analysis && (
                <div className="flex gap-2">
                  <Button icon={Download} onClick={downloadReport} className="flex-1" variant="outline">
                    Download Report
                  </Button>
                  <Button onClick={saveToVault} className="flex-1" variant="secondary">
                    Save to Vault
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Right Panel */}
          <div className="space-y-6 text-white">
            {processingDetails && (
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-400" />
                  Processing Info
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><b>Confidence:</b> {confidence.toFixed(1)}%</p>
                  <p><b>Type:</b> {processingDetails.fileType}</p>
                  <p><b>Engine:</b> {processingDetails.engines}</p>
                  <p><b>Time:</b> {new Date(processingDetails.timestamp).toLocaleTimeString()}</p>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-400" /> AI Medical Analysis
              </h3>
              {isProcessing ? (
                <div className="py-12 text-center">
                  <LoadingSpinner text="Analyzing medical report..." />
                </div>
              ) : analysis ? (
                <pre className="bg-purple-900/20 p-4 rounded-xl whitespace-pre-wrap text-sm">{analysis}</pre>
              ) : (
                <p className="text-white/70">No analysis yet. Upload and scan a report.</p>
              )}
            </Card>

            {/* Doctor Suggestion Card */}
            {suggestedDoctors.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-teal-400" />
                  Suggested Doctors
                </h3>
                <ul className="space-y-3 mb-4">
                  {suggestedDoctors.map((doc) => (
                    <li key={doc.id} className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                      <p className="font-semibold text-white">{doc.username}</p>
                      <p className="text-sm text-white/70">{doc.speciality}</p>
                      <p className="text-sm text-white/50">{doc.email}</p>
                    </li>
                  ))}
                </ul>

                {/* NEW: Send to doctor UI */}
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-medium text-white">
                    Select Doctor to Send Report
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-600 text-white"
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                  >
                    <option value="">-- Choose a Doctor --</option>
                    {suggestedDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.username} ({doc.speciality})
                      </option>
                    ))}
                  </select>

                  <Button
                    onClick={handleSendToDoctor}
                    disabled={!selectedDoctorId || isSending}
                    className="w-full mt-2"
                  >
                    {isSending ? 'Sending...' : 'Send Report to Doctor'}
                  </Button>

                  {sendSuccess && (
                    <p className="text-sm text-green-400 mt-2">{sendSuccess}</p>
                  )}
                  {sendError && (
                    <p className="text-sm text-red-400 mt-2">{sendError}</p>
                  )}
                </div>
              </Card>
            )}

            {doctorError && (
              <Card className="p-4 bg-red-100/10 border border-red-400">
                <p className="text-red-400">{doctorError}</p>
              </Card>
            )}

            {extractedText && (
              <Card className="p-6">
                <details className="group">
                  <summary className="font-bold cursor-pointer flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-blue-400" />
                    Extracted Text
                  </summary>
                  <pre className="bg-gray-900 mt-4 p-4 rounded-xl max-h-96 overflow-y-auto text-sm whitespace-pre-wrap">
                    {extractedText}
                  </pre>
                </details>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanReportPage;

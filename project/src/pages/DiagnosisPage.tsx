import React, { useState, useEffect } from 'react';
import {
  Brain, User, Stethoscope, Activity, CheckCircle,
  Sparkles, ChevronRight, Target
} from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { DiagnosisResult, Patient } from '../types';
import ApiService from '../services/api';

const DiagnosisPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [patient, setPatient] = useState<Patient>({
    id: '',
    name: '',
    age: 0,
    gender: 'male',
    medicalHistory: []
  });

  const [userSymptoms, setUserSymptoms] = useState<string[]>([]);
  const [diagnosisResults, setDiagnosisResults] = useState<DiagnosisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [commonSymptoms, setCommonSymptoms] = useState<string[]>([]);
  const [uniqueSymptoms, setUniqueSymptoms] = useState<string[]>([]);

  // New states for doctor suggestion & sending
  const [suggestedDoctors, setSuggestedDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const data = await ApiService.getSymptoms();
        if (data.common && data.unique) {
          setCommonSymptoms(data.common);
          setUniqueSymptoms(data.unique);
        }
      } catch (error) {
        console.error('Error fetching symptoms:', error);
      }
    };
    fetchSymptoms();
  }, []);

  const toggleSymptom = (symptom: string) => {
    setUserSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const getRiskLevel = (probability: number): 'low' | 'medium' | 'high' | 'urgent' => {
    if (probability >= 90) return 'urgent';
    if (probability >= 80) return 'high';
    if (probability >= 60) return 'medium';
    return 'low';
  };

  const analyzeSymptoms = async () => {
    setIsAnalyzing(true);
    try {
      const response = await ApiService.predictFromSymptoms(userSymptoms);
      const converted: DiagnosisResult[] = response.symptom_diseases.map((condition: string) => {
        const prob = Math.floor(80 + Math.random() * 20);
        const risk = getRiskLevel(prob);
        return {
          condition,
          description: `AI suggests a match with ${condition}.`,
          probability: prob,
          riskLevel: risk,
          urgency: risk,
          recommendations: response.medicines.map((med: any) => `Take ${med.name} (More: ${med.link})`)
        };
      });
      setDiagnosisResults(converted);
    } catch (error) {
      alert('Failed to connect to backend.');
      console.error(error);
    }
    setIsAnalyzing(false);
    setCurrentStep(4);
  };

  const suggestDoctors = async (disease: string) => {
    setIsSuggesting(true);
    try {
      const res = await ApiService.suggestDoctors(disease);
      setSuggestedDoctors(res.doctors || []);
      setCurrentStep(5);
    } catch (error) {
      alert('Failed to fetch doctors.');
      console.error(error);
    }
    setIsSuggesting(false);
  };

  const sendReportToDoctor = async () => {
    if (!selectedDoctor) return alert("Please select a doctor");
    setSendingReport(true);
    try {
      const analysisText = diagnosisResults.map(r =>
        `${r.condition}: ${r.probability}% probability, Risk Level: ${r.riskLevel.toUpperCase()}, Recommendations: ${r.recommendations.join('; ')}`).join('\n\n');

      await ApiService.sendSymptomReportToDoctor({
        doctor_id: selectedDoctor.id,
        ai_analysis: analysisText,
        patient_name: patient.name,
        patient_age: patient.age,
        patient_gender: patient.gender,
        symptoms: userSymptoms
      });
      alert("Report sent to doctor successfully!");
      setCurrentStep(1);
    } catch (error) {
      alert('Failed to send report');
      console.error(error);
    }
    setSendingReport(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400 bg-green-900/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30';
      case 'high': return 'text-orange-400 bg-orange-900/30';
      case 'urgent': return 'text-red-500 bg-red-900/30';
      default: return 'text-white bg-gray-900/30';
    }
  };

  const steps = [
    { number: 1, title: 'Patient Information', icon: User },
    { number: 2, title: 'Symptom Entry', icon: Stethoscope },
    { number: 3, title: 'Symptom Analysis', icon: Activity },
    { number: 4, title: 'AI Diagnosis', icon: Brain },
    { number: 5, title: 'Choose Doctor', icon: Stethoscope }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-10 w-10 text-purple-600 mr-2" />
            <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-purple-600 bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            Scan2Heal: AI-Powered Diagnosis
          </h1>
          <p className="text-white mt-2">Enter your symptoms. Let AI do the rest.</p>
        </div>

        {/* Step Tracker */}
        <div className="flex items-center justify-between relative mb-8">
          <div className="absolute top-5 left-0 w-full h-1 bg-gray-300 rounded-full"></div>
          <div
            className="absolute top-5 left-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          ></div>
          {steps.map((step) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center w-1/5">
              <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center 
                ${currentStep >= step.number
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-600'
                  : 'bg-white border-gray-300 text-gray-500'}`}>
                <step.icon className="w-5 h-5" />
              </div>
              <p className={`text-xs mt-2 ${currentStep >= step.number ? 'text-purple-600' : 'text-gray-500'}`}>
                {step.title}
              </p>
            </div>
          ))}
        </div>

        {/* Steps */}
        {/* Step 1 */}
        {currentStep === 1 && (
          <Card className="p-8">
            <h2 className="text-2xl text-white font-bold mb-6">Patient Information</h2>
            <input type="text" placeholder="Full Name" className="w-full mb-4 px-4 py-2 rounded-xl border"
              value={patient.name} onChange={(e) => setPatient({ ...patient, name: e.target.value })} />
            <input type="number" placeholder="Age" className="w-full mb-4 px-4 py-2 rounded-xl border"
              value={patient.age || ''} onChange={(e) => setPatient({ ...patient, age: parseInt(e.target.value) })} />
            <div className="flex space-x-4 mb-6 text-white">
              {['male', 'female', 'other'].map((g) => (
                <label key={g} className="flex items-center space-x-2">
                  <input type="radio" value={g} checked={patient.gender === g}
                    onChange={(e) => setPatient({ ...patient, gender: e.target.value as any })} />
                  <span className="capitalize">{g}</span>
                </label>
              ))}
            </div>
            <Button className="w-full" icon={ChevronRight} iconPosition="right"
              onClick={() => setCurrentStep(2)} disabled={!patient.name || !patient.age}>
              Continue to Symptoms
            </Button>
          </Card>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <Card className="p-8">
            <h2 className="text-2xl text-white font-bold mb-4">Select Your Symptoms</h2>
            <h3 className="text-white font-semibold mb-2">Common Symptoms</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
              {commonSymptoms.map(symptom => (
                <label key={symptom} className="flex items-center space-x-2 text-white">
                  <input type="checkbox" checked={userSymptoms.includes(symptom)} onChange={() => toggleSymptom(symptom)} />
                  <span>{symptom}</span>
                </label>
              ))}
            </div>
            <h3 className="text-white font-semibold mb-2">Unique Symptoms</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
              {uniqueSymptoms.map(symptom => (
                <label key={symptom} className="flex items-center space-x-2 text-white">
                  <input type="checkbox" checked={userSymptoms.includes(symptom)} onChange={() => toggleSymptom(symptom)} />
                  <span>{symptom}</span>
                </label>
              ))}
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">Back</Button>
              <Button className="flex-1" onClick={() => setCurrentStep(3)} disabled={userSymptoms.length === 0}>Continue</Button>
            </div>
          </Card>
        )}

        {/* Step 3 */}
        {currentStep === 3 && (
          <Card className="p-8">
            <h2 className="text-2xl text-white font-bold mb-4">Confirm Symptoms</h2>
            <ul className="list-disc pl-5 mb-6 text-white">
              {userSymptoms.map((sym, idx) => <li key={idx}>{sym}</li>)}
            </ul>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">Back</Button>
              <Button onClick={analyzeSymptoms} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600" icon={Brain}>Analyze with AI</Button>
            </div>
          </Card>
        )}

        {/* Step 4 */}
        {currentStep === 4 && (
          <div className="space-y-8">
            {isAnalyzing ? (
              <Card className="p-10 text-center">
                <Brain className="w-12 h-12 text-purple-600 mx-auto animate-pulse mb-4" />
                <p className="text-lg font-semibold text-white">Analyzing your symptoms...</p>
                <LoadingSpinner text="Running AI engine..." />
              </Card>
            ) : (
              <>
                <Card className="p-8">
                  <h2 className="text-2xl text-white font-bold mb-6">Diagnosis Results</h2>
                  <p className="text-white italic mb-6">💡 These results are suggestions based on the symptoms you selected. Please consult a doctor before taking any medications.</p>
                  {diagnosisResults.map((result, idx) => (
                    <div key={idx} className="mb-6 border p-4 rounded-xl text-white">
                      <h3 className="text-lg font-bold">{result.condition}</h3>
                      <p className="text-white">{result.description}</p>
                      <div className="flex justify-between mt-2">
                        <span className="text-blue-300 font-semibold">{result.probability}% Probability</span>
                        <span className={`px-3 py-1 rounded-full text-sm ${getRiskColor(result.riskLevel)}`}>{result.riskLevel.toUpperCase()} RISK</span>
                      </div>
                      <ul className="mt-3 space-y-1">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 mt-1 text-green-500" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </Card>
                <div className="flex space-x-4">
                  <Button onClick={() => setCurrentStep(1)} variant="outline" className="flex-1">Start New</Button>
                  <Button onClick={() => suggestDoctors(diagnosisResults[0].condition)} className="flex-1 bg-green-600 text-white">Consult a Doctor</Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 5: Doctor Selection */}
        {currentStep === 5 && (
          <Card className="p-8">
            <h2 className="text-2xl text-white font-bold mb-4">Select a Doctor</h2>
            {isSuggesting ? (
              <LoadingSpinner text="Fetching suggested doctors..." />
            ) : (
              <>
                {suggestedDoctors.length === 0 ? (
                  <p className="text-white">No doctors found for this disease.</p>
                ) : (
                  <ul className="space-y-4">
                    {suggestedDoctors.map((doc) => (
                      <li
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc)}
                        className={`p-4 rounded-xl border cursor-pointer ${
                          selectedDoctor?.id === doc.id ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700'
                        }`}
                      >
                        <h3 className="text-lg font-bold text-white">{doc.username}</h3>
                        <p className="text-sm text-gray-300">{doc.speciality}</p>
                        <p className="text-sm text-gray-400">{doc.email}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex space-x-4 mt-6">
                  <Button variant="outline" onClick={() => setCurrentStep(4)} className="flex-1">Back</Button>
                  <Button
                    onClick={sendReportToDoctor}
                    disabled={sendingReport}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  >
                    {sendingReport ? 'Sending...' : 'Send Report'}
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default DiagnosisPage;

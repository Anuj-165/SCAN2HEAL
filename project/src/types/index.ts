export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  medicalHistory: string[];
}

export interface DiagnosisResult {
  condition: string;
  description: string;
  probability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'urgent';
  urgency: 'low' | 'medium' | 'high' | 'urgent'; // ✅ change from number to string
  recommendations: string[];
}



export interface MedicalReport {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  extractedText: string;
  analysis: string;

  doctor_name?: string;
  patient_name?: string;
  doctor_verdict?: boolean;
  doctor_remarks?: string;

  // Add these two optional fields
  accepted?: boolean;
  verdict?: boolean;

  source?: 'medical-report' | 'symptom-based' | string;
  timestamp?: string;
}



export interface Medicine {
  id: string;
  name: string;
  composition: string;
  sideEffects: string[];
  dosage: string;
  manufacturer: string;
  interactions: string[];
  warnings: string[];
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}
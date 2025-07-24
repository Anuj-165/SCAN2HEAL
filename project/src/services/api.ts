const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface SaveReportInput {
  ocr_text: string;
  disease: string;
}

export interface ReportSaveData {
  name: string;
  age: number;
  gender: string;
  reportContent: string;
  prediction: string;
}

export type OCRResult = {
  final_decision: string;
  severity: string;
  threshold_status: string;
  matched_parameters: { [key: string]: number | string };
  medicines: string[];
  recommendations: string[];
  ocr_text: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  phone?: string;
  role?: string;
  speciality?: string | null;
};

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  age: number;
  gender: string;
  phone: string;
  role: 'doctor' | 'patient';
  speciality?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // ---- Token Management ----
  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }
  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
  private setToken(access: string, refresh: string) {
    localStorage.setItem('authToken', access);
    localStorage.setItem('refreshToken', refresh);
  }
  private clearToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
  }
  private getAuthHeaders(isJson = true): { [key: string]: string } {
  const token = this.getToken();
  return {
    ...(isJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}


  private async refreshAccessToken(): Promise<boolean> {
    const refresh = this.getRefreshToken();
    if (!refresh) return false;
    const res = await fetch(`${this.baseURL}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.access) {
      this.setToken(data.access, refresh);
      return true;
    }
    return false;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}, retry = true): Promise<Response> {
  const isJson = !(options.body instanceof FormData);
  const headers = { ...options.headers, ...this.getAuthHeaders(isJson) };

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && retry) {
    const refreshed = await this.refreshAccessToken();
    if (refreshed) {
      const headersRetry = { ...options.headers, ...this.getAuthHeaders(isJson) };
      return fetch(url, { ...options, headers: headersRetry });
    } else {
      this.clearToken();
    }
  }
  return res;
}


  // ---- OCR APIs ----
  async processOCR(file: File, disease: string): Promise<OCRResult> {
    const formData = new FormData();
    formData.append('health_file', file);
    formData.append('target_disease', disease);
    const res = await fetch(`${this.baseURL}/api/report/ocr/`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('OCR request failed');
    return await res.json();
  }

  async downloadReport(data: SaveReportInput): Promise<Blob> {
    const formData = new FormData();
    formData.append('ocr_text', data.ocr_text);
    formData.append('disease', data.disease);
    const res = await fetch(`${this.baseURL}/api/report/pdf/`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Failed to download PDF');
    return await res.blob();
  }

  async downloadDeepAnalysisReport(data: SaveReportInput): Promise<Blob> {
    const formData = new FormData();
    formData.append('ocr_text', data.ocr_text);
    formData.append('disease', data.disease);
    const res = await fetch(`${this.baseURL}/api/report/ddreport/`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Failed to download deep analysis PDF');
    return await res.blob();
  }

  // ---- Reports ----
  async saveReport(reportData: ReportSaveData) {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/report/save/`, {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
    if (!res.ok) throw new Error('Failed to save report');
    return await res.json();
  }

  async getDoctorDashboard() {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/doctor/dashboard/`);
    if (!res.ok) throw new Error('Failed to fetch dashboard');
    return await res.json();
  }

  async getPendingReports() {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/doctor/pending-reports/`);
    if (!res.ok) throw new Error('Failed to fetch pending reports');
    return await res.json();
  }

  async getReportById(reportId: number) {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/reports/${reportId}/`);
    if (!res.ok) throw new Error('Failed to fetch report');
    return await res.json();
  }

  async submitDoctorReview(reportId: number, verdict: boolean, remarks: string) {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/doctor/review-report/${reportId}/`, {
      method: 'POST',
      body: JSON.stringify({ verdict, remarks }),
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return await res.json();
  }

  // ---- Doctor suggestions ----
  async suggestDoctors(disease: string) {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/patient/suggest-doctors-by-disease/`, {
      method: 'POST',
      body: JSON.stringify({ disease }),
    });
    if (!res.ok) throw new Error('Failed to fetch suggested doctors');
    return await res.json();
  }

  async sendToDoctor(data: {
    doctor_id: number;
    report_file: File;
    ai_analysis: string;
    patient_name: string;
    patient_age: number;
    patient_gender: string;
  }) {
    const formData = new FormData();
    formData.append('doctor_id', data.doctor_id.toString());
    formData.append('report_file', data.report_file);
    formData.append('ai_analysis', data.ai_analysis);
    formData.append('patient_name', data.patient_name);
    formData.append('patient_age', data.patient_age.toString());
    formData.append('patient_gender', data.patient_gender);
    const res = await this.fetchWithAuth(`${this.baseURL}/api/send-report/`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Failed to send report to doctor');
    return await res.json();
  }

  // ---- Symptom Reports ----
  async getSymptoms() {
    const res = await fetch(`${this.baseURL}/api/symptoms/list/`);
    if (!res.ok) throw new Error('Failed to fetch symptoms');
    return await res.json();
  }

  async predictFromSymptoms(symptoms: string[]) {
    const formData = new FormData();
    formData.append('symptoms', symptoms.join(','));
    const res = await fetch(`${this.baseURL}/api/report/symptoms/`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Symptom prediction failed');
    return await res.json();
  }

  async clarifySymptoms(baseSymptoms: string[], clarification: string) {
    const formData = new FormData();
    formData.append('symptom_base', baseSymptoms.join(','));
    formData.append('clarification', clarification);
    const res = await fetch(`${this.baseURL}/api/report/clarify/`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Clarification failed');
    return await res.json();
  }

  async sendSymptomReportToDoctor(data: {
    doctor_id: number;
    ai_analysis: string;
    patient_name: string;
    patient_age: number;
    patient_gender: string;
    symptoms: string[];
  }) {
    const formData = new FormData();
    formData.append('doctor_id', data.doctor_id.toString());
    formData.append('ai_analysis', data.ai_analysis);
    formData.append('patient_name', data.patient_name);
    formData.append('patient_age', data.patient_age.toString());
    formData.append('patient_gender', data.patient_gender);
    formData.append('symptoms', JSON.stringify(data.symptoms));
    const res = await this.fetchWithAuth(`${this.baseURL}/api/send-symptom-report/`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Failed to send symptom-based report');
    return await res.json();
  }

  async getPendingSymptomReports() {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/doctor/pending-symptom-reports/`);
    if (!res.ok) throw new Error('Failed to fetch pending symptom reports');
    return await res.json();
  }

  async reviewSymptomReport(reportId: number, verdict: boolean, remarks: string) {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/doctor/review-symptom-report/${reportId}/`, {
      method: 'POST',
      body: JSON.stringify({ verdict, remarks }),
    });
    if (!res.ok) throw new Error('Failed to review symptom report');
    return await res.json();
  }

  async getSymptomReportDetail(reportId: number) {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/doctor/symptom-report-detail/${reportId}/`);
    if (!res.ok) throw new Error('Failed to fetch symptom report detail');
    return await res.json();
  }

  // ---- Vault ----
  async getVaultReviews() {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/vault/reviews/`);
    if (!res.ok) throw new Error('Failed to fetch vault reviews');
    return await res.json();
  }

  // ---- Medicine Side-Effects ----
  async fetchSideEffects(medicineName: string): Promise<string[]> {
    const formData = new FormData();
    formData.append('medicine_name', medicineName);
    const res = await fetch(`${this.baseURL}/api/medicine/side-effects/`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Failed to fetch side effects');
    const data = await res.json();
    return data.side_effects;
  }

  // ---- Profile & Auth ----
  async register(userData: RegisterInput) {
    const res = await fetch(`${this.baseURL}/api/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userData.name,
        email: userData.email,
        password: userData.password,
        age: userData.age,
        gender: userData.gender,
        phone: userData.phone,
        role: userData.role,
        speciality: userData.role === 'doctor' ? userData.speciality : undefined,
      }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      this.setToken(data.token.access, data.token.refresh);
      localStorage.setItem('userRole', userData.role);
      return { success: true, data };
    }
    return { success: false, data };
  }

  async login(credentials: { email: string; password: string }) {
    const res = await fetch(`${this.baseURL}/api/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      this.setToken(data.token.access, data.token.refresh);
      localStorage.setItem('userRole', data.user?.role || 'patient');
      return { success: true, data };
    }
    return { success: false, data };
  }

  async getCurrentUser() {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/user/`);
    const data = await res.json();
    return { success: res.ok, data };
  }

  async getProfile(): Promise<User> {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/profile/`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return await res.json();
  }

  async updateProfile(profileData: { name?: string; age?: number; gender?: string; phone?: string; }) {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/profile/`, {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return await res.json();
  }

  async logout() {
    const refresh = this.getRefreshToken();
    await this.fetchWithAuth(`${this.baseURL}/api/logout/`, {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    });
    this.clearToken();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async getDoctorReportDetail(reportId: number) {
  const res = await this.fetchWithAuth(`${this.baseURL}/api/doctor/report-detail/${reportId}/`);
  if (!res.ok) throw new Error('Failed to fetch doctor report detail');
  return await res.json();
}

  async submitDoctorRating(doctorId: number, stars: number) {
    const res = await this.fetchWithAuth(`${this.baseURL}/api/doctor/rate/`, {
      method: 'POST',
      body: JSON.stringify({ doctor_id: doctorId, stars }),
    });
    if (!res.ok) throw new Error('Failed to submit doctor rating');
    return await res.json();
  }


}

export default new ApiService();

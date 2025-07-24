// ✅ src/types/User.ts

export interface User {
  id?: string; // ← if backend includes ID
  name: string;
  email: string;
  password?: string; // optional for security
  phone: string;
  age: number;
  gender: string;
  role: 'doctor' | 'patient';
  speciality?: string | null;
}

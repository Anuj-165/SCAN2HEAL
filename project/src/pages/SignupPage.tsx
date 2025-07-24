import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Lock, User, Eye, EyeOff, Stethoscope, Phone, Calendar, UserRound, Heart
} from 'lucide-react';

import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import { useAuth } from '../contexts/AuthContext'; // ✅ Custom auth hook

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'doctor' | 'patient'>('patient');
  const [speciality, setSpeciality] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const success = await register({
        name,
        email,
        password,
        phone,
        age: Number(age),
        gender,
        role,
        speciality: role === 'doctor' ? speciality : undefined,
      });

      if (success) {
        localStorage.setItem('userRole', role); // ✅ Store role
        if (role === 'doctor') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl flex items-center justify-center">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Join Scan2Heal to secure your health data
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-4">
                <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            <InputField icon={<User className="h-5 w-5 text-gray-400" />} label="Full Name" type="text" value={name} onChange={setName} placeholder="Enter your full name" />

            <InputField icon={<Mail className="h-5 w-5 text-gray-400" />} label="Email Address" type="email" value={email} onChange={setEmail} placeholder="Enter your email" />

            <InputField icon={<Calendar className="h-5 w-5 text-gray-400" />} label="Age" type="number" value={age} onChange={setAge} placeholder="Enter your age" />

            <DropdownField
              label="Gender"
              icon={gender === 'female' ? <UserRound className="h-5 w-5 text-gray-400" /> : <User className="h-5 w-5 text-gray-400" />}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              options={[
                { value: '', label: 'Select gender' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />

            <InputField icon={<Phone className="h-5 w-5 text-gray-400" />} label="Phone" type="tel" value={phone} onChange={setPhone} placeholder="Enter your phone number" pattern="[0-9]{10}" />

            <DropdownField
              label="Role"
              icon={<Heart className="h-5 w-5 text-gray-400" />}
              value={role}
              onChange={(e) => setRole(e.target.value as 'doctor' | 'patient')}
              options={[
                { value: 'patient', label: 'Patient' },
                { value: 'doctor', label: 'Doctor' },
              ]}
            />

            {role === 'doctor' && (
              <DropdownField
                label="Speciality"
                icon={<Stethoscope className="h-5 w-5 text-gray-400" />}
                value={speciality}
                onChange={(e) => setSpeciality(e.target.value)}
                options={[
                  { value: '', label: 'Select Speciality' },
                  { value: 'Cardiologist', label: 'Cardiologist' },
                  { value: 'Neurologist', label: 'Neurologist' },
                  { value: 'Dermatologist', label: 'Dermatologist' },
                  { value: 'Gastroenterologist', label: 'Gastroenterologist' },
                  { value: 'Psychiatrist', label: 'Psychiatrist' },
                  { value: 'Endocrinologist', label: 'Endocrinologist' },
                  { value: 'Infectious Disease Specialist', label: 'Infectious Disease Specialist' },
                  { value: 'Pulmonologist', label: 'Pulmonologist' },
                  { value: 'Nephrologist', label: 'Nephrologist' },
                  { value: 'Hepatologist', label: 'Hepatologist' },
                  { value: 'Oncologist', label: 'Oncologist' },
                  { value: 'Orthopedic', label: 'Orthopedic' },
                  { value: 'General Physician', label: 'General Physician' },
                ]}
              />
            )}

            <PasswordField label="Password" value={password} setValue={setPassword} show={showPassword} toggleShow={() => setShowPassword(!showPassword)} />
            <PasswordField label="Confirm Password" value={confirmPassword} setValue={setConfirmPassword} show={showConfirmPassword} toggleShow={() => setShowConfirmPassword(!showConfirmPassword)} />

            <Button type="submit" disabled={isLoading} loading={isLoading} className="w-full" size="lg">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;

// === Reusable Components ===
interface InputProps {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  pattern?: string;
}

const InputField: React.FC<InputProps> = ({ icon, label, type, value, onChange, placeholder, pattern }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        pattern={pattern}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder={placeholder}
      />
    </div>
  </div>
);

interface DropdownFieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}

const DropdownField: React.FC<DropdownFieldProps> = ({ label, icon, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        required
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
        {icon}
      </div>
    </div>
  </div>
);

interface PasswordFieldProps {
  label: string;
  value: string;
  setValue: (val: string) => void;
  show: boolean;
  toggleShow: () => void;
}

const PasswordField: React.FC<PasswordFieldProps> = ({ label, value, setValue, show, toggleShow }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder={`Enter ${label.toLowerCase()}`}
      />
      <button
        type="button"
        onClick={toggleShow}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  </div>
);

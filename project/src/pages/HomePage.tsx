import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Scan, 
  Pill, 
  Brain, 
  Shield, 
  Clock, 
  Award,
  ChevronRight,
  Sparkles,
  Stethoscope,
  FileText,
  Activity
} from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: Scan,
      title: 'OCR Medical Report Scanner',
      description: 'Advanced optical character recognition to extract and analyze medical reports with 99.9% accuracy',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Pill,
      title: 'Medicine Information Scanner',
      description: 'Comprehensive medicine database with drug interactions, side effects, and dosage information',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Brain,
      title: 'AI-Powered Medical Diagnosis',
      description: 'Revolutionary 4-step intelligent diagnosis process with probability scoring and risk assessment',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: Shield,
      title: 'Secure Health Vault',
      description: 'Military-grade encryption for your medical records with blockchain-based security protocols',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const stats = [
    { label: 'Medical Reports Analyzed', value: '2.5M+' },
    { label: 'Accuracy Rate', value: '99.9%' },
    { label: 'Healthcare Professionals', value: '50K+' },
    { label: 'Countries Served', value: '180+' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-300/10 to-blue-300/10 rounded-full blur-3xl animate-spin-slow"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Stethoscope className="h-20 w-20 text-blue-600 dark:text-blue-400" />
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full opacity-20 animate-pulse"></div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-6 animate-fade-in">
            Scan2Heal
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4 animate-slide-up">
            Scan, Understand, Heal
          </p>
          
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-3xl mx-auto animate-slide-up delay-200">
            Revolutionary AI-powered healthcare platform combining advanced OCR technology, intelligent diagnosis, 
            and comprehensive medical analysis to transform your healthcare experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-slide-up delay-300">
            <Link to="/scan-report">
              <Button size="xl" icon={Scan} className="w-full sm:w-auto">
                Scan Medical Report
              </Button>
            </Link>
            <Link to="/scan-medicine">
              <Button size="xl" variant="secondary" icon={Pill} className="w-full sm:w-auto">
                Med Effects
              </Button>
            </Link>
            <Link to="/diagnosis">
              <Button size="xl" variant="gradient" icon={Brain} className="w-full sm:w-auto">
                AI Diagnosis ⭐
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 animate-slide-up delay-400">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Advanced Medical Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Cutting-edge technology meets healthcare innovation to provide you with 
              the most comprehensive medical analysis platform available.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 hover group cursor-pointer" hover>
                <div className="flex items-start space-x-4">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </Card>
            ))}
          </div>

          {/* AI Diagnosis Highlight */}
          <Card className="p-8 mb-20 relative overflow-hidden" glow>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-teal-600/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl">
                  <Brain className="h-12 w-12 text-white" />
                </div>
                <Sparkles className="h-8 w-8 text-yellow-500 ml-4 animate-pulse" />
              </div>
              <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
                AI-Powered Medical Diagnosis ⭐ NEW
              </h3>
              <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto">
                Experience our revolutionary 4-step intelligent diagnosis process that combines patient history, 
                symptom analysis, and advanced AI algorithms to provide accurate medical insights with probability scoring.
              </p>
              <div className="flex justify-center">
                <Link to="/diagnosis">
                  <Button size="lg" variant="gradient" icon={Brain}>
                    Try AI Diagnosis Now
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Additional Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center" hover>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Lab Result Interpreter
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Easy-to-understand explanations of complex lab results with normal range indicators.
              </p>
            </Card>

            <Card className="p-6 text-center" hover>
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Real-time Health Monitoring
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Continuous health tracking with intelligent alerts and personalized recommendations.
              </p>
            </Card>

            <Card className="p-6 text-center" hover>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Healthcare Certified
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                HIPAA compliant with medical professional endorsements and clinical validation.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Healthcare?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of healthcare professionals and patients who trust Scan2Heal 
            for accurate medical analysis and intelligent diagnosis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/scan-report">
              <Button size="xl" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50 border-white">
                Start Scanning Reports
              </Button>
            </Link>
            <Link to="/diagnosis">
              <Button size="xl" className="bg-white/20 text-white hover:bg-white/30 border-white/30">
                Try AI Diagnosis
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
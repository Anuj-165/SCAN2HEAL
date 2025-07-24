import React, { useEffect, useState } from 'react';
import { 
  Heart, 
  Users, 
  Award, 
  Target, 
  Stethoscope, 
  Brain,
  Shield,
  Globe,
  CheckCircle,
  Star
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

// Animated Counter Component
const AnimatedCounter: React.FC<{ target: number }> = ({ target }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const stepTime = Math.abs(Math.floor(duration / target));
    const interval = setInterval(() => {
      start += Math.ceil(target / (duration / stepTime));
      if (start >= target) {
        start = target;
        clearInterval(interval);
      }
      setCount(start);
    }, stepTime);
    return () => clearInterval(interval);
  }, [target]);

  return <>{count.toLocaleString()}</>;
};

const AboutPage: React.FC = () => {
  const [stats, setStats] = useState([
    { icon: Users, value: 0, label: 'Patients Served' },
    { icon: Stethoscope, value: 0, label: 'Doctors' }
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/get-stats/'); // Your Django API endpoint
        const data = await res.json();
        setStats([
          { icon: Users, value: data.patients, label: 'Patients Served' },
          { icon: Stethoscope, value: data.doctors, label: 'Doctors' }
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Brain, title: 'AI-Powered Diagnosis', description: 'Advanced machine learning algorithms trained on millions of medical cases for accurate diagnosis assistance.' },
    { icon: Stethoscope, title: 'Medical Expert Validation', description: 'All our AI models are validated by board-certified physicians and medical professionals worldwide.' },
    { icon: Shield, title: 'HIPAA Compliant Security', description: 'Military-grade encryption and blockchain security ensure your medical data remains completely private.' },
    { icon: Globe, title: 'Global Healthcare Access', description: 'Breaking down barriers to quality healthcare with accessible technology available in 180+ countries.' }
  ];

  const testimonials = [
    { name: 'Dr. Sarah Chen', role: 'Chief of Cardiology, Mayo Clinic', image: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', quote: 'Scan2Heal has revolutionized how we approach medical diagnosis. The AI accuracy is remarkable, and it has significantly improved our diagnostic efficiency.' },
    { name: 'Dr. Michael Rodriguez', role: 'Emergency Medicine Specialist', image: 'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', quote: 'The OCR technology is incredibly precise. It has saved us countless hours in medical record processing and reduced human error significantly.' },
    { name: 'Dr. Emily Watson', role: 'Family Medicine Physician', image: 'https://images.pexels.com/photos/5327656/pexels-photo-5327656.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop', quote: 'What impresses me most is how Scan2Heal makes advanced medical technology accessible to patients. It is truly democratizing healthcare.' }
  ];

  const timeline = [
    { year: '2020', title: 'Company Founded', description: 'Started with a vision to make healthcare accessible through AI technology.' },
    { year: '2021', title: 'First AI Model', description: 'Launched our first medical diagnosis AI with 95% accuracy rate.' },
    { year: '2022', title: 'OCR Technology', description: 'Introduced advanced OCR for medical report processing.' },
    { year: '2023', title: 'Global Expansion', description: 'Expanded to serve patients in over 100 countries worldwide.' },
    { year: '2024', title: 'Next Generation AI', description: 'Launched revolutionary 4-step diagnosis process with 99.9% accuracy.' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full animate-ping"></div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-6">
            About Scan2Heal
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-8">
            Revolutionizing healthcare with AI-powered medical diagnosis, advanced OCR technology, 
            and secure health data management to make quality healthcare accessible to everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="gradient" icon={Target}>
              Our Mission
            </Button>
            <Button size="lg" variant="outline" icon={Users}>
              Meet Our Team
            </Button>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Our Mission</h2>
          <p className="text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
            To democratize healthcare by providing cutting-edge AI-powered medical tools that assist 
            both patients and healthcare professionals in making accurate, timely, and informed medical decisions. 
            We believe that everyone deserves access to high-quality healthcare technology, regardless of 
            their location or economic circumstances.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Impact by Numbers
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our technology has made a significant impact on healthcare delivery worldwide
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="p-8 text-center" hover>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  <AnimatedCounter target={stat.value} />
                </div>
                <p className="text-gray-600 dark:text-gray-300">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              What Makes Us Different
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our commitment to excellence drives us to deliver the most advanced and reliable healthcare technology
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8" hover>
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Trusted by Healthcare Professionals
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Leading medical experts worldwide trust Scan2Heal for accurate diagnosis assistance
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8" hover>
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From a small startup to a global healthcare technology leader
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <Card className={`p-6 max-w-md ${index % 2 === 0 ? 'mr-8' : 'ml-8'}`} hover>
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-4">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {item.year}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {item.description}
                    </p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Join the Healthcare Revolution
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Experience the future of healthcare with our AI-powered medical platform. 
            Start your journey towards better health today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" className="bg-white text-blue-600 hover:bg-blue-50">
              Get Started Today
            </Button>
            <Button size="xl" variant="outline" className="border-white text-white hover:bg-white/10">
              Contact Our Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

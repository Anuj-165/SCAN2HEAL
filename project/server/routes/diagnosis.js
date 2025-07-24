import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Medical knowledge base for symptom analysis
const medicalKnowledgeBase = {
  symptoms: {
    'headache': {
      category: 'Neurological',
      commonCauses: ['tension', 'migraine', 'dehydration', 'stress', 'sinusitis'],
      urgencyFactors: ['sudden severe onset', 'fever', 'neck stiffness', 'vision changes']
    },
    'fever': {
      category: 'General',
      commonCauses: ['infection', 'inflammation', 'medication reaction'],
      urgencyFactors: ['temperature >39°C', 'persistent >3 days', 'difficulty breathing']
    },
    'chest pain': {
      category: 'Cardiovascular',
      commonCauses: ['heart attack', 'angina', 'muscle strain', 'acid reflux'],
      urgencyFactors: ['crushing pain', 'radiating to arm', 'shortness of breath', 'sweating']
    },
    'shortness of breath': {
      category: 'Respiratory',
      commonCauses: ['asthma', 'pneumonia', 'heart failure', 'anxiety'],
      urgencyFactors: ['severe difficulty breathing', 'blue lips', 'chest pain']
    }
  },
  
  conditions: {
    'viral upper respiratory infection': {
      probability: 0.78,
      riskLevel: 'low',
      symptoms: ['headache', 'fever', 'fatigue', 'sore throat'],
      duration: '7-10 days',
      treatment: 'supportive care'
    },
    'tension headache': {
      probability: 0.65,
      riskLevel: 'low',
      symptoms: ['headache', 'stress', 'fatigue'],
      duration: '30 minutes to 7 days',
      treatment: 'rest, hydration, pain relief'
    },
    'migraine': {
      probability: 0.45,
      riskLevel: 'medium',
      symptoms: ['severe headache', 'nausea', 'light sensitivity'],
      duration: '4-72 hours',
      treatment: 'medication, rest in dark room'
    }
  }
};

// AI-powered diagnosis endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { patient, symptoms, medicalHistory } = req.body;

    if (!patient || !symptoms || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient information and symptoms are required for diagnosis'
      });
    }

    console.log(`🧠 Starting AI diagnosis for patient: ${patient.name}`);
    console.log(`📋 Symptoms: ${symptoms.map(s => s.name).join(', ')}`);

    // Analyze symptoms with AI
    const diagnosisResults = await performAIDiagnosis(patient, symptoms, medicalHistory);

    res.json({
      success: true,
      message: 'AI diagnosis completed successfully',
      data: {
        patient: patient,
        symptoms: symptoms,
        results: diagnosisResults,
        timestamp: new Date().toISOString(),
        disclaimer: 'This AI analysis is for informational purposes only and should not replace professional medical advice. Always consult with qualified healthcare providers for medical decisions.'
      }
    });

  } catch (error) {
    console.error('Diagnosis Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete AI diagnosis',
      error: error.message
    });
  }
});

// Symptom analysis endpoint
router.post('/symptoms/analyze', async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms are required for analysis'
      });
    }

    const analysis = await analyzeSymptoms(symptoms);

    res.json({
      success: true,
      message: 'Symptom analysis completed',
      data: analysis
    });

  } catch (error) {
    console.error('Symptom Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze symptoms',
      error: error.message
    });
  }
});

// Get available symptoms database
router.get('/symptoms', (req, res) => {
  const availableSymptoms = [
    { id: '1', name: 'Headache', category: 'Neurological', severity: [1, 2, 3, 4, 5] },
    { id: '2', name: 'Fever', category: 'General', severity: [1, 2, 3, 4, 5] },
    { id: '3', name: 'Nausea', category: 'Gastrointestinal', severity: [1, 2, 3, 4, 5] },
    { id: '4', name: 'Chest Pain', category: 'Cardiovascular', severity: [1, 2, 3, 4, 5] },
    { id: '5', name: 'Shortness of Breath', category: 'Respiratory', severity: [1, 2, 3, 4, 5] },
    { id: '6', name: 'Fatigue', category: 'General', severity: [1, 2, 3, 4, 5] },
    { id: '7', name: 'Dizziness', category: 'Neurological', severity: [1, 2, 3, 4, 5] },
    { id: '8', name: 'Abdominal Pain', category: 'Gastrointestinal', severity: [1, 2, 3, 4, 5] },
    { id: '9', name: 'Sore Throat', category: 'Respiratory', severity: [1, 2, 3, 4, 5] },
    { id: '10', name: 'Cough', category: 'Respiratory', severity: [1, 2, 3, 4, 5] },
    { id: '11', name: 'Joint Pain', category: 'Musculoskeletal', severity: [1, 2, 3, 4, 5] },
    { id: '12', name: 'Skin Rash', category: 'Dermatological', severity: [1, 2, 3, 4, 5] }
  ];

  res.json({
    success: true,
    message: 'Available symptoms retrieved',
    data: availableSymptoms
  });
});

// Risk assessment endpoint
router.post('/risk-assessment', async (req, res) => {
  try {
    const { patient, symptoms, vitalSigns } = req.body;

    const riskAssessment = await calculateRiskAssessment(patient, symptoms, vitalSigns);

    res.json({
      success: true,
      message: 'Risk assessment completed',
      data: riskAssessment
    });

  } catch (error) {
    console.error('Risk Assessment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete risk assessment',
      error: error.message
    });
  }
});

// Helper functions
async function performAIDiagnosis(patient, symptoms, medicalHistory) {
  try {
    const symptomList = symptoms.map(s => `${s.name} (severity: ${s.severity}/5, duration: ${s.duration})`).join(', ');
    
    const prompt = `
      As a medical AI assistant, analyze the following patient case and provide a differential diagnosis:

      Patient Information:
      - Name: ${patient.name}
      - Age: ${patient.age}
      - Gender: ${patient.gender}
      - Medical History: ${medicalHistory || 'None provided'}

      Current Symptoms:
      ${symptomList}

      Please provide:
      1. Top 3 most likely diagnoses with probability percentages
      2. Risk level for each (low/medium/high/urgent)
      3. Recommended actions for each diagnosis
      4. Urgency level (1-5 scale)
      5. When to seek immediate medical attention

      Format as JSON with the following structure:
      {
        "diagnoses": [
          {
            "condition": "condition name",
            "probability": percentage,
            "riskLevel": "low/medium/high/urgent",
            "description": "brief description",
            "recommendations": ["action1", "action2"],
            "urgency": number
          }
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a medical AI assistant providing differential diagnosis. Always emphasize that this is for informational purposes only and professional medical consultation is required."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.2
    });

    let aiResponse;
    try {
      aiResponse = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      aiResponse = generateFallbackDiagnosis(symptoms);
    }

    return aiResponse.diagnoses || generateFallbackDiagnosis(symptoms);

  } catch (error) {
    console.error('AI Diagnosis Error:', error);
    return generateFallbackDiagnosis(symptoms);
  }
}

function generateFallbackDiagnosis(symptoms) {
  // Fallback diagnosis based on symptom patterns
  const diagnoses = [];

  if (symptoms.some(s => s.name.toLowerCase().includes('headache'))) {
    diagnoses.push({
      condition: 'Tension Headache',
      probability: 70,
      riskLevel: 'low',
      description: 'Common type of headache often caused by stress, tension, or muscle strain.',
      recommendations: [
        'Rest in a quiet, dark room',
        'Apply cold or warm compress',
        'Stay hydrated',
        'Consider over-the-counter pain relief'
      ],
      urgency: 2
    });
  }

  if (symptoms.some(s => s.name.toLowerCase().includes('fever'))) {
    diagnoses.push({
      condition: 'Viral Infection',
      probability: 65,
      riskLevel: 'low',
      description: 'Common viral infection that typically resolves with supportive care.',
      recommendations: [
        'Rest and adequate fluid intake',
        'Monitor temperature regularly',
        'Seek medical attention if fever persists >3 days',
        'Isolate to prevent spread'
      ],
      urgency: 2
    });
  }

  if (diagnoses.length === 0) {
    diagnoses.push({
      condition: 'General Malaise',
      probability: 50,
      riskLevel: 'low',
      description: 'Non-specific symptoms that may indicate various conditions.',
      recommendations: [
        'Monitor symptoms closely',
        'Ensure adequate rest and hydration',
        'Consult healthcare provider if symptoms worsen',
        'Keep a symptom diary'
      ],
      urgency: 1
    });
  }

  return diagnoses;
}

async function analyzeSymptoms(symptoms) {
  const analysis = {
    totalSymptoms: symptoms.length,
    categories: {},
    severityDistribution: { mild: 0, moderate: 0, severe: 0 },
    urgencyIndicators: [],
    recommendations: []
  };

  symptoms.forEach(symptom => {
    // Categorize symptoms
    if (!analysis.categories[symptom.category]) {
      analysis.categories[symptom.category] = 0;
    }
    analysis.categories[symptom.category]++;

    // Analyze severity
    if (symptom.severity <= 2) analysis.severityDistribution.mild++;
    else if (symptom.severity <= 4) analysis.severityDistribution.moderate++;
    else analysis.severityDistribution.severe++;

    // Check for urgency indicators
    if (symptom.severity >= 4) {
      analysis.urgencyIndicators.push(`High severity ${symptom.name.toLowerCase()}`);
    }
  });

  // Generate recommendations
  if (analysis.severityDistribution.severe > 0) {
    analysis.recommendations.push('Seek immediate medical attention for severe symptoms');
  }
  if (analysis.categories['Cardiovascular']) {
    analysis.recommendations.push('Monitor cardiovascular symptoms closely');
  }
  if (analysis.categories['Respiratory']) {
    analysis.recommendations.push('Ensure adequate rest and monitor breathing');
  }

  return analysis;
}

async function calculateRiskAssessment(patient, symptoms, vitalSigns) {
  let riskScore = 0;
  const riskFactors = [];

  // Age-based risk
  if (patient.age > 65) {
    riskScore += 2;
    riskFactors.push('Advanced age (>65)');
  } else if (patient.age < 2) {
    riskScore += 2;
    riskFactors.push('Very young age (<2)');
  }

  // Symptom-based risk
  symptoms.forEach(symptom => {
    if (symptom.severity >= 4) {
      riskScore += 2;
      riskFactors.push(`Severe ${symptom.name.toLowerCase()}`);
    }
    
    if (symptom.category === 'Cardiovascular' || symptom.category === 'Respiratory') {
      riskScore += 1;
      riskFactors.push(`${symptom.category} symptoms`);
    }
  });

  // Vital signs risk (if provided)
  if (vitalSigns) {
    if (vitalSigns.temperature > 39) {
      riskScore += 2;
      riskFactors.push('High fever (>39°C)');
    }
    if (vitalSigns.heartRate > 100 || vitalSigns.heartRate < 60) {
      riskScore += 1;
      riskFactors.push('Abnormal heart rate');
    }
  }

  // Determine risk level
  let riskLevel;
  if (riskScore >= 6) riskLevel = 'urgent';
  else if (riskScore >= 4) riskLevel = 'high';
  else if (riskScore >= 2) riskLevel = 'medium';
  else riskLevel = 'low';

  return {
    riskScore,
    riskLevel,
    riskFactors,
    recommendations: generateRiskRecommendations(riskLevel),
    timestamp: new Date().toISOString()
  };
}

function generateRiskRecommendations(riskLevel) {
  const recommendations = {
    low: [
      'Monitor symptoms at home',
      'Maintain adequate rest and hydration',
      'Seek medical attention if symptoms worsen'
    ],
    medium: [
      'Consider consulting healthcare provider within 24-48 hours',
      'Monitor symptoms closely',
      'Seek immediate care if symptoms worsen rapidly'
    ],
    high: [
      'Consult healthcare provider within 24 hours',
      'Monitor vital signs regularly',
      'Prepare for potential medical intervention'
    ],
    urgent: [
      'Seek immediate medical attention',
      'Call emergency services if necessary',
      'Do not delay medical care'
    ]
  };

  return recommendations[riskLevel] || recommendations.low;
}

export default router;
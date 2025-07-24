import express from 'express';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import FormData from 'form-data';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.chatanywhere.tech/v1'
});

// RxNorm API configuration
const RXNORM_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `medicine-image-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP images are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

// Comprehensive medicine database
const medicineDatabase = {
  // Pain relievers
  'paracetamol': {
    name: 'Paracetamol (Acetaminophen)',
    genericName: 'Acetaminophen',
    composition: 'Acetaminophen 500mg',
    category: 'Analgesic/Antipyretic',
    manufacturer: 'Various manufacturers',
    sideEffects: ['Nausea', 'Vomiting', 'Liver damage (overdose)', 'Allergic reactions'],
    dosage: 'Adults: 500-1000mg every 4-6 hours. Maximum 4000mg per day.',
    interactions: ['Warfarin', 'Alcohol', 'Phenytoin', 'Carbamazepine'],
    warnings: ['Do not exceed recommended dose', 'Avoid alcohol', 'Consult doctor if liver problems'],
    contraindications: ['Severe liver disease', 'Allergy to acetaminophen']
  },
  'ibuprofen': {
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    composition: 'Ibuprofen 200mg/400mg',
    category: 'NSAID',
    manufacturer: 'Various manufacturers',
    sideEffects: ['Stomach upset', 'Heartburn', 'Dizziness', 'Kidney problems'],
    dosage: 'Adults: 200-400mg every 4-6 hours. Maximum 1200mg per day.',
    interactions: ['Aspirin', 'Warfarin', 'ACE inhibitors', 'Lithium'],
    warnings: ['Take with food', 'Avoid if kidney problems', 'Monitor blood pressure'],
    contraindications: ['Active peptic ulcer', 'Severe heart failure', 'Third trimester pregnancy']
  },
  'aspirin': {
    name: 'Aspirin',
    genericName: 'Acetylsalicylic acid',
    composition: 'Acetylsalicylic acid 75mg/300mg',
    category: 'NSAID/Antiplatelet',
    manufacturer: 'Various manufacturers',
    sideEffects: ['Stomach irritation', 'Bleeding', 'Tinnitus', 'Allergic reactions'],
    dosage: 'Low dose: 75-100mg daily. Pain relief: 300-600mg every 4 hours.',
    interactions: ['Warfarin', 'Methotrexate', 'ACE inhibitors', 'Alcohol'],
    warnings: ['Take with food', 'Not for children under 16', 'Monitor for bleeding'],
    contraindications: ['Active bleeding', 'Severe asthma', 'Children with viral infections']
  },
  // Antibiotics
  'amoxicillin': {
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    composition: 'Amoxicillin 250mg/500mg',
    category: 'Antibiotic (Penicillin)',
    manufacturer: 'Various manufacturers',
    sideEffects: ['Diarrhea', 'Nausea', 'Skin rash', 'Allergic reactions'],
    dosage: 'Adults: 250-500mg every 8 hours for 7-10 days.',
    interactions: ['Oral contraceptives', 'Warfarin', 'Methotrexate'],
    warnings: ['Complete full course', 'Take with food if stomach upset', 'Report allergic reactions'],
    contraindications: ['Penicillin allergy', 'Severe kidney disease']
  },
  'azithromycin': {
    name: 'Azithromycin',
    genericName: 'Azithromycin',
    composition: 'Azithromycin 250mg/500mg',
    category: 'Antibiotic (Macrolide)',
    manufacturer: 'Various manufacturers',
    sideEffects: ['Nausea', 'Diarrhea', 'Abdominal pain', 'Headache'],
    dosage: 'Adults: 500mg on day 1, then 250mg daily for 4 days.',
    interactions: ['Warfarin', 'Digoxin', 'Ergot alkaloids', 'Antacids'],
    warnings: ['Take on empty stomach', 'Complete full course', 'Monitor heart rhythm'],
    contraindications: ['Macrolide allergy', 'Severe liver disease']
  },
  // Cardiovascular
  'lisinopril': {
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    composition: 'Lisinopril 5mg/10mg/20mg',
    category: 'ACE Inhibitor',
    manufacturer: 'Various manufacturers',
    sideEffects: ['Dry cough', 'Dizziness', 'Hyperkalemia', 'Angioedema'],
    dosage: 'Initial: 5-10mg daily. Maintenance: 10-40mg daily.',
    interactions: ['Potassium supplements', 'NSAIDs', 'Lithium', 'Diuretics'],
    warnings: ['Monitor kidney function', 'Check potassium levels', 'Avoid pregnancy'],
    contraindications: ['Pregnancy', 'Bilateral renal artery stenosis', 'History of angioedema']
  },
  'amlodipine': {
    name: 'Amlodipine',
    genericName: 'Amlodipine',
    composition: 'Amlodipine 5mg/10mg',
    category: 'Calcium Channel Blocker',
    manufacturer: 'Various manufacturers',
    sideEffects: ['Ankle swelling', 'Flushing', 'Dizziness', 'Fatigue'],
    dosage: 'Initial: 5mg daily. Maximum: 10mg daily.',
    interactions: ['Simvastatin', 'Cyclosporine', 'Tacrolimus'],
    warnings: ['Monitor blood pressure', 'Rise slowly from sitting', 'Regular dental care'],
    contraindications: ['Severe aortic stenosis', 'Cardiogenic shock']
  },
  // Diabetes
  'metformin': {
    name: 'Metformin',
    genericName: 'Metformin',
    composition: 'Metformin 500mg/850mg/1000mg',
    category: 'Antidiabetic (Biguanide)',
    manufacturer: 'Various manufacturers',
    sideEffects: ['Nausea', 'Diarrhea', 'Metallic taste', 'Vitamin B12 deficiency'],
    dosage: 'Initial: 500mg twice daily. Maximum: 2000mg daily.',
    interactions: ['Contrast agents', 'Alcohol', 'Cimetidine'],
    warnings: ['Take with meals', 'Monitor kidney function', 'Stop before surgery'],
    contraindications: ['Severe kidney disease', 'Metabolic acidosis', 'Severe heart failure']
  }
};

// Search medicine by name using enhanced database and AI
router.get('/search/:name', async (req, res) => {
  try {
    const medicineName = req.params.name.toLowerCase().trim();
    
    console.log(`🔍 Searching for medicine: ${medicineName}`);

    // First, try exact match in our database
    let medicineData = findMedicineInDatabase(medicineName);
    
    // If not found, try fuzzy matching
    if (!medicineData) {
      medicineData = findSimilarMedicine(medicineName);
    }
    
    // If still not found, try RxNorm API
    if (!medicineData) {
      try {
        medicineData = await getMedicineFromRxNorm(medicineName);
      } catch (error) {
        console.error('RxNorm API error:', error);
      }
    }
    
    // If still not found and we have OpenAI, try AI-powered search
    if (!medicineData && process.env.OPENAI_API_KEY) {
      try {
        medicineData = await getMedicineWithAI(medicineName);
      } catch (error) {
        console.error('AI medicine search error:', error);
      }
    }

    if (!medicineData) {
      return res.status(404).json({
        success: false,
        message: `Medicine "${req.params.name}" not found. Please check the spelling or try alternative names.`,
        suggestions: getSuggestions(medicineName)
      });
    }

    res.json({
      success: true,
      message: 'Medicine information retrieved successfully',
      data: medicineData
    });

  } catch (error) {
    console.error('Medicine Search Error:', error);
    res.status(500).json({
      success: false,
      message: 'Medicine search service temporarily unavailable. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Image upload and analysis with AI
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded. Please select a medicine image to analyze.'
      });
    }

    console.log(`📸 Analyzing medicine image: ${req.file.originalname}`);

    let analysisResult = {
      detectedText: '',
      confidence: 0,
      possibleMedicines: [],
      recommendations: [
        'Verify the medicine name with a pharmacist',
        'Check expiration date on the package',
        'Ensure proper storage conditions'
      ]
    };

    // Try OCR.space API for text extraction
    try {
      if (process.env.OCR_SPACE_API_KEY) {
        const ocrResult = await extractTextFromImage(req.file.path);
        analysisResult.detectedText = ocrResult.text;
        analysisResult.confidence = ocrResult.confidence;
        
        // If we detected text, try to find medicine info
        if (ocrResult.text && ocrResult.text.length > 2) {
          const words = ocrResult.text.toLowerCase().split(/\s+/);
          
          for (const word of words) {
            if (word.length > 3) {
              const medicineData = findMedicineInDatabase(word) || findSimilarMedicine(word);
              if (medicineData) {
                analysisResult.possibleMedicines.push({
                  name: medicineData.name,
                  confidence: ocrResult.confidence,
                  reason: 'Text detected on package matches medicine name'
                });
                break;
              }
            }
          }
        }
      }
    } catch (ocrError) {
      console.error('OCR analysis failed:', ocrError);
    }

    // Try AI-powered image analysis if available
    if (process.env.OPENAI_API_KEY && analysisResult.possibleMedicines.length === 0) {
      try {
        const aiAnalysis = await analyzeMedicineImageWithAI(req.file.path);
        if (aiAnalysis.medicineName) {
          const medicineData = findMedicineInDatabase(aiAnalysis.medicineName) || 
                              findSimilarMedicine(aiAnalysis.medicineName);
          if (medicineData) {
            analysisResult.possibleMedicines.push({
              name: medicineData.name,
              confidence: aiAnalysis.confidence,
              reason: 'AI image analysis identified medicine'
            });
          }
        }
      } catch (aiError) {
        console.error('AI image analysis failed:', aiError);
      }
    }

    // Clean up uploaded file
    setTimeout(() => {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (error) {
        console.error('File cleanup error:', error);
      }
    }, 5000);

    res.json({
      success: true,
      message: 'Medicine image analyzed successfully',
      data: analysisResult
    });

  } catch (error) {
    console.error('Image Analysis Error:', error);
    
    // Clean up file on error
    if (req.file) {
      setTimeout(() => {
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (cleanupError) {
          console.error('File cleanup error:', cleanupError);
        }
      }, 1000);
    }

    res.status(500).json({
      success: false,
      message: 'Image analysis service temporarily unavailable. Please try searching by medicine name.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get drug interactions with AI enhancement
router.post('/interactions', async (req, res) => {
  try {
    const { medicines } = req.body;
    
    if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 medicines to check interactions'
      });
    }

    let interactions = [];
    
    // Check interactions using our database first
    interactions = checkInteractionsInDatabase(medicines);
    
    // Enhance with AI if available
    if (process.env.OPENAI_API_KEY) {
      try {
        const aiInteractions = await checkDrugInteractionsWithAI(medicines);
        interactions = [...interactions, ...aiInteractions];
      } catch (aiError) {
        console.error('AI interaction check failed:', aiError);
      }
    }

    if (interactions.length === 0) {
      interactions = [{
        medicines: medicines.slice(0, 2),
        severity: 'Unknown',
        description: 'No known interactions found in our database. Please consult with a pharmacist or healthcare provider for comprehensive interaction checking.',
        recommendation: 'Always inform your healthcare provider about all medications you are taking.'
      }];
    }

    res.json({
      success: true,
      message: 'Drug interaction check completed',
      data: {
        medicines: medicines,
        interactions: interactions,
        riskLevel: calculateRiskLevel(interactions),
        timestamp: new Date().toISOString(),
        disclaimer: 'This information is for educational purposes only. Always consult healthcare professionals for medical advice.'
      }
    });

  } catch (error) {
    console.error('Drug Interaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Drug interaction service temporarily unavailable. Please consult with a healthcare professional.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper functions
function findMedicineInDatabase(name) {
  const normalizedName = name.toLowerCase().trim();
  
  // Direct match
  if (medicineDatabase[normalizedName]) {
    return medicineDatabase[normalizedName];
  }
  
  // Check if name contains any medicine name
  for (const [key, medicine] of Object.entries(medicineDatabase)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return medicine;
    }
  }
  
  return null;
}

function findSimilarMedicine(name) {
  const normalizedName = name.toLowerCase().trim();
  
  // Fuzzy matching with common misspellings
  const commonMisspellings = {
    'paracetmol': 'paracetamol',
    'paracetamol': 'paracetamol',
    'ibuprofin': 'ibuprofen',
    'ibuprfen': 'ibuprofen',
    'asprin': 'aspirin',
    'amoxicilin': 'amoxicillin',
    'amoxicillin': 'amoxicillin',
    'azithromicin': 'azithromycin',
    'lisinopril': 'lisinopril',
    'amlodipine': 'amlodipine',
    'metformin': 'metformin'
  };
  
  if (commonMisspellings[normalizedName]) {
    return medicineDatabase[commonMisspellings[normalizedName]];
  }
  
  // Levenshtein distance matching
  let bestMatch = null;
  let bestDistance = Infinity;
  
  for (const key of Object.keys(medicineDatabase)) {
    const distance = levenshteinDistance(normalizedName, key);
    if (distance < bestDistance && distance <= 2) {
      bestDistance = distance;
      bestMatch = key;
    }
  }
  
  return bestMatch ? medicineDatabase[bestMatch] : null;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

async function getMedicineFromRxNorm(medicineName) {
  try {
    const searchUrl = `${RXNORM_BASE_URL}/drugs.json?name=${encodeURIComponent(medicineName)}`;
    const searchResponse = await axios.get(searchUrl, { timeout: 10000 });
    
    if (searchResponse.data && searchResponse.data.drugGroup && searchResponse.data.drugGroup.conceptGroup) {
      const conceptGroups = searchResponse.data.drugGroup.conceptGroup;
      
      for (const group of conceptGroups) {
        if (group.conceptProperties && group.conceptProperties.length > 0) {
          const concept = group.conceptProperties[0];
          
          return {
            name: concept.name,
            genericName: concept.name,
            composition: concept.synonym || 'Composition information not available',
            category: group.tty || 'Medicine',
            manufacturer: 'Manufacturer information not available from RxNorm',
            sideEffects: ['Side effects information not available from RxNorm API'],
            dosage: 'Please consult healthcare provider for dosage information',
            interactions: ['Drug interaction information not available from RxNorm API'],
            warnings: ['Please consult healthcare provider for warnings and precautions'],
            contraindications: ['Please consult healthcare provider for contraindications']
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('RxNorm API Error:', error);
    return null;
  }
}

async function getMedicineWithAI(medicineName) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return null;
    }

    const prompt = `
      Provide comprehensive medical information about the medicine "${medicineName}" in the following JSON format:
      {
        "name": "Full medicine name",
        "genericName": "Generic name",
        "composition": "Active ingredients and strength",
        "category": "Medicine category",
        "manufacturer": "Common manufacturers",
        "sideEffects": ["List of common side effects"],
        "dosage": "Standard dosage instructions",
        "interactions": ["List of common drug interactions"],
        "warnings": ["Important warnings and precautions"],
        "contraindications": ["When not to use this medicine"]
      }
      
      Only provide factual medical information. If the medicine is not recognized, return null.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a pharmaceutical expert providing accurate medicine information. Always include safety warnings and emphasize consulting healthcare professionals."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.1
    });

    const result = response.choices[0].message.content.trim();
    
    try {
      const medicineData = JSON.parse(result);
      return medicineData;
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return null;
    }

  } catch (error) {
    console.error('AI Medicine Search Error:', error);
    return null;
  }
}

async function extractTextFromImage(imagePath) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    formData.append('apikey', process.env.OCR_SPACE_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');

    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    if (response.data && response.data.ParsedResults && response.data.ParsedResults.length > 0) {
      const result = response.data.ParsedResults[0];
      return {
        text: result.ParsedText.trim(),
        confidence: 85
      };
    }
    
    return { text: '', confidence: 0 };
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw error;
  }
}

async function analyzeMedicineImageWithAI(imagePath) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return { medicineName: null, confidence: 0 };
    }

    // This is a placeholder for AI image analysis
    // In a real implementation, you would use OpenAI's vision capabilities
    // For now, we'll return a basic response
    return { medicineName: null, confidence: 0 };
  } catch (error) {
    console.error('AI image analysis error:', error);
    return { medicineName: null, confidence: 0 };
  }
}

function checkInteractionsInDatabase(medicines) {
  const interactions = [];
  
  // Basic interaction checking logic
  const knownInteractions = {
    'warfarin': ['aspirin', 'ibuprofen', 'paracetamol'],
    'aspirin': ['warfarin', 'ibuprofen'],
    'ibuprofen': ['aspirin', 'warfarin', 'lisinopril'],
    'lisinopril': ['ibuprofen'],
    'metformin': ['alcohol']
  };
  
  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const med1 = medicines[i].toLowerCase();
      const med2 = medicines[j].toLowerCase();
      
      if (knownInteractions[med1] && knownInteractions[med1].includes(med2)) {
        interactions.push({
          medicines: [medicines[i], medicines[j]],
          severity: 'Medium',
          description: `Potential interaction between ${medicines[i]} and ${medicines[j]}`,
          recommendation: 'Consult healthcare provider before combining these medications'
        });
      }
    }
  }
  
  return interactions;
}

async function checkDrugInteractionsWithAI(medicines) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return [];
    }

    const prompt = `
      Check for drug interactions between these medicines: ${medicines.join(', ')}
      
      Provide the response in JSON format:
      {
        "interactions": [
          {
            "medicines": ["Medicine A", "Medicine B"],
            "severity": "High/Medium/Low",
            "description": "Description of interaction",
            "recommendation": "What to do about it"
          }
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a clinical pharmacist expert in drug interactions. Provide accurate, safety-focused information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    try {
      const result = JSON.parse(response.choices[0].message.content.trim());
      return result.interactions || [];
    } catch (parseError) {
      return [];
    }

  } catch (error) {
    console.error('AI Drug Interaction Error:', error);
    return [];
  }
}

function getSuggestions(medicineName) {
  const suggestions = [];
  const allMedicines = Object.keys(medicineDatabase);
  
  for (const medicine of allMedicines) {
    if (medicine.includes(medicineName.toLowerCase()) || 
        levenshteinDistance(medicineName.toLowerCase(), medicine) <= 3) {
      suggestions.push(medicine);
    }
  }
  
  return suggestions.slice(0, 5);
}

function calculateRiskLevel(interactions) {
  if (interactions.length === 0) return 'Low';
  
  const hasHighSeverity = interactions.some(interaction => interaction.severity === 'High');
  if (hasHighSeverity) return 'High';
  
  const hasMediumSeverity = interactions.some(interaction => interaction.severity === 'Medium');
  if (hasMediumSeverity) return 'Medium';
  
  return 'Low';
}

export default router;
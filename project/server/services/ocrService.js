import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import axios from 'axios';
import FormData from 'form-data';

class OCRService {
  constructor() {
    // Initialize OpenAI with custom base URL
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.chatanywhere.tech/v1'
    });

    // OCR.Space API configuration
    this.ocrSpaceApiKey = process.env.OCR_SPACE_API_KEY;
    this.ocrSpaceEndpoint = 'https://api.ocr.space/parse/image';

    // Medical terminology for better extraction
    this.medicalTerms = new Set([
      'hemoglobin', 'glucose', 'cholesterol', 'triglycerides', 'creatinine',
      'blood pressure', 'heart rate', 'temperature', 'respiratory rate',
      'white blood cell', 'red blood cell', 'platelet', 'hematocrit',
      'diagnosis', 'prognosis', 'treatment', 'medication', 'dosage',
      'prescription', 'symptoms', 'patient', 'doctor', 'physician',
      'hospital', 'clinic', 'laboratory', 'radiology', 'pathology'
    ]);
  }

  // Main OCR processing function
  async processDocument(filePath, fileType) {
    try {
      console.log(`🔍 Starting OCR processing for: ${filePath}`);
      
      let extractedText = '';
      let confidence = 0;
      let processingDetails = {
        engines: 0,
        timestamp: new Date().toISOString(),
        fileType: fileType,
        errors: []
      };

      if (fileType === 'application/pdf') {
        // Process PDF
        try {
          const result = await this.processPDF(filePath);
          extractedText = result.text;
          confidence = result.confidence;
          processingDetails.engines = 1;
        } catch (error) {
          console.error('PDF processing error:', error);
          processingDetails.errors.push('PDF processing failed');
          throw new Error('Failed to process PDF document');
        }
      } else {
        // Try OCR.space API first
        try {
          const result = await this.runOCRSpaceAPI(filePath);
          extractedText = result.text;
          confidence = result.confidence;
          processingDetails.engines = 1;
        } catch (error) {
          console.error('OCR.space API error:', error);
          processingDetails.errors.push('OCR.space API failed');
          
          // Fallback to basic text extraction message
          extractedText = 'OCR service temporarily unavailable. The document was uploaded successfully but text extraction failed. Please try again later or contact support.';
          confidence = 0;
        }
      }

      // Enhance text with AI if available and text was extracted
      let enhancedText = extractedText;
      if (process.env.OPENAI_API_KEY && extractedText.length > 10 && confidence > 0) {
        try {
          enhancedText = await this.enhanceWithAI(extractedText);
        } catch (error) {
          console.error('AI enhancement error:', error);
          processingDetails.errors.push('AI enhancement failed');
          // Continue with original text if AI enhancement fails
        }
      }

      // Generate medical analysis
      let medicalAnalysis = '';
      if (process.env.OPENAI_API_KEY && enhancedText.length > 10 && confidence > 0) {
        try {
          medicalAnalysis = await this.generateMedicalReport(enhancedText);
        } catch (error) {
          console.error('Medical analysis error:', error);
          processingDetails.errors.push('Medical analysis failed');
          medicalAnalysis = 'Medical analysis temporarily unavailable. Please consult with a healthcare professional for proper interpretation of your medical report.';
        }
      } else {
        medicalAnalysis = 'Medical analysis requires successful text extraction. Please ensure the document is clear and try again.';
      }

      return {
        success: true,
        extractedText: enhancedText,
        analysis: medicalAnalysis,
        confidence: Math.max(confidence, confidence > 0 ? 85 : 0),
        processingDetails: processingDetails
      };

    } catch (error) {
      console.error('OCR Processing Error:', error);
      
      return {
        success: false,
        extractedText: 'Unable to process document at this time. Please ensure the file is clear and readable, then try again.',
        analysis: 'Document processing failed. Please try uploading a clearer image or contact support if the issue persists.',
        confidence: 0,
        processingDetails: {
          engines: 0,
          timestamp: new Date().toISOString(),
          fileType: fileType,
          errors: [error.message]
        }
      };
    }
  }

  // OCR.Space API processing
  async runOCRSpaceAPI(imagePath) {
    try {
      console.log('🚀 Running OCR.Space API...');
      
      if (!this.ocrSpaceApiKey) {
        throw new Error('OCR.Space API key not configured');
      }
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));
      formData.append('apikey', this.ocrSpaceApiKey);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2');

      const response = await axios.post(this.ocrSpaceEndpoint, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000
      });

      if (response.data && response.data.ParsedResults && response.data.ParsedResults.length > 0) {
        const result = response.data.ParsedResults[0];
        
        if (result.ErrorMessage) {
          throw new Error(`OCR.Space API Error: ${result.ErrorMessage}`);
        }
        
        return {
          text: result.ParsedText.trim(),
          confidence: 90,
          success: true
        };
      } else {
        throw new Error('No text detected in the image');
      }
    } catch (error) {
      console.error('OCR.Space API Error:', error);
      throw error;
    }
  }

  // PDF processing
  async processPDF(filePath) {
    try {
      console.log('📄 Processing PDF document...');
      
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      return {
        text: pdfData.text.trim(),
        confidence: 98,
        success: true
      };
    } catch (error) {
      console.error('PDF Processing Error:', error);
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }

  // AI-powered text enhancement
  async enhanceWithAI(extractedText) {
    try {
      console.log('🤖 Enhancing text with AI...');
      
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured, returning original text');
        return extractedText;
      }
      
      const prompt = `
        You are a medical text processing AI. Clean up and enhance the following OCR-extracted medical text:
        
        1. Fix OCR errors and typos
        2. Correct medical terminology
        3. Improve formatting and structure
        4. Preserve all numerical values exactly
        5. Maintain original meaning
        6. Format as a proper medical report
        
        OCR Text:
        ${extractedText}
        
        Enhanced Text:
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a medical text processing expert specializing in cleaning OCR-extracted medical documents."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI Enhancement Error:', error);
      return extractedText;
    }
  }

  // Generate structured medical report
  async generateMedicalReport(text) {
    try {
      console.log('🏥 Generating medical report...');
      
      if (!process.env.OPENAI_API_KEY) {
        return 'Medical analysis requires OpenAI API configuration. Please consult with a healthcare professional for proper interpretation of your medical report.';
      }
      
      const prompt = `
        Analyze the following medical report and create a structured summary with these sections:
        
        📋 **DOCUMENT TYPE**: [Lab Report/Prescription/Radiology/etc.]
        
        🔍 **KEY FINDINGS**:
        • [List important findings]
        
        📊 **VITAL PARAMETERS**:
        • [List with normal ranges where applicable]
        
        ⚠️ **ABNORMAL VALUES**:
        • [Highlight any values outside normal range]
        
        💊 **MEDICATIONS** (if any):
        • [List medications with dosages]
        
        📝 **RECOMMENDATIONS**:
        • [Suggested follow-up actions]
        
        🚨 **URGENCY LEVEL**: [Low/Medium/High/Urgent]
        
        ⚕️ **NEXT STEPS**:
        • [What patient should do next]
        
        Medical Report Text:
        ${text}
        
        Structured Report:
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a medical AI assistant specializing in medical report analysis. Provide clear, structured insights while emphasizing that this is for informational purposes only and not a substitute for professional medical advice."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.2
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Medical Report Generation Error:', error);
      return 'Medical analysis temporarily unavailable. Please consult with a healthcare professional for proper interpretation of your medical report.';
    }
  }

  // Clean up temporary files
  async cleanup(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export default new OCRService();
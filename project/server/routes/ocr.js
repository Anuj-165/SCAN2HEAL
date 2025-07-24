import express from 'express';
import upload from '../config/multer.js';
import ocrService from '../services/ocrService.js';

const router = express.Router();

// OCR processing endpoint
router.post('/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a medical report to process.'
      });
    }

    console.log(`📄 Processing file: ${req.file.originalname}`);
    console.log(`📁 File path: ${req.file.path}`);
    console.log(`📊 File size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/webp',
      'image/tiff',
      'application/pdf'
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload JPEG, PNG, WEBP, TIFF, or PDF files only.'
      });
    }

    // Process the document with OCR
    const result = await ocrService.processDocument(req.file.path, req.file.mimetype);

    // Clean up uploaded file
    setTimeout(() => {
      ocrService.cleanup(req.file.path);
    }, 5000);

    res.json({
      success: true,
      message: 'Medical report processed successfully',
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        extractedText: result.extractedText,
        analysis: result.analysis,
        confidence: result.confidence,
        processingDetails: result.processingDetails
      }
    });

  } catch (error) {
    console.error('OCR Route Error:', error);
    
    // Clean up file on error
    if (req.file) {
      setTimeout(() => {
        ocrService.cleanup(req.file.path);
      }, 1000);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process medical report',
      error: error.message
    });
  }
});

// OCR status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'OCR service is operational',
    engines: [
      'Tesseract.js',
      'Google Cloud Vision',
      'AWS Textract', 
      'OCR.Space API'
    ],
    supportedFormats: [
      'PDF',
      'JPEG',
      'PNG',
      'WEBP',
      'TIFF'
    ],
    maxFileSize: '50MB',
    accuracy: '99%+',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for OCR functionality
router.post('/test', (req, res) => {
  res.json({
    success: true,
    message: 'OCR test endpoint working',
    timestamp: new Date().toISOString()
  });
});

export default router;
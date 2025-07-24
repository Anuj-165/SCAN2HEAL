import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ocrRoutes from './routes/ocr.js';
import medicineRoutes from './routes/medicine.js';
import diagnosisRoutes from './routes/diagnosis.js';
import vaultRoutes from './routes/vault.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
import fs from 'fs';
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/medicine', medicineRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/vault', vaultRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const features = {
    ocr: !!process.env.OCR_SPACE_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    rxnorm: true, // RxNorm API is public
    auth: !!process.env.JWT_SECRET,
    email: !!(process.env.SMTP_HOST && process.env.SMTP_USER)
  };

  res.json({ 
    status: 'OK', 
    message: 'Scan2Heal Backend Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: features,
    apis: {
      ocr: process.env.OCR_SPACE_API_KEY ? 'OCR.Space API Active' : 'OCR.Space API Not Configured',
      medicine: 'RxNorm API Active (Public)',
      ai: process.env.OPENAI_API_KEY ? 'OpenAI API Active' : 'OpenAI API Not Configured'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  
  // Handle multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Scan2Heal Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`🔍 OCR API: http://localhost:${PORT}/api/ocr`);
  console.log(`💊 Medicine API: http://localhost:${PORT}/api/medicine`);
  console.log(`🧠 Diagnosis API: http://localhost:${PORT}/api/diagnosis`);
  console.log(`🗄️ Vault API: http://localhost:${PORT}/api/vault`);
  
  // Log configuration status
  console.log('\n📋 Configuration Status:');
  console.log(`✅ OpenAI API: ${process.env.OPENAI_API_KEY ? 'Configured' : '❌ Missing'}`);
  console.log(`✅ OCR.Space API: ${process.env.OCR_SPACE_API_KEY ? 'Configured' : '❌ Missing'}`);
  console.log(`✅ RxNorm API: Public API - Always Available`);
  console.log(`✅ JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : '❌ Missing'}`);
  console.log(`✅ Email Config: ${(process.env.SMTP_HOST && process.env.SMTP_USER) ? 'Configured' : '❌ Missing'}`);
  
  console.log('\n🔗 API Endpoints:');
  console.log(`• OpenAI Base URL: ${process.env.OPENAI_BASE_URL || 'https://api.chatanywhere.tech/v1'}`);
  console.log(`• RxNorm API: ${process.env.RXNORM_API_BASE || 'https://rxnav.nlm.nih.gov/REST'}`);
  console.log(`• OCR.Space API: https://api.ocr.space/parse/image`);
});
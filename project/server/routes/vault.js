import express from 'express';
import { authenticateToken } from './auth.js';

const router = express.Router();

// User-specific medical reports storage (replace with database in production)
let userReports = {};

// Get all medical reports for authenticated user
router.get('/reports', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, search, sortBy = 'uploadDate', order = 'desc' } = req.query;

    let userReportsList = userReports[userId] || [];

    // Filter by type
    if (type && type !== 'all') {
      userReportsList = userReportsList.filter(report => report.type === type);
    }

    // Search functionality
    if (search) {
      const searchTerm = search.toLowerCase();
      userReportsList = userReportsList.filter(report =>
        report.name.toLowerCase().includes(searchTerm) ||
        report.type.toLowerCase().includes(searchTerm) ||
        (report.extractedText && report.extractedText.toLowerCase().includes(searchTerm))
      );
    }

    // Sort reports
    userReportsList.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'uploadDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (order === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    res.json({
      success: true,
      message: 'Medical reports retrieved successfully',
      data: {
        reports: userReportsList,
        total: userReportsList.length,
        filters: { type, search, sortBy, order }
      }
    });

  } catch (error) {
    console.error('Get Reports Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve medical reports',
      error: error.message
    });
  }
});

// Get specific report by ID for authenticated user
router.get('/reports/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const reportId = req.params.id;
    const userReportsList = userReports[userId] || [];
    const report = userReportsList.find(r => r.id === reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Medical report not found'
      });
    }

    res.json({
      success: true,
      message: 'Medical report retrieved successfully',
      data: report
    });

  } catch (error) {
    console.error('Get Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve medical report',
      error: error.message
    });
  }
});

// Add new medical report for authenticated user
router.post('/reports', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, type, extractedText, analysis, fileSize, confidence } = req.body;

    if (!name || !type || !extractedText) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, and extracted text are required'
      });
    }

    // Initialize user reports if not exists
    if (!userReports[userId]) {
      userReports[userId] = [];
    }

    const newReport = {
      id: Date.now().toString(),
      name,
      type,
      uploadDate: new Date().toISOString().split('T')[0],
      extractedText,
      analysis: analysis || 'Analysis pending...',
      fileSize: fileSize || 0,
      confidence: confidence || 95,
      userId: userId
    };

    userReports[userId].push(newReport);

    res.status(201).json({
      success: true,
      message: 'Medical report added successfully',
      data: newReport
    });

  } catch (error) {
    console.error('Add Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add medical report',
      error: error.message
    });
  }
});

// Update medical report for authenticated user
router.put('/reports/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const reportId = req.params.id;
    const userReportsList = userReports[userId] || [];
    const reportIndex = userReportsList.findIndex(r => r.id === reportId);

    if (reportIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Medical report not found'
      });
    }

    const updatedReport = {
      ...userReportsList[reportIndex],
      ...req.body,
      id: reportId, // Ensure ID doesn't change
      userId: userId // Ensure userId doesn't change
    };

    userReports[userId][reportIndex] = updatedReport;

    res.json({
      success: true,
      message: 'Medical report updated successfully',
      data: updatedReport
    });

  } catch (error) {
    console.error('Update Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medical report',
      error: error.message
    });
  }
});

// Delete medical report for authenticated user
router.delete('/reports/:id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const reportId = req.params.id;
    const userReportsList = userReports[userId] || [];
    const reportIndex = userReportsList.findIndex(r => r.id === reportId);

    if (reportIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Medical report not found'
      });
    }

    const deletedReport = userReports[userId].splice(reportIndex, 1)[0];

    res.json({
      success: true,
      message: 'Medical report deleted successfully',
      data: deletedReport
    });

  } catch (error) {
    console.error('Delete Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete medical report',
      error: error.message
    });
  }
});

// Get vault statistics for authenticated user
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const userReportsList = userReports[userId] || [];
    
    const stats = {
      totalReports: userReportsList.length,
      reportTypes: {},
      recentActivity: userReportsList
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        .slice(0, 5),
      storageUsed: userReportsList.reduce((total, report) => total + (report.fileSize || 0), 0),
      averageConfidence: userReportsList.length > 0 
        ? userReportsList.reduce((total, report) => total + (report.confidence || 0), 0) / userReportsList.length 
        : 0
    };

    // Calculate report types distribution
    userReportsList.forEach(report => {
      stats.reportTypes[report.type] = (stats.reportTypes[report.type] || 0) + 1;
    });

    res.json({
      success: true,
      message: 'Vault statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Get Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vault statistics',
      error: error.message
    });
  }
});

export default router;
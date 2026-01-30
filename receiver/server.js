const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large payloads for session data
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

/**
 * POST /api/report
 * Receive and store a session report
 */
app.post('/api/report', (req, res) => {
  try {
    const { sessionId, sessionData, rawJsonl } = req.body;
    
    if (!sessionId || !sessionData) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId and sessionData' 
      });
    }
    
    const reportId = db.insertReport(sessionId, sessionData, rawJsonl);
    
    console.log(`[${new Date().toISOString()}] Report received: ID ${reportId}, Session: ${sessionId}`);
    
    res.status(201).json({ 
      success: true, 
      reportId,
      message: 'Report stored successfully' 
    });
  } catch (error) {
    console.error('Error storing report:', error);
    res.status(500).json({ 
      error: 'Failed to store report',
      details: error.message 
    });
  }
});

/**
 * GET /api/reports
 * Get all reports
 */
app.get('/api/reports', (req, res) => {
  try {
    const reports = db.getAllReports();
    res.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reports',
      details: error.message 
    });
  }
});

/**
 * GET /api/reports/:id
 * Get a specific report by ID
 */
app.get('/api/reports/:id', (req, res) => {
  try {
    const report = db.getReportById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ success: true, report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ 
      error: 'Failed to fetch report',
      details: error.message 
    });
  }
});

/**
 * DELETE /api/reports/:id
 * Delete a specific report by ID
 */
app.delete('/api/reports/:id', (req, res) => {
  try {
    const result = db.deleteReport(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ 
      error: 'Failed to delete report',
      details: error.message 
    });
  }
});

/**
 * GET /api/reports/:id/download
 * Download a report as JSONL file
 */
app.get('/api/reports/:id/download', (req, res) => {
  try {
    const report = db.getReportById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Use original JSONL if available, otherwise generate it
    let jsonlContent;
    if (report.raw_jsonl) {
      jsonlContent = report.raw_jsonl;
    } else {
      jsonlContent = convertToJsonl(report.session_data);
    }
    
    // Set headers for file download
    const timestamp = new Date(report.timestamp).toISOString().replace(/[:.]/g, '-');
    const filename = `session-${report.id}-${timestamp}.jsonl`;
    
    res.setHeader('Content-Type', 'application/x-jsonlines');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(jsonlContent);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ 
      error: 'Failed to download report',
      details: error.message 
    });
  }
});

/**
 * Convert session data to JSONL format
 */
function convertToJsonl(sessionData) {
  let messages = [];
  
  // Extract messages from different possible formats
  if (Array.isArray(sessionData)) {
    messages = sessionData
      .filter(item => item.message && item.message.role)
      .map(item => ({
        role: item.message.role,
        content: extractContent(item.message.content)
      }));
  } else if (sessionData.messages && Array.isArray(sessionData.messages)) {
    messages = sessionData.messages
      .filter(msg => msg.role && msg.content)
      .map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      }));
  }
  
  // Convert to JSONL (one JSON object per line)
  return messages.map(msg => JSON.stringify(msg)).join('\n');
}

/**
 * Extract content from message content field
 */
function extractContent(content) {
  if (typeof content === 'string') {
    return content;
  }
  
  if (Array.isArray(content)) {
    return content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n');
  }
  
  return JSON.stringify(content);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('Claude Report Receiver Server');
  console.log('='.repeat(50));
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}/`);
  console.log(`API endpoint: http://localhost:${PORT}/api/report`);
  console.log('='.repeat(50));
});
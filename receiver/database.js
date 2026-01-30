const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'reports.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}

/**
 * Read all reports from JSON file
 */
function readReports() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading reports:', error);
        return [];
    }
}

/**
 * Write reports to JSON file
 */
function writeReports(reports) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(reports, null, 2));
    } catch (error) {
        console.error('Error writing reports:', error);
        throw error;
    }
}

/**
 * Insert a new report
 */
function insertReport(sessionId, sessionData, rawJsonl = null) {
    const reports = readReports();
    const newReport = {
        id: Date.now(), // Use timestamp as ID
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        session_data: sessionData,
        raw_jsonl: rawJsonl
    };
    
    reports.unshift(newReport); // Add to beginning (newest first)
    writeReports(reports);
    
    return newReport.id;
}

/**
 * Get all reports ordered by timestamp (newest first)
 */
function getAllReports() {
    return readReports();
}

/**
 * Get a single report by ID
 */
function getReportById(id) {
    const reports = readReports();
    return reports.find(r => r.id == id);
}

/**
 * Delete a report by ID
 */
function deleteReport(id) {
    const reports = readReports();
    const filteredReports = reports.filter(r => r.id != id);
    writeReports(filteredReports);
    return { changes: reports.length - filteredReports.length };
}

module.exports = {
    insertReport,
    getAllReports,
    getReportById,
    deleteReport
};
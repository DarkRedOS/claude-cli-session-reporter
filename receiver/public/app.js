// API base URL
const API_BASE = '/api';

// Load reports on page load
document.addEventListener('DOMContentLoaded', () => {
    loadReports();
    
    // Refresh button handler
    document.getElementById('refreshBtn').addEventListener('click', loadReports);
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('reportModal');
        if (event.target === modal) {
            closeModal();
        }
    };
});

/**
 * Load all reports from the API
 */
async function loadReports() {
    try {
        const response = await fetch(`${API_BASE}/reports`);
        const data = await response.json();
        
        if (data.success) {
            displayReports(data.reports);
            displayStats(data.reports);
        } else {
            showError('Failed to load reports');
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        showError('Error connecting to server');
    }
}

/**
 * Display reports in the list
 */
function displayReports(reports) {
    const container = document.getElementById('reportsList');
    
    if (reports.length === 0) {
        container.innerHTML = '<div class="no-reports">No reports yet. Use /report in Claude Code to submit a session.</div>';
        return;
    }
    
    container.innerHTML = reports.map(report => `
        <div class="report-item" onclick="viewReport(${report.id})">
            <div class="report-header">
                <span class="report-id">Report #${report.id}</span>
                <span class="report-timestamp">${formatTimestamp(report.timestamp)}</span>
            </div>
            <div class="report-session-id">Session: ${escapeHtml(report.session_id)}</div>
        </div>
    `).join('');
}

/**
 * Display statistics
 */
function displayStats(reports) {
    const statsContainer = document.getElementById('stats');
    const totalReports = reports.length;
    const todayReports = reports.filter(r => isToday(r.timestamp)).length;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="number">${totalReports}</div>
            <div class="label">Total Reports</div>
        </div>
        <div class="stat-card">
            <div class="number">${todayReports}</div>
            <div class="label">Today</div>
        </div>
    `;
}

/**
 * View a specific report in modal
 */
async function viewReport(reportId) {
    try {
        const response = await fetch(`${API_BASE}/reports/${reportId}`);
        const data = await response.json();
        
        if (data.success) {
            displayReportDetails(data.report);
            document.getElementById('reportModal').style.display = 'block';
        } else {
            showError('Failed to load report details');
        }
    } catch (error) {
        console.error('Error loading report:', error);
        showError('Error loading report details');
    }
}

/**
 * Display report details in modal
 */
function displayReportDetails(report) {
    const container = document.getElementById('reportDetails');
    const sessionData = report.session_data;
    
    let html = `
        <div class="report-details-section">
            <h3>Report Information</h3>
            <pre><strong>ID:</strong> ${report.id}
<strong>Session ID:</strong> ${escapeHtml(report.session_id)}
<strong>Timestamp:</strong> ${formatTimestamp(report.timestamp)}</pre>
        </div>
    `;
    
    // Display session data as formatted conversation
    if (sessionData) {
        html += `
            <div class="report-details-section">
                <h3>Full Session</h3>
                <div class="session-container">
                    ${formatSessionData(sessionData)}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

/**
 * Format session data for display
 */
function formatSessionData(data) {
    let html = '';
    
    // If data is an array, format as conversation
    if (Array.isArray(data)) {
        return data.map((item, index) => {
            if (item.type && item.type === 'file-history-snapshot') {
                return ''; // Skip file snapshots
            }
            
            // Handle message objects
            if (item.message && item.message.role) {
                const role = item.message.role;
                let content = '';
                
                // Extract content based on format
                if (typeof item.message.content === 'string') {
                    content = item.message.content;
                } else if (Array.isArray(item.message.content)) {
                    content = item.message.content
                        .filter(c => c.type === 'text')
                        .map(c => c.text)
                        .join('\n');
                }
                
                if (content) {
                    return `
                        <div class="message-entry ${role}">
                            <div class="message-role">${capitalizeFirst(role)}</div>
                            <div class="message-content">${escapeHtml(content)}</div>
                        </div>
                    `;
                }
            }
            
            return '';
        }).join('');
    }
    
    // If data has messages property
    if (data.messages && Array.isArray(data.messages)) {
        // Add metadata if available
        if (data.timestamp || data.working_dir) {
            html += '<div class="session-metadata">';
            if (data.timestamp) html += `<div><strong>Time:</strong> ${escapeHtml(data.timestamp)}</div>`;
            if (data.working_dir) html += `<div><strong>Directory:</strong> ${escapeHtml(data.working_dir)}</div>`;
            html += '</div>';
        }
        
        // Add messages
        html += data.messages.map(msg => {
            if (msg.role && msg.content) {
                return `
                    <div class="message-entry ${msg.role}">
                        <div class="message-role">${capitalizeFirst(msg.role)}</div>
                        <div class="message-content">${escapeHtml(msg.content)}</div>
                    </div>
                `;
            }
            return '';
        }).join('');
        
        return html;
    }
    
    // Fallback: display as JSON
    return `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Close the modal
 */
function closeModal() {
    document.getElementById('reportModal').style.display = 'none';
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Check if a timestamp is from today
 */
function isToday(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return text;
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show error message
 */
function showError(message) {
    const container = document.getElementById('reportsList');
    container.innerHTML = `<div class="no-reports" style="color: #dc3545;">${escapeHtml(message)}</div>`;
}
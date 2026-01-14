// DOM elements
const form = document.getElementById('inventoryForm');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const status = document.getElementById('status');
const logContainer = document.getElementById('logContainer');

// State
let isRunning = false;

// Form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (isRunning) return;

  // Get form values
  const cartonId = document.getElementById('cartonId').value.trim();
  const vendorId = document.getElementById('vendorId').value.trim();
  const skuCode = document.getElementById('skuCode').value.trim();
  const requestCount = parseInt(document.getElementById('requestCount').value);

  // Validate inputs
  if (!cartonId || !vendorId || !skuCode || !requestCount || requestCount < 1) {
    showStatus('Please fill in all fields correctly', 'error');
    return;
  }

  if (requestCount > 1000) {
    showStatus('Maximum 1000 requests allowed at once', 'error');
    return;
  }

  // Start the process
  startProcess(cartonId, vendorId, skuCode, requestCount);
});

// Stop button
stopBtn.addEventListener('click', () => {
  stopProcess();
});

// Start the request process
function startProcess(cartonId, vendorId, skuCode, requestCount) {
  isRunning = true;

  // Update UI
  startBtn.disabled = true;
  startBtn.textContent = 'Running...';
  stopBtn.style.display = 'block';
  progressContainer.style.display = 'block';
  logContainer.style.display = 'block';
  logContainer.innerHTML = '';

  // Reset progress
  updateProgress(0, requestCount);

  showStatus(`Starting ${requestCount} requests...`, 'info');

  // Send message to background script
  chrome.runtime.sendMessage({
    action: 'startRequests',
    data: {
      cartonId,
      vendorId,
      skuCode,
      requestCount
    }
  });
}

// Stop the process
function stopProcess() {
  chrome.runtime.sendMessage({ action: 'stopRequests' });
  resetUI();
  showStatus('Stopped by user', 'info');
}

// Reset UI to initial state
function resetUI() {
  isRunning = false;
  startBtn.disabled = false;
  startBtn.textContent = 'Start Requests';
  stopBtn.style.display = 'none';
}

// Update progress bar
function updateProgress(completed, total) {
  const percentage = (completed / total) * 100;
  progressFill.style.width = `${percentage}%`;
  progressText.textContent = `${completed} / ${total} completed`;
}

// Show status message
function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
}

// Add log entry
function addLog(message, type = 'info') {
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type}`;
  logEntry.textContent = message;
  logContainer.appendChild(logEntry);

  // Auto-scroll to bottom
  logContainer.scrollTop = logContainer.scrollHeight;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'progress') {
    updateProgress(message.completed, message.total);
    addLog(`Request ${message.completed}/${message.total} completed`, 'success');
  } else if (message.action === 'error') {
    addLog(`Error on request ${message.requestNumber}: ${message.error}`, 'error');
  } else if (message.action === 'complete') {
    resetUI();
    showStatus(`✅ Completed! ${message.successful} successful, ${message.failed} failed`, 'success');
    addLog(`Process completed: ${message.successful} successful, ${message.failed} failed`, 'success');
  } else if (message.action === 'stopped') {
    resetUI();
    showStatus('Process stopped', 'info');
  }
});

// Check if there's an ongoing process when popup opens
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  if (response && response.isRunning) {
    isRunning = true;
    startBtn.disabled = true;
    startBtn.textContent = 'Running...';
    stopBtn.style.display = 'block';
    progressContainer.style.display = 'block';
    logContainer.style.display = 'block';
    updateProgress(response.completed, response.total);
    showStatus('Process is running...', 'info');
  }
});

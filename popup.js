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
  const delay = parseFloat(document.getElementById('delay').value);

  // Validate inputs
  if (!cartonId || !vendorId || !skuCode || !requestCount || requestCount < 1) {
    showStatus('Please fill in all fields correctly', 'error');
    return;
  }

  if (requestCount > 1000) {
    showStatus('Maximum 1000 requests allowed at once', 'error');
    return;
  }

  if (!delay || delay < 0.1) {
    showStatus('Delay must be at least 0.1 seconds', 'error');
    return;
  }

  // Start the process
  startProcess(cartonId, vendorId, skuCode, requestCount, delay);
});

// Stop button
stopBtn.addEventListener('click', () => {
  stopProcess();
});

// Start the request process
function startProcess(cartonId, vendorId, skuCode, requestCount, delay) {
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
      requestCount,
      delay
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

// Settings Toggle
const settingsToggle = document.getElementById('settingsToggle');
const advancedSettings = document.getElementById('advancedSettings');

settingsToggle.addEventListener('click', (e) => {
  e.preventDefault();
  if (advancedSettings.style.display === 'none') {
    advancedSettings.style.display = 'block';
    settingsToggle.textContent = 'Advanced Settings ▲';
  } else {
    advancedSettings.style.display = 'none';
    settingsToggle.textContent = 'Advanced Settings ▼';
  }
});

// Input Persistence
const inputs = ['cartonId', 'vendorId', 'skuCode', 'requestCount', 'delay'];
inputs.forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    const val = el.value;
    chrome.storage.local.set({ [id]: val });
  });
});


// Check if there's an ongoing process when popup opens, and auto-fill form
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
  } else {
    // Load persisted values
    chrome.storage.local.get(['cartonId', 'vendorId', 'skuCode', 'requestCount', 'delay', 'lastCapturedPayload'], (result) => {

      // Priority 1: Persisted user input
      if (result.cartonId) document.getElementById('cartonId').value = result.cartonId;
      if (result.vendorId) document.getElementById('vendorId').value = result.vendorId;
      if (result.skuCode) document.getElementById('skuCode').value = result.skuCode;
      if (result.requestCount) document.getElementById('requestCount').value = result.requestCount;
      if (result.delay) document.getElementById('delay').value = result.delay;

      // Priority 2: Auto-captured payload (only if fields are empty)
      // Actually, let's only auto-fill if the user has NOT manually entered something distinct,
      // OR if the user explicitly wants it.
      // Current behavior: If we have captured payload, it might overwrite manual empty fields.
      // Better behavior: Check if empty, then fill.

      if (result.lastCapturedPayload) {
        let autoFilled = false;
        const { cartonId, vendorId, skuCode } = result.lastCapturedPayload;

        if (!document.getElementById('cartonId').value && cartonId) {
           document.getElementById('cartonId').value = cartonId;
           autoFilled = true;
        }
        if (!document.getElementById('vendorId').value && vendorId) {
           document.getElementById('vendorId').value = vendorId;
           autoFilled = true;
        }
        if (!document.getElementById('skuCode').value && skuCode) {
           document.getElementById('skuCode').value = skuCode;
           autoFilled = true;
        }

        if (autoFilled) {
          showStatus('✨ Auto-filled missing fields from last session', 'info');
          setTimeout(() => {
            if(!isRunning) status.style.display = 'none';
          }, 3000);
        }
      }
    });
  }
});

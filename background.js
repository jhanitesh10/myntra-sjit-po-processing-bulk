// State management
let isRunning = false;
let shouldStop = false;
let currentProgress = {
  completed: 0,
  total: 0,
  successful: 0,
  failed: 0
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startRequests') {
    startRequests(message.data);
    sendResponse({ success: true });
  } else if (message.action === 'stopRequests') {
    shouldStop = true;
    sendResponse({ success: true });
  } else if (message.action === 'getStatus') {
    sendResponse({
      isRunning,
      completed: currentProgress.completed,
      total: currentProgress.total
    });
  }
  return true;
});

// Main function to start making requests
async function startRequests(data) {
  if (isRunning) return;

  isRunning = true;
  shouldStop = false;
  currentProgress = {
    completed: 0,
    total: data.requestCount,
    successful: 0,
    failed: 0
  };

  const { cartonId, vendorId, skuCode, requestCount } = data;

  // Get cookies from the browser
  const cookies = await getCookies();

  if (!cookies) {
    notifyPopup('error', 'Failed to get session cookies. Please make sure you are logged into Myntra partner portal.');
    isRunning = false;
    return;
  }

  // Make requests in a loop
  for (let i = 1; i <= requestCount; i++) {
    if (shouldStop) {
      notifyPopup('stopped', 'Process stopped by user');
      break;
    }

    try {
      await makeRequest(cartonId, vendorId, skuCode, cookies, i);
      currentProgress.completed = i;
      currentProgress.successful++;

      // Notify popup of progress
      notifyPopup('progress', null, i, requestCount);

      // Wait 1 second before next request (except for the last one)
      if (i < requestCount && !shouldStop) {
        await sleep(1000);
      }
    } catch (error) {
      currentProgress.completed = i;
      currentProgress.failed++;
      notifyPopup('error', error.message, i);

      // Continue with next request after 1 second
      if (i < requestCount && !shouldStop) {
        await sleep(1000);
      }
    }
  }

  // Process complete
  if (!shouldStop) {
    notifyPopup('complete', null, currentProgress.successful, currentProgress.failed);
  }

  isRunning = false;
  shouldStop = false;
}

// Make a single API request
async function makeRequest(cartonId, vendorId, skuCode, cookies, requestNumber) {
  const url = 'https://partnersapi.myntrainfo.com/api/scanandpack/cartonItem/create';

  const payload = {
    cartonId: parseInt(cartonId),
    vendorId: vendorId,
    skuCode: skuCode
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.5',
      'Content-Type': 'application/json',
      'Referer': 'https://partners.myntrainfo.com/',
      'X-Requested-With': 'XMLHttpRequest',
      'x-myntra-app-name': 'partners',
      'Origin': 'https://partners.myntrainfo.com',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Cookie': cookies
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// Get cookies from the browser
async function getCookies() {
  try {
    const cookies = await chrome.cookies.getAll({
      domain: 'myntrainfo.com'
    });

    if (!cookies || cookies.length === 0) {
      return null;
    }

    // Format cookies as a string
    const cookieString = cookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');

    return cookieString;
  } catch (error) {
    console.error('Error getting cookies:', error);
    return null;
  }
}

// Notify popup of events
function notifyPopup(action, error = null, param1 = null, param2 = null) {
  const message = { action };

  if (action === 'progress') {
    message.completed = param1;
    message.total = param2;
  } else if (action === 'error') {
    message.error = error;
    message.requestNumber = param1;
  } else if (action === 'complete') {
    message.successful = param1;
    message.failed = param2;
  }

  // Send message to all popup instances
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup might be closed, ignore error
  });
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

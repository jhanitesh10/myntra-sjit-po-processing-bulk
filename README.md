# 📦 Myntra Inventory Automation Chrome Extension

A Chrome extension to automate bulk inventory entry for Myntra's partner portal. This tool helps you make multiple API requests efficiently with a user-friendly interface.

## ✨ Features

- **Bulk Request Automation**: Make up to 1000 requests in a single batch
- **Smart Cookie Management**: Automatically extracts session cookies from your browser
- **Real-time Progress Tracking**: Visual progress bar and detailed logs
- **Error Handling**: Graceful error handling with detailed error messages
- **User-Friendly Interface**: Clean, modern UI with easy-to-use controls
- **Stop Anytime**: Ability to stop the process at any time

## 🚀 Installation

### Step 1: Download the Extension

1. Clone or download this repository to your local machine
2. Extract the files to a folder (e.g., `myntra-sjit-inventory-extension`)

### Step 2: Load in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the folder containing the extension files
6. The extension icon should appear in your Chrome toolbar

## 📖 Usage

### Prerequisites

- You must be logged into the [Myntra Partner Portal](https://partners.myntrainfo.com/) before using the extension
- The extension uses your browser's session cookies for authentication

### Steps

1. **Login to Myntra Partner Portal**
   - Navigate to `https://partners.myntrainfo.com/`
   - Log in with your credentials

2. **Open the Extension**
   - Click the extension icon in your Chrome toolbar
   - The popup will appear with input fields

3. **Fill in the Details**
   - **Carton ID**: Enter the carton ID (e.g., `10781439`)
   - **Vendor ID**: Enter the vendor ID (e.g., `59931`)
   - **SKU Code**: Enter the SKU code (e.g., `RHCOSPAL120106515`)
   - **Number of Requests**: Enter how many requests to make (1-1000)

4. **Start the Process**
   - Click **Start Requests**
   - Watch the progress bar and logs in real-time
   - Each request is made with a 1-second delay

5. **Monitor Progress**
   - The extension shows:
     - Progress bar with percentage
     - Number of completed requests
     - Success/error logs for each request
     - Final summary when complete

6. **Stop if Needed**
   - Click the **Stop** button to halt the process at any time

## 🔍 How It Works

1. **Cookie Extraction**: The extension automatically extracts session cookies from `myntrainfo.com`
2. **API Requests**: Makes POST requests to the Myntra API endpoint with proper headers
3. **Rate Limiting**: Implements a 1-second delay between requests to avoid overwhelming the server
4. **Error Handling**: Catches and displays errors for individual requests while continuing with the rest

## ⚠️ Important Notes

- **Session Cookies**: The extension requires valid session cookies. Make sure you're logged in before using it.
- **Rate Limiting**: The extension makes 1 request per second. For 328 requests, it will take approximately 5.5 minutes.
- **API Compliance**: Ensure this usage complies with Myntra's API policies and terms of service.
- **Maximum Requests**: Limited to 1000 requests per batch for safety.

## 🛠️ Technical Details

### Files

- `manifest.json` - Extension configuration
- `popup.html` - User interface
- `popup.js` - UI logic and event handling
- `background.js` - Service worker for API requests
- `icon.png` - Extension icon

### API Endpoint

```
POST https://partnersapi.myntrainfo.com/api/scanandpack/cartonItem/create
```

### Request Payload

```json
{
  "cartonId": 10781439,
  "vendorId": "59931",
  "skuCode": "RHCOSPAL120106515"
}
```

## 🐛 Troubleshooting

### "Failed to get session cookies"
- **Solution**: Make sure you're logged into the Myntra partner portal in the same browser

### Requests failing with 401/403 errors
- **Solution**: Your session may have expired. Log out and log back into the Myntra partner portal

### Extension not appearing
- **Solution**: Make sure Developer mode is enabled in `chrome://extensions/`

### Requests timing out
- **Solution**: Check your internet connection and ensure the Myntra API is accessible

## 📝 License

This extension is provided as-is for personal use. Please ensure compliance with Myntra's terms of service.

## 🤝 Support

For issues or questions, please check the troubleshooting section above or contact your system administrator.

---

**Disclaimer**: This tool is designed to help automate repetitive tasks. Use responsibly and in accordance with Myntra's API usage policies.

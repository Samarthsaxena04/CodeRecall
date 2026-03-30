# CodeRecall Browser Extension

Track your DSA revisions without leaving the problem page. Log questions, mark revision status, and get email reminders — all from your browser.

## Installation (Free — Load Unpacked)

### Step 1: Generate Icons

Before loading the extension, you need to create the icon files. Run this from the `browser-extension` folder:

```bash
python generate_icons.py
```

This creates `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` from your project logo.

**If Python/Pillow aren't available**, you can manually:
1. Create the `icons/` folder
2. Copy your `logo.png` as `icon16.png`, `icon48.png`, `icon128.png`

### Step 2: Load in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** (toggle in top-right corner)
3. Click **Load Unpacked**
4. Select the `browser-extension` folder from this project
5. The CodeRecall icon appears in your toolbar ✅

### Step 3: Sign In

1. Click the CodeRecall extension icon
2. Enter the same email + password you use on the website
3. That's it — you're logged in!

## How to Use

### Adding a Question
1. Open any problem on LeetCode, Codeforces, CodeChef, etc.
2. Click the CodeRecall icon
3. Title, link, and platform are **auto-detected** ✨
4. Add tags, optional notes, and mark your status (Solved / Help / Failed)
5. Click **Save Question**

### Reviewing Due Questions
1. The extension icon shows a **badge** with the count of questions due today
2. Click the icon → switch to the **"Due Today"** tab
3. Mark each question as Solved, Help, or Failed directly from the popup

### Supported Platforms
- LeetCode
- Codeforces
- CodeChef
- HackerRank
- HackerEarth
- GeeksforGeeks
- AtCoder
- TopCoder

## Development

### Local API Mode
Toggle the **"Use local API"** checkbox at the bottom of the popup to switch between:
- **Production**: `https://coderecall-api-....azurewebsites.net`
- **Local**: `http://127.0.0.1:8000`

### File Structure
```
browser-extension/
├── manifest.json         ← Extension config (Manifest V3)
├── background.js         ← Service worker (badge, alarms, token refresh)
├── generate_icons.py     ← Icon generator script
├── content/
│   └── scraper.js        ← Content script (scrapes CP platform pages)
├── popup/
│   ├── popup.html        ← Popup UI
│   ├── popup.css         ← Dark theme styles
│   └── popup.js          ← Popup logic (auth, forms, API calls)
├── icons/
│   ├── icon16.png        ← Toolbar icon
│   ├── icon48.png        ← Extension management page
│   └── icon128.png       ← Chrome Web Store / install dialog
└── README.md
```

## Sharing with Others

1. Zip the `browser-extension` folder
2. Share the zip (via GitHub Releases, Google Drive, etc.)
3. Recipients unzip → Load Unpacked → Done!

No Chrome Web Store fee needed. No server required for the extension itself.

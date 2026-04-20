# CodeRecall

CodeRecall is a specialized spaced-repetition tracking system designed for software engineers preparing for coding interviews. It seamlessly integrates with popular competitive programming platforms via a browser extension to auto-capture problems, categorize them, and schedule optimal revision intervals.

## 🎯 Key Features

- **Automated Tracking (Chrome Extension):** Instantly scrape problem titles, URLs, platforms, and topic tags from 8+ platforms (LeetCode, Codeforces, HackerRank, GeeksforGeeks, etc.) without leaving the competition window.
- **Spaced Repetition Engine:** Automatically schedules problem revisions based on confidence levels:
  - **Solved:** Revise in 12 days
  - **Needed Help:** Revise in 5 days
  - **Unsolved:** Revise in 3 days
- **Performance Analytics:** Comprehensive heatmaps, success rate tracking, and weak-topic detection to identify areas needing improvement.
- **Automated Notifications:** Background email service that alerts you of pending daily revisions.
- **Seamless Auth:** Frictionless Google OAuth login with synchronized sessions between the web app and the browser extension via secure token handshakes.

## 🛠 Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Recharts
- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL
- **Extension:** Vanilla JS, Chrome Extension Manifest V3
- **Infrastructure:** Azure App Services (API & Database), Vercel (Frontend), Background Schedulers

## 🚀 Local Development

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a locally tracked .env file based on the example
cp .env.example .env

# Run the local server
fastapi dev main.py
```

### 2. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Setup environment variables
cp .env.example .env.local

# Run the development server
npm run dev
```

### 3. Extension Setup
1. Open your Chromium-based browser and navigate to `chrome://extensions/`.
2. Enable **Developer Mode** in the top right corner.
3. Click **Load Unpacked** and select the `chrome-extension` folder in this repository.

## 📐 System Architecture Note

CodeRecall implements a cross-tab communication architecture for extension authentication. Because sidelined Chrome extensions generate dynamic internal IDs, Google OAuth redirects are handled on the stable frontend domain. The frontend subsequently broadcasts secure JWT pairs to the extension via `chrome.runtime.sendMessage`, establishing the user session without redundant logins.

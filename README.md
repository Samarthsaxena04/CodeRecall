# CodeRecall

CodeRecall is a specialized spaced-repetition tracking system designed for software engineers preparing for technical interviews and competitive programming. The project solves the problem of unstructured problem-solving practice by providing a unified interface to track, categorize, and schedule revisions for coding problems across multiple competitive platforms.

The system consists of three distinct components: a Python/FastAPI backend, a React frontend, and a Chrome extension that acts as a localized scraper to capture problem metadata directly from the browser window.

## System Architecture

CodeRecall utilizes a service-oriented architecture with clear separation of concerns across its three primary clients:

1. **Backend Service (Python / FastAPI / SQLAlchemy)**
   - Acts as the central source of truth for user data, problem logs, and revision scheduling.
   - Deployed on Azure App Services with an Azure PostgreSQL Flexible Server instance.
   - Handles JWT-based authentication, user configuration state, and periodic tasks (e.g., daily email reminders via APScheduler/Celery).

2. **Web Client (React / Vite / Tailwind CSS)**
   - A single-page application (SPA) deployed on Vercel.
   - Serves as the primary dashboard for users to view statistical overlays, tracking heatmaps, success rates, and weak-topic aggregations.
   - Houses the core Google OAuth authentication flow.

3. **Browser Extension (Manifest V3 / Vanilla JS)**
   - Operates contextually when a user visits supported domains (LeetCode, Codeforces, HackerRank, GeeksforGeeks, CodeChef, HackerEarth, AtCoder, TopCoder).
   - Utilizes content scripts to parse the DOM, extracting problem titles, platform identities, URLs, and contextual category tags.
   - Interacts with the backend via background service workers to submit new problem entries immediately after completion.

## Core Mechanics

### 1. Spaced Repetition Scheduling
To enforce active recall, CodeRecall relies on a dynamic revision scheduler mapped to user confidence metrics. When a problem is logged, the user designates an outcome constraint (`done`, `help`, `fail`), which the backend resolves into standard interval delays (configurable by the user):
- **Solved ("done"):** Scheduled for review in 12 days.
- **Needed Help ("help"):** Scheduled for review in 5 days.
- **Failed ("fail"):** Scheduled for review in 3 days.

### 2. Cross-Context Authentication
Due to strict Google OAuth and Chrome Manifest V3 security policies on dynamic redirect URIs, the extension delegates authentication to the web client. 
- When an authentication event is triggered in the extension, a specialized frontend route (`/extension-auth?ext_id=...`) is opened.
- Upon successful Google OAuth resolution, the React application posts the secure JWT payload directly to the Chrome extension via `chrome.runtime.sendMessage`.
- The extension's background worker intercepts the payload, synchronizes its local storage state, and automatically closes the authentication tab, ensuring seamless cross-origin identity sharing.

### 3. Asynchronous Content Scraping
The extension relies on bespoke DOM selectors mapped to individual platform UI structures. Because modern platforms like LeetCode behave as complex SPAs, the content scripts explicitly manage race conditions and rendering lifecycle delays to ensure React-hydrated DOM nodes are present before attempting tag extraction.

## Local Development Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL

### Backend Setup
```bash
cd backend
python -m venv venv

# On macOS/Linux: source venv/bin/activate
# On Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# Duplicate the environment template and insert valid credentials
cp .env.example .env

# Run the API server locally
fastapi dev main.py
```

### Frontend Setup
```bash
cd frontend
npm install

# Duplicate the environment template
cp .env.example .env.local

# Run the Vite development server
npm run dev
```

### Extension Setup
1. Open a Chromium-based browser (Chrome, Edge, Brave).
2. Navigate to `chrome://extensions/`.
3. Enable **Developer Mode**.
4. Select **Load Unpacked** and target the `chrome-extension/` directory.

# Hack The Globe: SocialScript (A Gamified Duolingo for Social Skills)

Welcome to the **Hack The Globe** project! This is an interactive, AI-powered workplace roleplay simulator designed to help users with autism, or those who struggle with social interactions practice and improve their professional communication skills. 

By leveraging generative AI, the application provides realistic conversational scenarios, real-time coaching hints, and comprehensive post-scenario feedback based on Social Thinking and Cognitive Behavioral Therapy (CBT) frameworks.

## 🌟 Key Features

- **Interactive Roleplay**: Engage in dynamic conversations with an AI character in various workplace scenarios (e.g., job interviews, difficult conversations, casual networking).
- **Real-time Coaching**: Receive actionable hints during conversations, breaking down the partner's perspective, suggested actions, and the rationale behind them.
- **Detailed Reflection**: After completing a session, get a structured evaluation on your strengths, areas for improvement, better phrasing options, and a focus for your next practice.
- **Immersive Environment**: Navigate through different scenarios via an interactive Workplace Map UI.
- **Modern Tech Stack**: Fast and responsive frontend built with React & Vite, backed by a robust Python FastAPI backend integrating Google's Gemini LLM.

## 🏗️ Architecture & Tech Stack

The project is split into two main components:

### Frontend (`/frontend`)
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Vanilla CSS / CSS Modules
- **Routing**: Custom React state-based routing

### Backend API (`/API`)
- **Framework**: FastAPI (Python)
- **AI Integration**: Google Gemini API (`gemini-2.5-flash`)
- **Server**: Uvicorn

## 🚀 Getting Started

Follow these instructions to get the application running locally on your machine.

### Prerequisites
- Node.js (v16+)
- Python 3.9+
- A Google Gemini API Key

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd API
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `API` folder and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The API will be available at http://127.0.0.1:8000. You can view the interactive documentation at http://127.0.0.1:8000/docs.*

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will typically be accessible at http://localhost:5173.*

## 📂 Project Structure

```text
Hack_The_Globe/
├── API/                        # FastAPI Backend
│   ├── app/                    # Application logic
│   │   ├── routes/             # API Endpoints (sessions, voice)
│   │   ├── services/           # AI services & Prompt building logic
│   ├── tests/                  # Backend unit tests
│   ├── main.py                 # FastAPI application entry point
│   ├── requirements.txt        # Python dependencies
│   └── README.md               # Backend-specific instructions
├── frontend/                   # React Frontend
│   ├── src/                    # Source code
│   │   ├── api/                # API client connection to backend
│   │   ├── components/         # Reusable React components
│   │   ├── context/            # React Context (e.g., ThemeContext)
│   │   ├── pages/              # Main application views (Scenario, Reflection, etc.)
│   │   ├── App.jsx             # Main React entry & routing
│   │   └── main.jsx            # React DOM mounting
│   ├── package.json            # Node dependencies and scripts
│   ├── vite.config.js          # Vite configuration
│   └── README.md               # Frontend-specific instructions
└── README.md                   # Project overview (this file)
```

## 🧪 Testing

The backend includes a suite of tests built with `pytest`.
To run the backend tests:
```bash
cd API
source venv/bin/activate
pytest -q
```

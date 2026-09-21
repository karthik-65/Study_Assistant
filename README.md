# AI Study Assistant 🎓🤖

An intelligent, interactive AI Study Assistant built with **FastAPI**, **LangChain**, **Google Gemini**, **MySQL**, and **React (Vite)**.

---

## ✨ Features

- **📄 Document RAG (Retrieval-Augmented Generation)**:
  - Upload PDF study materials or notes.
  - Chunked text processing with LangChain recursive character text splitters.
  - Hybrid confidence scoring for precise source attribution and citations.
- **💬 Dual-Mode Chat & Continuity**:
  - Contextual conversation continuity with pronoun resolution.
  - Open AI chat sessions for general queries.
  - Document-grounded chat with explicit out-of-context consent checks.
  - Voice speech recognition and text-to-speech audio narration.
- **📝 AI Quiz Generator**:
  - Automatically generates multiple-choice quizzes (MCQs) directly from uploaded course materials.
  - Configurable question count, difficulty levels, timer, and detailed explanations.
- **🔒 Authentication & History**:
  - JWT authentication and PBKDF2 password hashing.
  - Multi-user isolation for documents, chat sessions, and history stored in MySQL.
- **🎨 Modern Responsive UI**:
  - Clean glassmorphism design with Dark and Light mode support.
  - LaTeX math rendering with KaTeX.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, KaTeX, Lucide React
- **Backend**: FastAPI, Uvicorn, LangChain, LangChain Google GenAI, PyPDF
- **Database**: MySQL (users, documents, chat sessions, message history)
- **AI Model**: Google Gemini (`gemini-2.5-flash`)

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- MySQL Server (e.g., MySQL Community Server or XAMPP)

---

### 2. Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Create or edit `backend/.env`:
   ```bash
   nano .env
   ```
   Fill in your configuration:
   - `GEMINI_API_KEY`: Your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`: Your MySQL database credentials.
   - `JWT_SECRET`: A secure secret string for signing JWT tokens.

5. Start the backend server:
   ```bash
   python run.py
   ```
   The backend API will run at `http://localhost:8000`.

---

### 3. Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 🐳 Docker & AWS Cloud Deployment

Deploy the full stack with **Docker Compose** on an **AWS EC2 (Ubuntu)** instance connecting to **AWS RDS (MySQL)**:

```
                         USERS
                           │
                           │ HTTPS (443)
                           ▼
                    ┌─────────────┐
                    │   AWS EC2   │
                    │   Ubuntu    │
                    └──────┬──────┘
                           │
                         Docker
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
            React + Nginx       FastAPI
              Container        Container
              (Port 80)        (Port 8000)
                                    │
                                    │ MySQL (Port 3306)
                                    ▼
                              ┌───────────┐
                              │ AWS RDS   │
                              │   MySQL   │
                              └───────────┘
```

### Quick Run with Docker Compose:
1. Ensure your `backend/.env` is configured.
2. Build and launch containers:
   ```bash
   docker compose up -d --build
   ```
3. Access your application at `http://localhost` (or your EC2 IP).

👉 **For complete step-by-step instructions on AWS EC2, AWS RDS MySQL, and SSL/HTTPS setup, see [DEPLOYMENT_AWS.md](DEPLOYMENT_AWS.md).**

---

## 📂 Project Structure

```
Study Assistant/
├── backend/
│   ├── app/
│   │   ├── auth.py          # JWT authentication & password hashing
│   │   ├── db.py            # MySQL database connection & CRUD operations
│   │   ├── main.py          # FastAPI application & endpoints
│   │   ├── pdf_processor.py # PDF extraction & document chunking
│   │   └── rag_service.py   # LangChain RAG & Gemini quiz generation
│   ├── requirements.txt     # Python backend dependencies
│   └── run.py               # Backend entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/        # Login & registration modals
│   │   │   ├── Chat/        # Chat interface with KaTeX & speech tools
│   │   │   ├── Documents/   # Document upload & management sidebar
│   │   │   ├── Quiz/        # Interactive AI quiz generator & reviewer
│   │   │   ├── Sidebar/     # Left navigation & chat session manager
│   │   │   └── Navbar.jsx   # Top header navigation & theme toggler
│   │   ├── services/
│   │   │   └── api.js       # Backend API client
│   │   ├── styles/
│   │   │   └── index.css    # Core styling & design system
│   │   ├── App.jsx          # Main application component
│   │   └── main.jsx         # React root
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

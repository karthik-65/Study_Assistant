from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.pdf_processor import DocumentProcessor
from app.rag_service import LangChainRAGStore
from app.db import (
    init_db,
    save_document_db,
    get_all_documents_db,
    delete_document_db,
    save_message_db,
    get_messages_db,
    clear_messages_db,
    save_open_chat_session_db,
    get_open_chat_sessions_db,
    delete_open_chat_session_db,
    create_user_db,
    get_user_by_email_db,
    get_user_by_username_db,
    get_user_by_id_db
)
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_optional,
    get_current_user_required
)

app = FastAPI(title="Study Assistant LangChain RAG Backend API with MySQL & Auth", version="3.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

processor = DocumentProcessor()
rag_store = LangChainRAGStore()

# ----------------- Models -----------------

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    identifier: str  # Can be username or email
    password: str

class QueryRequest(BaseModel):
    query: str
    subject: Optional[str] = "all"
    filename: Optional[str] = None
    top_k: Optional[int] = 4
    allow_general: Optional[bool] = False
    chat_history: Optional[List[Dict[str, Any]]] = []

class SaveMessageRequest(BaseModel):
    id: str
    doc_key: str
    sender: str
    text: str
    sources: Optional[List[Dict[str, Any]]] = []
    type: Optional[str] = None
    fileData: Optional[Dict[str, Any]] = None

class ClearHistoryRequest(BaseModel):
    doc_key: str

class OpenChatSessionRequest(BaseModel):
    session_id: str
    title: str

class QuizGenerateRequest(BaseModel):
    filename: str
    num_questions: Optional[int] = 10
    difficulty: Optional[str] = "Medium"

# ----------------- Auth Routes -----------------

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    username = req.username.strip()
    email = req.email.strip().lower()
    password = req.password

    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long")
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address")
    if not password or len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    # Check if user already exists
    if get_user_by_email_db(email):
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    if get_user_by_username_db(username):
        raise HTTPException(status_code=400, detail="Username is already taken")

    # Hash password and store in MySQL
    pwd_hash = hash_password(password)
    user = create_user_db(username, email, pwd_hash)
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create user account")

    token = create_access_token({"sub": str(user["id"]), "username": user["username"], "email": user["email"]})
    return {
        "status": "success",
        "message": "Account created successfully",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "created_at": str(user["created_at"])
        }
    }

@app.post("/api/auth/login")
def login(req: LoginRequest):
    identifier = req.identifier.strip()
    password = req.password

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Please provide both identifier and password")

    user = None
    if "@" in identifier:
        user = get_user_by_email_db(identifier.lower())
    else:
        user = get_user_by_username_db(identifier)

    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    token = create_access_token({"sub": str(user["id"]), "username": user["username"], "email": user["email"]})
    return {
        "status": "success",
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "created_at": str(user["created_at"])
        }
    }

@app.get("/api/auth/me")
def get_current_user_profile(user_payload: Dict[str, Any] = Depends(get_current_user_required)):
    user_id = int(user_payload["sub"])
    user = get_user_by_id_db(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "status": "success",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "created_at": str(user["created_at"])
        }
    }

# ----------------- Document & Chat Routes -----------------

@app.get("/")
def read_root():
    return {
        "message": "AI Study Assistant LangChain RAG API with MySQL & Auth",
        "framework": "LangChain + FastAPI + Google Gemini + MySQL",
        "status": "running",
        "docs_count": len(rag_store.get_documents())
    }

@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    subject: str = Form("General"),
    user_payload: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    try:
        user_id = int(user_payload["sub"]) if user_payload and "sub" in user_payload else None
        content = await file.read()
        filename = file.filename
        if filename.endswith(".pdf"):
            docs = processor.process_pdf(content, filename, subject)
            total_pages = max([d.metadata.get("page", 1) for d in docs]) if docs else 1
        else:
            text = content.decode("utf-8", errors="ignore")
            docs = processor.process_raw_text(text, filename, subject)
            total_pages = 1

        rag_store.add_documents(filename, subject, total_pages, docs)

        # Save to MySQL Database
        chunk_dicts = [
            {
                "text": d.page_content,
                "page": d.metadata.get("page", 1),
                "word_count": d.metadata.get("word_count", len(d.page_content.split()))
            }
            for d in docs
        ]
        save_document_db(filename, subject, total_pages, chunk_dicts, user_id=user_id)

        return {
            "status": "success",
            "filename": filename,
            "subject": subject,
            "chunks_created": len(docs),
            "total_pages": total_pages
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/query")
def query_rag(req: QueryRequest):
    result = rag_store.run_langchain_rag_chain(
        query=req.query,
        subject_filter=req.subject,
        filename_filter=req.filename,
        allow_general=req.allow_general or False,
        chat_history=req.chat_history or []
    )

    return {
        "query": req.query,
        "answerText": result["answerText"],
        "sources": result["sources"],
        "consentRequired": result.get("consentRequired", False),
        "retrieved_docs_count": result.get("retrieved_docs_count", 0)
    }

@app.get("/api/documents")
def get_documents(user_payload: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    user_id = int(user_payload["sub"]) if user_payload and "sub" in user_payload else None
    mysql_docs = get_all_documents_db(user_id=user_id)
    # If MySQL returns records, sync/return them
    if mysql_docs:
        return {"documents": mysql_docs}
    return {"documents": rag_store.get_documents()}

@app.delete("/api/documents/{filename:path}")
def delete_document(filename: str, user_payload: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    user_id = int(user_payload["sub"]) if user_payload and "sub" in user_payload else None
    delete_document_db(filename, user_id=user_id)
    rag_store.delete_document(filename)
    return {"status": "success"}

@app.get("/api/chunks")
def get_chunks(filename: str):
    return {"chunks": rag_store.get_chunks_for_document(filename)}

@app.get("/api/history")
def get_history(doc_key: str = "all", user_payload: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    user_id = int(user_payload["sub"]) if user_payload and "sub" in user_payload else None
    messages = get_messages_db(doc_key, user_id=user_id)
    return {"doc_key": doc_key, "messages": messages}

@app.post("/api/history")
def save_history_msg(req: SaveMessageRequest, user_payload: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    user_id = int(user_payload["sub"]) if user_payload and "sub" in user_payload else None
    save_message_db(req.id, req.doc_key, req.sender, req.text, req.sources, req.type, req.fileData, user_id=user_id)
    return {"status": "success"}

@app.post("/api/history/clear")
def clear_history(req: ClearHistoryRequest, user_payload: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    user_id = int(user_payload["sub"]) if user_payload and "sub" in user_payload else None
    clear_messages_db(req.doc_key, user_id=user_id)
    return {"status": "success"}

@app.get("/api/open_chats")
def get_open_chats(user_payload: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    user_id = int(user_payload["sub"]) if user_payload and "sub" in user_payload else None
    sessions = get_open_chat_sessions_db(user_id=user_id)
    return {"sessions": sessions}

@app.post("/api/open_chats")
def save_open_chat(req: OpenChatSessionRequest, user_payload: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    user_id = int(user_payload["sub"]) if user_payload and "sub" in user_payload else None
    save_open_chat_session_db(req.session_id, req.title, user_id=user_id)
    return {"status": "success"}

@app.delete("/api/open_chats/{session_id}")
def delete_open_chat(session_id: str, user_payload: Optional[Dict[str, Any]] = Depends(get_current_user_optional)):
    user_id = int(user_payload["sub"]) if user_payload and "sub" in user_payload else None
    delete_open_chat_session_db(session_id, user_id=user_id)
    return {"status": "success"}

@app.post("/api/quiz/generate")
def generate_quiz_endpoint(req: QuizGenerateRequest):
    try:
        result = rag_store.generate_quiz(
            filename=req.filename,
            num_questions=req.num_questions or 10,
            difficulty=req.difficulty or "Medium"
        )
        return result
    except Exception as e:
        print("Quiz endpoint error:", e)
        return {"status": "error", "message": f"Quiz generation error: {str(e)}"}

import os
import json
from typing import List, Dict, Any, Optional
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

# MySQL Database Configuration
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "study_assistant")

def get_server_connection():
    """Connect to MySQL server (without selecting database) to allow auto-creating database if needed."""
    return mysql.connector.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        autocommit=True
    )

def get_db_connection():
    """Connect directly to the application database."""
    try:
        return mysql.connector.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            autocommit=True
        )
    except mysql.connector.Error as err:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=500,
            detail=f"MySQL connection error: {err.msg}. Please check MYSQL_USER / MYSQL_PASSWORD in backend/.env"
        )

def init_db():
    """Initialize the MySQL database and create required tables."""
    try:
        # Step 1: Ensure database exists
        server_conn = get_server_connection()
        cursor = server_conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        cursor.close()
        server_conn.close()

        # Step 2: Ensure all tables exist in the database
        conn = get_db_connection()
        cursor = conn.cursor()

        # Users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Documents table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            filename VARCHAR(255) NOT NULL,
            subject VARCHAR(150),
            total_pages INT DEFAULT 1,
            chunks_count INT DEFAULT 0,
            chunks_json LONGTEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_doc (user_id, filename)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Open chat sessions table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS open_chat_sessions (
            session_id VARCHAR(150) PRIMARY KEY,
            user_id INT NULL,
            title VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_sessions (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        # Chat messages table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id VARCHAR(150) PRIMARY KEY,
            user_id INT NULL,
            doc_key VARCHAR(255) NOT NULL,
            sender VARCHAR(50) NOT NULL,
            text LONGTEXT NOT NULL,
            sources_json LONGTEXT,
            msg_type VARCHAR(50),
            file_data_json LONGTEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_key (user_id, doc_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        cursor.close()
        conn.close()
        print(f"[DATABASE] MySQL successfully connected and initialized on database '{MYSQL_DATABASE}'.")
    except mysql.connector.Error as err:
        print(f"[DATABASE ERROR] MySQL connection failed: {err}")
        print(f"[DATABASE HINT] Please check MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD in backend/.env")

# ----------------- User Management Functions -----------------

def create_user_db(username: str, email: str, password_hash: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            INSERT INTO users (username, email, password_hash)
            VALUES (%s, %s, %s)
        """, (username, email, password_hash))
        user_id = cursor.lastrowid
        cursor.execute("SELECT id, username, email, created_at FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        return user
    finally:
        cursor.close()
        conn.close()

def get_user_by_email_db(email: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

def get_user_by_username_db(username: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

def get_user_by_id_db(user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, username, email, created_at FROM users WHERE id = %s", (user_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

# ----------------- Document Storage Functions -----------------

def save_document_db(filename: str, subject: str, total_pages: int, chunks: List[Dict[str, Any]], user_id: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    chunks_json = json.dumps(chunks)
    try:
        if user_id is not None:
            cursor.execute("SELECT id FROM documents WHERE filename = %s AND user_id = %s", (filename, user_id))
        else:
            cursor.execute("SELECT id FROM documents WHERE filename = %s AND user_id IS NULL", (filename,))
        row = cursor.fetchone()

        if row:
            cursor.execute("""
                UPDATE documents 
                SET subject = %s, total_pages = %s, chunks_count = %s, chunks_json = %s, created_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (subject, total_pages, len(chunks), chunks_json, row[0]))
        else:
            cursor.execute("""
                INSERT INTO documents (filename, subject, total_pages, chunks_count, chunks_json, user_id)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (filename, subject, total_pages, len(chunks), chunks_json, user_id))
    finally:
        cursor.close()
        conn.close()

def get_all_documents_db(user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_id is not None:
            cursor.execute("""
                SELECT filename, subject, total_pages, chunks_count, chunks_json 
                FROM documents 
                WHERE user_id = %s OR user_id IS NULL
                ORDER BY created_at DESC
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT filename, subject, total_pages, chunks_count, chunks_json 
                FROM documents 
                ORDER BY created_at DESC
            """)
        rows = cursor.fetchall()
        docs = []
        for r in rows:
            docs.append({
                "doc_id": r[0],
                "title": r[0],
                "subject": r[1],
                "totalPages": r[2],
                "chunks_count": r[3],
                "chunks": json.loads(r[4]) if r[4] else []
            })
        return docs
    finally:
        cursor.close()
        conn.close()

def delete_document_db(filename: str, user_id: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_id is not None:
            cursor.execute("DELETE FROM documents WHERE filename = %s AND (user_id = %s OR user_id IS NULL)", (filename, user_id))
            cursor.execute("DELETE FROM chat_messages WHERE doc_key = %s AND (user_id = %s OR user_id IS NULL)", (filename, user_id))
        else:
            cursor.execute("DELETE FROM documents WHERE filename = %s", (filename,))
            cursor.execute("DELETE FROM chat_messages WHERE doc_key = %s", (filename,))
    finally:
        cursor.close()
        conn.close()

# ----------------- Open Chat Sessions Functions -----------------

def save_open_chat_session_db(session_id: str, title: str, user_id: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO open_chat_sessions (session_id, user_id, title)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE title = VALUES(title), updated_at = CURRENT_TIMESTAMP
        """, (session_id, user_id, title))
    finally:
        cursor.close()
        conn.close()

def get_open_chat_sessions_db(user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_id is not None:
            cursor.execute("""
                SELECT s.session_id, s.title, s.created_at, s.updated_at, COUNT(m.id) as msg_count
                FROM open_chat_sessions s
                LEFT JOIN chat_messages m ON m.doc_key = s.session_id
                WHERE s.user_id = %s OR s.user_id IS NULL
                GROUP BY s.session_id, s.title, s.created_at, s.updated_at
                ORDER BY s.updated_at DESC
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT s.session_id, s.title, s.created_at, s.updated_at, COUNT(m.id) as msg_count
                FROM open_chat_sessions s
                LEFT JOIN chat_messages m ON m.doc_key = s.session_id
                GROUP BY s.session_id, s.title, s.created_at, s.updated_at
                ORDER BY s.updated_at DESC
            """)
        rows = cursor.fetchall()
        sessions = []
        for r in rows:
            sessions.append({
                "session_id": r[0],
                "title": r[1],
                "created_at": str(r[2]),
                "updated_at": str(r[3]),
                "msg_count": r[4]
            })
        return sessions
    finally:
        cursor.close()
        conn.close()

def delete_open_chat_session_db(session_id: str, user_id: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_id is not None:
            cursor.execute("DELETE FROM open_chat_sessions WHERE session_id = %s AND (user_id = %s OR user_id IS NULL)", (session_id, user_id))
            cursor.execute("DELETE FROM chat_messages WHERE doc_key = %s AND (user_id = %s OR user_id IS NULL)", (session_id, user_id))
        else:
            cursor.execute("DELETE FROM open_chat_sessions WHERE session_id = %s", (session_id,))
            cursor.execute("DELETE FROM chat_messages WHERE doc_key = %s", (session_id,))
    finally:
        cursor.close()
        conn.close()

# ----------------- Chat Messages Functions -----------------

def save_message_db(
    msg_id: str,
    doc_key: str,
    sender: str,
    text: str,
    sources: List[Dict[str, Any]] = None,
    msg_type: str = None,
    file_data: Dict[str, Any] = None,
    user_id: Optional[int] = None
):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO chat_messages (id, user_id, doc_key, sender, text, sources_json, msg_type, file_data_json)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                sender = VALUES(sender),
                text = VALUES(text),
                sources_json = VALUES(sources_json),
                msg_type = VALUES(msg_type),
                file_data_json = VALUES(file_data_json)
        """, (
            msg_id,
            user_id,
            doc_key,
            sender,
            text,
            json.dumps(sources) if sources else "[]",
            msg_type,
            json.dumps(file_data) if file_data else None
        ))
    finally:
        cursor.close()
        conn.close()

def get_messages_db(doc_key: str, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_id is not None:
            cursor.execute("""
                SELECT id, sender, text, sources_json, msg_type, file_data_json, timestamp 
                FROM chat_messages 
                WHERE doc_key = %s AND (user_id = %s OR user_id IS NULL)
                ORDER BY timestamp ASC
            """, (doc_key, user_id))
        else:
            cursor.execute("""
                SELECT id, sender, text, sources_json, msg_type, file_data_json, timestamp 
                FROM chat_messages 
                WHERE doc_key = %s 
                ORDER BY timestamp ASC
            """, (doc_key,))
        rows = cursor.fetchall()
        messages = []
        for r in rows:
            messages.append({
                "id": r[0],
                "sender": r[1],
                "text": r[2],
                "sources": json.loads(r[3]) if r[3] else [],
                "type": r[4],
                "fileData": json.loads(r[5]) if r[5] else None,
                "timestamp": str(r[6])
            })
        return messages
    finally:
        cursor.close()
        conn.close()

def clear_messages_db(doc_key: str, user_id: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if user_id is not None:
            cursor.execute("DELETE FROM chat_messages WHERE doc_key = %s AND (user_id = %s OR user_id IS NULL)", (doc_key, user_id))
        else:
            cursor.execute("DELETE FROM chat_messages WHERE doc_key = %s", (doc_key,))
    finally:
        cursor.close()
        conn.close()

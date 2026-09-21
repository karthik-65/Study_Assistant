import os
import hashlib
import secrets
import time
from typing import Optional, Dict, Any
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "study_assistant_default_secure_secret_key_2026")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_SECONDS = 60 * 60 * 24 * 7  # 7 days

security_bearer = HTTPBearer(auto_error=False)

# Try importing jwt, provide secure fallback if not installed
try:
    import jwt
    HAS_PYJWT = True
except ImportError:
    HAS_PYJWT = False

# ----------------- Password Hashing (PBKDF2-HMAC-SHA256) -----------------

def hash_password(password: str) -> str:
    """Hash password securely using PBKDF2 with SHA256 and a random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored salt$hash."""
    try:
        if not hashed_password or '$' not in hashed_password:
            return False
        salt, expected_hex = hashed_password.split('$', 1)
        key = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return secrets.compare_digest(key.hex(), expected_hex)
    except Exception:
        return False

# ----------------- JWT Token Functions -----------------

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = int(time.time()) + TOKEN_EXPIRE_SECONDS
    to_encode.update({"exp": expire})
    
    if HAS_PYJWT:
        return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    else:
        # Fallback JSON + HMAC-SHA256 signature
        import json
        import base64
        import hmac
        payload_str = json.dumps(to_encode, separators=(',', ':'))
        payload_b64 = base64.urlsafe_b64encode(payload_str.encode()).decode().rstrip('=')
        signature = hmac.new(JWT_SECRET.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        return f"{payload_b64}.{signature}"

def decode_access_token(token: str) -> Optional[dict]:
    try:
        if HAS_PYJWT:
            return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        else:
            import json
            import base64
            import hmac
            parts = token.split('.')
            if len(parts) != 2:
                return None
            payload_b64, signature = parts
            expected_sig = hmac.new(JWT_SECRET.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
            if not secrets.compare_digest(signature, expected_sig):
                return None
            # Re-pad b64 if needed
            padded = payload_b64 + '=' * (4 - len(payload_b64) % 4)
            payload = json.loads(base64.urlsafe_b64decode(padded).decode())
            if payload.get("exp", 0) < time.time():
                return None
            return payload
    except Exception:
        return None

# ----------------- FastAPI Dependency -----------------

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
) -> Optional[Dict[str, Any]]:
    """Extract user payload from token if present, returns None if anonymous."""
    if not credentials or not credentials.credentials:
        return None
    token = credentials.credentials
    payload = decode_access_token(token)
    return payload

def get_current_user_required(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
) -> Dict[str, Any]:
    """Requires valid JWT token, raises 401 if missing or invalid."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Pydantic Models
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

class TokenResponse(BaseModel):
    user: UserResponse
    accessToken: str
    refreshToken: str

class RefreshTokenRequest(BaseModel):
    refreshToken: str

# Demo users - matching the Express.js backend data
DEMO_USERS = [
    {
        "id": "1",
        "name": "Admin User",
        "email": "admin@lumaa.ai",
        "role": "admin",
        "isActive": True
    },
    {
        "id": "2", 
        "name": "Regular User",
        "email": "user@lumaa.ai",
        "role": "user",
        "isActive": True
    }
]

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_email is None or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Find user
    user = next((u for u in DEMO_USERS if u["email"] == user_email), None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def authenticate_user(email: str, password: str):
    # Find user by email
    user = next((u for u in DEMO_USERS if u["email"] == email), None)
    
    if not user:
        return False
    
    if not user["isActive"]:
        return False
    
    # Simplified password check - any password = "pass"
    if password != "pass":
        return False
        
    return user

def generate_tokens(user: dict):
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": user["email"]})
    
    return access_token, refresh_token
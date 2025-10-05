from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime
from auth import UserLogin, TokenResponse, RefreshTokenRequest, authenticate_user_pg, generate_tokens, verify_token, UserResponse
from postgres_db import PostgreSQLManager, initialize_demo_data as initialize_demo_data_pg
from api_routes import router as api_routes
from models import *


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# PostgreSQL connection
database_url = os.environ.get('DATABASE_URL', 'postgresql+psycopg2://postgres:callbot123@51.112.135.78:5432/callbotdb')

# Initialize PostgreSQL database manager
pg_db_manager = PostgreSQLManager(database_url)

# Create the main app
app = FastAPI(title="Lumaa AI API", version="1.0.0")

# Create a router with the /api prefix for legacy endpoints
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World - PostgreSQL"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    # For now, just return the status without storing
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    return status_obj

# Legacy authentication routes (keeping for backward compatibility)
@api_router.post("/auth/refresh")
async def refresh_token(request: RefreshTokenRequest):
    # This is a simplified refresh - in production you'd verify the refresh token
    # For demo purposes, we'll just return an error asking to login again
    raise HTTPException(
        status_code=401,
        detail="Please login again"
    )

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Return empty list for now
    return []

# Include routers in the main app
app.include_router(api_router)  # Legacy routes
app.include_router(api_routes)  # New comprehensive API routes

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    try:
        # Create PostgreSQL tables
        pg_db_manager.create_tables()
        logger.info("PostgreSQL tables created successfully")
        
        # Initialize demo data
        await initialize_demo_data_pg(pg_db_manager)
        logger.info("PostgreSQL demo data initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize PostgreSQL database: {e}")
        logger.exception(e)

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down application")

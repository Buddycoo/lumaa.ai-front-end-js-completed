from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
import csv
import io
from models import *
from postgres_db import PostgreSQLManager
from auth import verify_token_pg, generate_tokens, UserLogin

router = APIRouter(prefix="/api")

# Dependency injection for PostgreSQL database
async def get_pg_db_manager() -> PostgreSQLManager:
    from server import pg_db_manager
    return pg_db_manager

# Dependency for current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    user_data = await verify_token_pg(pg_db_manager, credentials)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return user_data

# Dependency for admin only
async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Authentication endpoints
@router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)):
    user = await pg_db_manager.authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials - use password: pass")
    
    # Check if user is blocked
    if user.get("status") == "blocked":
        raise HTTPException(status_code=401, detail="You have been blocked by the admin. Please contact support.")
    
    access_token, refresh_token = generate_tokens(user)
    
    return TokenResponse(
        user=UserResponse(
            id=user["id"],
            name=user["name"], 
            email=user["email"],
            role=user["role"],
            category=user.get("category", "sales"),
            status=user.get("status", "active"),
            minutes_used=user.get("min_used", 0),
            minutes_allocated=user.get("min_subscribed", 1000),
            revenue_generated=user.get("revenue_generated", 0.0),
            created_at=user.get("created_at")
        ),
        accessToken=access_token,
        refreshToken=refresh_token
    )

@router.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    from datetime import datetime, timezone
    
    # Calculate days until billing
    next_billing = current_user.get("next_billing_date")
    if next_billing:
        if isinstance(next_billing, str):
            from datetime import datetime
            next_billing = datetime.fromisoformat(next_billing.replace('Z', '+00:00'))
        elif hasattr(next_billing, 'replace') and next_billing.tzinfo is None:
            # Make naive datetime timezone-aware
            next_billing = next_billing.replace(tzinfo=timezone.utc)
        
        days_until_billing = max(0, (next_billing - datetime.now(timezone.utc)).days)
    else:
        days_until_billing = 0
    
    user_data = current_user.copy()
    user_data["days_until_billing"] = days_until_billing
    
    if current_user.get("role") == "admin":
        return AdminUserResponse(**user_data)
    else:
        # Remove revenue for regular users
        user_data.pop("revenue_generated", None)
        return UserDashboardResponse(**user_data)

# PIN verification
@router.post("/auth/verify-pin")
async def verify_pin(
    request: PinVerificationRequest,
    current_user: dict = Depends(get_current_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    is_valid = await pg_db_manager.verify_user_pin(current_user["id"], request.pin)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid PIN")
    return {"message": "PIN verified successfully"}

# User management endpoints (Admin only)
@router.get("/admin/users", response_model=List[AdminUserResponse])
async def get_all_users(
    admin_user: dict = Depends(get_admin_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    users = await pg_db_manager.get_all_users(include_admins=False)
    return [AdminUserResponse(**user) for user in users]

@router.post("/admin/users", response_model=dict)
async def create_user(
    user_data: UserCreateRequest,
    admin_user: dict = Depends(get_admin_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    try:
        user_id = await pg_db_manager.create_user(user_data.dict(), created_by=admin_user["id"])
        return {"message": "User created successfully", "user_id": user_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/admin/users/{user_id}", response_model=dict)
async def update_user(
    user_id: str,
    update_data: UserUpdateRequest,
    admin_user: dict = Depends(get_admin_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    success = await pg_db_manager.update_user(user_id, update_data.dict(exclude_unset=True))
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated successfully"}

@router.post("/admin/users/{user_id}/pause", response_model=dict)
async def pause_user(
    user_id: str,
    admin_user: dict = Depends(get_admin_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    from database_models import UserStatus
    success = await pg_db_manager.update_user_status(user_id, UserStatus.PAUSED, admin_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User paused successfully"}

@router.post("/admin/users/{user_id}/resume", response_model=dict)
async def resume_user(
    user_id: str,
    admin_user: dict = Depends(get_admin_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    from database_models import UserStatus
    success = await pg_db_manager.update_user_status(user_id, UserStatus.ACTIVE, admin_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User resumed successfully"}

@router.get("/admin/overview", response_model=AdminOverviewResponse)
async def get_admin_overview(
    admin_user: dict = Depends(get_admin_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    users = await pg_db_manager.get_all_users(include_admins=False)
    
    total_revenue = sum(user.get("revenue_generated", 0.0) for user in users)
    total_minutes_used = sum(user.get("min_used", 0) for user in users)
    total_users = len(users)
    active_users = len([u for u in users if u.get("status") == "active"])
    
    # Get top users by revenue
    sorted_users = sorted(users, key=lambda x: x.get("revenue_generated", 0.0), reverse=True)
    top_users = [
        TopUserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            revenue=user.get("revenue_generated", 0.0),
            minutes_used=user.get("min_used", 0),
            category=user.get("category", "sales")
        )
        for user in sorted_users[:5]
    ]
    
    return AdminOverviewResponse(
        total_revenue=total_revenue,
        total_minutes_used=total_minutes_used,
        total_users=total_users,
        active_users=active_users,
        top_users=top_users
    )

# Bot Settings endpoints (Admin)
@router.get("/admin/bot-settings/{category}", response_model=BotSettingsResponse)
async def get_category_bot_settings(
    category: str,
    admin_user: dict = Depends(get_admin_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    from database_models import UserCategory
    settings = await pg_db_manager.get_category_bot_settings(UserCategory(category))
    if not settings:
        raise HTTPException(status_code=404, detail="Bot settings not found")
    return BotSettingsResponse(**settings)

@router.put("/admin/bot-settings/{category}", response_model=dict)
async def update_category_bot_settings(
    category: str,
    settings_data: AdminBotSettingsUpdateRequest,
    admin_user: dict = Depends(get_admin_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    from database_models import UserCategory
    success = await pg_db_manager.update_category_bot_settings(
        UserCategory(category),
        settings_data.dict(exclude_unset=True),
        admin_user["id"]
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update bot settings")
    return {"message": "Bot settings updated successfully"}

# User endpoints
@router.get("/user/bot-settings", response_model=UserBotSettingsResponse)
async def get_user_bot_settings(
    current_user: dict = Depends(get_current_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    settings = await pg_db_manager.get_user_bot_settings(current_user["id"])
    if not settings:
        raise HTTPException(status_code=404, detail="Bot settings not found")
    return UserBotSettingsResponse(**settings)

@router.put("/user/bot-settings", response_model=dict)
async def update_user_bot_settings(
    settings_data: UserBotSettingsUpdateRequest,
    current_user: dict = Depends(get_current_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    success = await pg_db_manager.update_user_bot_settings(
        current_user["id"],
        settings_data.dict(exclude_unset=True)
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update bot settings")
    return {"message": "Bot settings updated successfully"}

# Call logs
@router.get("/user/call-logs", response_model=List[CallLogResponse])
async def get_user_call_logs(
    current_user: dict = Depends(get_current_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    call_logs = await pg_db_manager.get_user_call_logs(current_user["id"])
    return [CallLogResponse(**log) for log in call_logs]

@router.get("/admin/call-logs", response_model=List[AdminCallLogResponse])
async def get_all_call_logs(
    admin_user: dict = Depends(get_admin_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    call_logs = await pg_db_manager.get_all_call_logs()
    return [AdminCallLogResponse(**log) for log in call_logs]

# Leads management
@router.get("/user/leads", response_model=List[LeadResponse])
async def get_user_leads(
    current_user: dict = Depends(get_current_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    leads = await pg_db_manager.get_user_leads(current_user["id"])
    return [LeadResponse(**lead) for lead in leads]

@router.post("/user/leads", response_model=dict)
async def create_lead(
    lead_data: LeadCreateRequest,
    current_user: dict = Depends(get_current_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    # Check if user is in sales category
    if current_user.get("category") != "sales":
        raise HTTPException(status_code=403, detail="Lead upload is only available for sales category")
    
    lead_id = await pg_db_manager.create_lead(current_user["id"], lead_data.dict())
    return {"message": "Lead created successfully", "lead_id": lead_id}

@router.post("/user/leads/upload-csv", response_model=dict)
async def upload_leads_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    pg_db_manager: PostgreSQLManager = Depends(get_pg_db_manager)
):
    # Check if user is in sales category
    if current_user.get("category") != "sales":
        raise HTTPException(status_code=403, detail="CSV upload is only available for sales category")
    
    # Read CSV file
    contents = await file.read()
    decoded = contents.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(decoded))
    
    leads_data = []
    for row in csv_reader:
        leads_data.append({
            "name": row.get("name", ""),
            "phone": row.get("phone", ""),
            "email": row.get("email"),
            "company": row.get("company"),
            "notes": row.get("notes")
        })
    
    if not leads_data:
        raise HTTPException(status_code=400, detail="No valid leads found in CSV")
    
    lead_ids = await pg_db_manager.bulk_create_leads(current_user["id"], leads_data)
    return {"message": f"{len(lead_ids)} leads uploaded successfully", "lead_ids": lead_ids}

# System status
@router.get("/system/status")
async def get_system_status():
    return {"status": "operational", "database": "PostgreSQL"}
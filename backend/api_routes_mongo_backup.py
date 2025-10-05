from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
import csv
import io
from models import *
from database import DatabaseManager
from auth import verify_token, generate_tokens, UserLogin

router = APIRouter(prefix="/api")

# Dependency injection for database
async def get_db_manager() -> DatabaseManager:
    from server import db_manager
    return db_manager

# Dependency for current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    # This will use the existing verify_token logic but integrate with new database
    user_data = verify_token(credentials)  # From existing auth.py
    user = await db_manager.get_user_by_email(user_data["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Dependency for admin only
async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Authentication endpoints (keeping existing)
@router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db_manager: DatabaseManager = Depends(get_db_manager)):
    user = await db_manager.authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials - use password: pass")
    
    # Check if user is blocked
    if user.get("status") == UserStatus.BLOCKED:
        raise HTTPException(status_code=401, detail="You have been blocked by the admin. Please contact support.")
    
    # Check global pause
    system_settings = await db_manager.get_system_settings()
    if system_settings.get("is_global_paused", False) and user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=503, detail="System is currently paused for maintenance")
    
    access_token, refresh_token = generate_tokens(user)
    
    return TokenResponse(
        user=UserResponse(
            id=user["id"],
            name=user["name"], 
            email=user["email"],
            role=user["role"],
            category=user["category"],
            status=user["status"],
            minutes_used=user["minutes_used"],
            minutes_allocated=user["minutes_allocated"],
            revenue_generated=user["revenue_generated"],
            created_at=user["created_at"]
        ),
        accessToken=access_token,
        refreshToken=refresh_token
    )

@router.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") == UserRole.ADMIN:
        return AdminUserResponse(**current_user)
    else:
        # Remove revenue for regular users
        user_data = current_user.copy()
        user_data.pop("revenue_generated", None)
        return UserDashboardResponse(**user_data)

# PIN verification
@router.post("/auth/verify-pin")
async def verify_pin(
    request: PinVerificationRequest,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    is_valid = await db_manager.verify_user_pin(current_user["id"], request.pin)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid PIN")
    return {"message": "PIN verified successfully"}

# User management endpoints (Admin only)
@router.get("/admin/users", response_model=List[AdminUserResponse])
async def get_all_users(
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    users = await db_manager.get_all_users(include_admins=False)
    return [AdminUserResponse(**user) for user in users]

@router.post("/admin/users")
async def create_user(
    user_data: UserCreateRequest,
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    # Check if user already exists
    existing = await db_manager.get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    user_id = await db_manager.create_user(user_data, created_by=admin_user["id"])
    return {"message": "User created successfully", "user_id": user_id}

@router.put("/admin/users/{user_id}")
async def update_user(
    user_id: str,
    update_data: UserUpdateRequest,
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    user = await db_manager.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    success = await db_manager.update_user(user_id, update_data)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update user")
    
    return {"message": "User updated successfully"}

@router.post("/admin/users/{user_id}/pause")
async def pause_user(
    user_id: str,
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    success = await db_manager.update_user_status(user_id, UserStatus.BLOCKED, admin_user["id"])
    if not success:
        raise HTTPException(status_code=400, detail="Failed to pause user")
    
    return {"message": "User paused successfully"}

@router.post("/admin/users/{user_id}/resume")
async def resume_user(
    user_id: str,
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    success = await db_manager.update_user_status(user_id, UserStatus.ACTIVE, admin_user["id"])
    if not success:
        raise HTTPException(status_code=400, detail="Failed to resume user")
    
    return {"message": "User resumed successfully"}

@router.post("/admin/pause-all")
async def pause_all_users(
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    success = await db_manager.set_global_pause(True, admin_user["id"])
    return {"message": "All users paused successfully"}

@router.post("/admin/resume-all")
async def resume_all_users(
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    success = await db_manager.set_global_pause(False, admin_user["id"])
    return {"message": "All users resumed successfully"}

@router.get("/admin/overview", response_model=AdminOverviewResponse)
async def get_admin_overview(
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    overview = await db_manager.get_admin_overview()
    return AdminOverviewResponse(**overview)

# Bot settings endpoints
@router.get("/admin/bot-settings/{category}")
async def get_category_bot_settings(
    category: UserCategory,
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    settings = await db_manager.get_category_bot_settings(category)
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found for this category")
    return settings

@router.put("/admin/bot-settings/{category}")
async def update_category_bot_settings(
    category: UserCategory,
    settings_data: AdminBotSettingsUpdateRequest,
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    success = await db_manager.update_category_bot_settings(category, settings_data, admin_user["id"])
    return {"message": "Bot settings updated successfully"}

# User bot settings
@router.get("/user/bot-settings")
async def get_user_bot_settings(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    # Get user-specific settings first, then fall back to category defaults
    user_settings = await db_manager.get_user_bot_settings(current_user["id"])
    category_settings = await db_manager.get_category_bot_settings(current_user["category"])
    
    if user_settings:
        return {
            "opening_message": user_settings["opening_message"],
            "prompt": user_settings["prompt"],
            "model": category_settings["model"] if category_settings else "gpt-4",
            "temperature": category_settings["temperature"] if category_settings else 0.7
        }
    elif category_settings:
        return {
            "opening_message": category_settings["opening_message"],
            "prompt": category_settings["prompt"],
            "model": category_settings["model"],
            "temperature": category_settings["temperature"]
        }
    else:
        # Default fallback
        return {
            "opening_message": "Hello! How can I help you today?",
            "prompt": "You are a helpful AI assistant.",
            "model": "gpt-4",
            "temperature": 0.7
        }

@router.put("/user/bot-settings")
async def update_user_bot_settings(
    settings_data: BotSettingsUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    success = await db_manager.update_user_bot_settings(current_user["id"], settings_data)
    return {"message": "Bot settings updated successfully"}

# Call logs
@router.get("/user/call-logs", response_model=List[CallLogResponse])
async def get_user_call_logs(
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    call_logs = await db_manager.get_user_call_logs(current_user["id"], limit)
    return [CallLogResponse(**log) for log in call_logs]

# CSV Lead upload (Sales category only, PIN protected)
@router.post("/user/upload-leads", response_model=CSVUploadResponse)
async def upload_leads_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    # Check if user is in sales category
    if current_user.get("category") != UserCategory.SALES:
        raise HTTPException(status_code=403, detail="Lead upload is only available for Sales category users")
    
    # Verify file is CSV
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Read CSV content
        content = await file.read()
        csv_content = content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        leads_data = []
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 for header
            # Validate required fields
            if not row.get('name') or not row.get('phone'):
                errors.append(f"Row {row_num}: Missing required fields (name, phone)")
                continue
                
            lead_data = {
                "name": row['name'].strip(),
                "phone": row['phone'].strip(),
                "email": row.get('email', '').strip() or None,
                "company": row.get('company', '').strip() or None,
                "notes": row.get('notes', '').strip() or None
            }
            leads_data.append(lead_data)
        
        # Bulk insert leads
        if leads_data:
            lead_ids = await db_manager.bulk_create_leads(current_user["id"], leads_data)
            
        return CSVUploadResponse(
            success=True,
            message=f"Successfully imported {len(leads_data)} leads",
            leads_imported=len(leads_data),
            errors=errors
        )
        
    except Exception as e:
        return CSVUploadResponse(
            success=False,
            message=f"Error processing CSV: {str(e)}",
            leads_imported=0,
            errors=[str(e)]
        )

@router.get("/user/leads")
async def get_user_leads(
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    leads = await db_manager.get_user_leads(current_user["id"], limit)
    return leads

# User settings (password, PIN change)
@router.post("/user/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    # For demo purposes, any current password is accepted
    if request.current_password != "pass":
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # In a real system, you'd hash and update the password
    # For demo, we'll just return success
    return {"message": "Password changed successfully"}

@router.post("/user/change-pin")
async def change_pin(
    request: PinChangeRequest,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    # Verify current PIN
    is_valid = await db_manager.verify_user_pin(current_user["id"], request.current_pin)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Current PIN is incorrect")
    
    # Update PIN
    await db_manager.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"pin_code": request.new_pin}}
    )
    
    return {"message": "PIN changed successfully"}

# Bot pause/resume (PIN protected for users)
@router.post("/user/pause-bot")
async def pause_user_bot(
    pin_request: PinVerificationRequest,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    # Verify PIN
    is_valid = await db_manager.verify_user_pin(current_user["id"], pin_request.pin)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    # Update user status to paused
    success = await db_manager.update_user_status(current_user["id"], UserStatus.PAUSED, current_user["id"])
    if not success:
        raise HTTPException(status_code=400, detail="Failed to pause bot")
    
    return {"message": "Bot paused successfully"}

@router.post("/user/resume-bot")
async def resume_user_bot(
    pin_request: PinVerificationRequest,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    # Check if user is blocked by admin
    if current_user.get("status") == UserStatus.BLOCKED:
        raise HTTPException(status_code=403, detail="You have been blocked by the admin. Please contact support.")
    
    # Verify PIN
    is_valid = await db_manager.verify_user_pin(current_user["id"], pin_request.pin)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    # Update user status to active
    success = await db_manager.update_user_status(current_user["id"], UserStatus.ACTIVE, current_user["id"])
    if not success:
        raise HTTPException(status_code=400, detail="Failed to resume bot")
    
    return {"message": "Bot resumed successfully"}

# System status for users
@router.get("/system/status")
async def get_system_status(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    system_settings = await db_manager.get_system_settings()
    return {
        "is_global_paused": system_settings.get("is_global_paused", False),
        "user_status": current_user.get("status", UserStatus.ACTIVE)
    }

# Payment & Billing Endpoints

@router.post("/user/topup-credits")
async def topup_credits(
    request: CreditTopupRequest,
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    # Create payment record
    payment_id = await db_manager.create_payment(
        user_id=current_user["id"],
        amount=request.amount,
        transaction_type=TransactionType.TOPUP,
        description=f"Credit top-up of {request.amount} AED"
    )
    
    # For demo purposes, simulate immediate payment success
    success = await db_manager.process_payment(payment_id, "demo_payment_ref")
    
    if success:
        return {"message": f"Successfully added {request.amount} AED to your account", "payment_id": payment_id}
    else:
        raise HTTPException(status_code=400, detail="Payment processing failed")

@router.get("/user/payment-history")
async def get_payment_history(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    payments = await db_manager.get_user_payments(current_user["id"])
    return payments

@router.get("/user/transactions")
async def get_transaction_history(
    current_user: dict = Depends(get_current_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    transactions = await db_manager.get_user_transactions(current_user["id"])
    return transactions

# Admin Payment Management
@router.post("/admin/send-payment-link")
async def send_payment_link(
    request: PaymentLinkRequest,
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    # Create payment record with link
    payment_id = await db_manager.create_payment_link(
        user_id=request.user_id,
        amount=request.amount,
        description=request.description
    )
    
    # In production, would send email/SMS with payment link
    payment_link = f"https://lumaa.ai/pay/{payment_id}"
    
    return {
        "message": "Payment link created successfully",
        "payment_id": payment_id,
        "payment_link": payment_link
    }

@router.get("/admin/payments")
async def get_all_payments(
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    payments = await db_manager.get_all_payments()
    return payments

@router.put("/admin/users/{user_id}/edit")
async def edit_user(
    user_id: str,
    request: EditUserRequest,
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    success = await db_manager.edit_user(user_id, request)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}

@router.get("/admin/users-due-payment")
async def get_users_due_payment(
    admin_user: dict = Depends(get_admin_user),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    # Get users with payments due in next 3 days
    users_due = await db_manager.get_users_payment_due(days=3)
    return users_due
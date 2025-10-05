from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UserCategory(str, Enum):
    REAL_ESTATE = "real_estate"
    HOSPITALITY = "hospitality"
    SALES = "sales"
    HEALTHCARE = "healthcare"
    AUTOMOTIVE = "automotive"

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    SUPERADMIN = "superadmin"

class CallOutcome(str, Enum):
    INTERESTED = "interested"
    NOT_INTERESTED = "not_interested"
    CALLBACK = "callback"
    VOICEMAIL = "voicemail"
    NO_ANSWER = "no_answer"

class BotModel(str, Enum):
    GPT4 = "gpt-4"
    GPT35 = "gpt-3.5-turbo"
    CLAUDE = "claude-3"

class UserStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    BLOCKED = "blocked"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class TransactionType(str, Enum):
    TOPUP = "topup"
    MONTHLY_BILL = "monthly_bill"
    USAGE_CHARGE = "usage_charge"

# Database Models
class User(BaseModel):
    id: str
    name: str
    email: EmailStr
    password: str
    role: UserRole
    category: UserCategory
    pin_code: str = Field(min_length=4, max_length=6)
    status: UserStatus = UserStatus.ACTIVE
    minutes_used: int = 0
    minutes_allocated: int = 1000
    revenue_generated: float = 0.0
    # Payment & Billing fields
    credits_balance: float = 0.0  # 1 credit = 1 AED
    monthly_plan_cost: float = 100.0  # AED per month
    next_billing_date: datetime
    payment_status: PaymentStatus = PaymentStatus.PAID
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    
class Lead(BaseModel):
    id: str
    user_id: str
    name: str
    phone: str
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    status: str = "pending"
    created_at: datetime
    
class CallLog(BaseModel):
    id: str
    user_id: str
    lead_id: Optional[str] = None
    lead_name: str
    lead_phone: str
    call_outcome: CallOutcome
    duration_minutes: int
    transcript: Optional[str] = None
    recording_url: Optional[str] = None
    revenue_generated: Optional[float] = None  # Only for admin view
    created_at: datetime

class BotSettings(BaseModel):
    id: str
    category: UserCategory
    model: BotModel = BotModel.GPT4
    temperature: float = Field(ge=0.0, le=2.0, default=0.7)
    opening_message: str = Field(max_length=500)
    prompt: str = Field(max_length=2000)
    is_active: bool = True
    updated_by_admin: str
    updated_at: datetime

class UserBotSettings(BaseModel):
    id: str
    user_id: str
    opening_message: str = Field(max_length=500)
    prompt: str = Field(max_length=2000)
    updated_at: datetime

class Payment(BaseModel):
    id: str
    user_id: str
    amount: float
    transaction_type: TransactionType
    status: PaymentStatus = PaymentStatus.PENDING
    payment_link: Optional[str] = None
    payment_reference: Optional[str] = None
    due_date: datetime
    paid_date: Optional[datetime] = None
    created_at: datetime

class Transaction(BaseModel):
    id: str
    user_id: str
    amount: float
    transaction_type: TransactionType
    description: str
    credits_before: float
    credits_after: float
    created_at: datetime

class SystemSettings(BaseModel):
    id: str
    is_global_paused: bool = False
    updated_by: str
    updated_at: datetime

# API Request/Response Models
class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class PinVerificationRequest(BaseModel):
    pin: str

class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    category: UserCategory
    pin_code: str = Field(min_length=4, max_length=6)
    minutes_allocated: int = 1000

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    category: Optional[UserCategory] = None
    minutes_allocated: Optional[int] = None
    status: Optional[UserStatus] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class PinChangeRequest(BaseModel):
    current_pin: str
    new_pin: str = Field(min_length=4, max_length=6)

class BotSettingsUpdateRequest(BaseModel):
    opening_message: Optional[str] = Field(None, max_length=500)
    prompt: Optional[str] = Field(None, max_length=2000)

class AdminBotSettingsUpdateRequest(BaseModel):
    model: Optional[BotModel] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    opening_message: Optional[str] = Field(None, max_length=500)
    prompt: Optional[str] = Field(None, max_length=2000)

class CreditTopupRequest(BaseModel):
    amount: float = Field(gt=0, description="Amount in AED to add as credits")
    payment_method: str = "card"  # card, bank_transfer, etc.


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8)

class NotificationResponse(BaseModel):
    id: str
    user_id: Optional[str]
    type: str
    title: str
    message: str
    data: Optional[str]
    is_read: bool
    contact_name: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    contact_company: Optional[str]
    created_at: datetime

class ContactFormSubmission(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str]
    company: Optional[str]
    message: str

class AdminUpdateRequest(BaseModel):
    subject: str
    message: str
    recipient_type: str = "all"  # all, category, individual
    recipient_ids: Optional[List[str]] = None
    category: Optional[str] = None
    send_email: bool = True
    send_notification: bool = True
    scheduled_time: Optional[datetime] = None


class PaymentLinkRequest(BaseModel):
    user_id: str
    amount: float
    description: str = "Monthly subscription payment"

class EditUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    category: Optional[UserCategory] = None
    minutes_allocated: Optional[int] = None
    monthly_plan_cost: Optional[float] = None
    status: Optional[UserStatus] = None

class CSVUploadResponse(BaseModel):
    success: bool
    message: str
    leads_imported: int
    errors: List[str] = []

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    category: UserCategory
    status: UserStatus
    pause_reason: Optional[str] = None
    minutes_used: int
    minutes_allocated: int
    revenue_generated: float
    sip_endpoints: Optional[str] = None
    concurrency: Optional[int] = None
    created_at: datetime

class AdminUserResponse(UserResponse):
    revenue_generated: float  # Admins can see revenue
    credits_balance: float
    monthly_plan_cost: float
    next_billing_date: datetime
    payment_status: PaymentStatus
    days_until_billing: int
    
class UserDashboardResponse(BaseModel):
    id: str
    name: str
    email: str
    category: UserCategory
    status: UserStatus
    minutes_used: int
    minutes_allocated: int
    # Payment info for users
    credits_balance: float
    monthly_plan_cost: float
    next_billing_date: datetime
    payment_status: PaymentStatus
    days_until_billing: int
    # No revenue_generated - users don't see revenue
    created_at: datetime

class CallLogResponse(BaseModel):
    id: str
    lead_name: str
    lead_phone: str
    call_outcome: CallOutcome
    duration_minutes: int
    transcript: Optional[str] = None
    recording_url: Optional[str] = None
    created_at: datetime
    # No revenue or niche in user view

class AdminCallLogResponse(CallLogResponse):
    user_id: str
    user_name: str
    revenue_generated: Optional[float] = None

class TopUserResponse(BaseModel):
    id: str
    name: str
    email: str
    revenue: float
    minutes_used: int
    category: str

class AdminOverviewResponse(BaseModel):
    total_revenue: float
    total_minutes_used: int
    total_users: int
    active_users: int
    top_users: List[TopUserResponse]

class TokenResponse(BaseModel):
    user: UserResponse
    accessToken: str
    refreshToken: str


class BotSettingsResponse(BaseModel):
    id: str
    category: str
    model: str
    temperature: float
    opening_message: Optional[str] = None
    prompt: Optional[str] = None
    system_prompt: Optional[str] = None
    is_active: bool
    updated_by_admin: str
    updated_at: datetime

class UserBotSettingsResponse(BaseModel):
    opening_message: Optional[str] = None
    prompt: Optional[str] = None
    model: str
    temperature: float

class UserBotSettingsUpdateRequest(BaseModel):
    opening_message: Optional[str] = Field(None, max_length=500)
    prompt: Optional[str] = Field(None, max_length=2000)

class LeadResponse(BaseModel):
    id: str
    user_id: str
    name: str
    phone: str
    email: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime

class LeadCreateRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
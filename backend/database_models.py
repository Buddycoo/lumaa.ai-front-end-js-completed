from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timezone
import enum
import uuid

Base = declarative_base()

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"
    SUPERADMIN = "superadmin"

class UserCategory(str, enum.Enum):
    REAL_ESTATE = "real_estate"
    HOSPITALITY = "hospitality"
    SALES = "sales"
    HEALTHCARE = "healthcare"
    AUTOMOTIVE = "automotive"

class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    BLOCKED = "blocked"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class TransactionType(str, enum.Enum):
    TOPUP = "topup"
    MONTHLY_BILL = "monthly_bill"
    USAGE_CHARGE = "usage_charge"

class CallOutcome(str, enum.Enum):
    INTERESTED = "interested"
    NOT_INTERESTED = "not_interested"
    CALLBACK = "callback"
    VOICEMAIL = "voicemail"
    NO_ANSWER = "no_answer"

class BotModel(str, enum.Enum):
    GPT4 = "gpt-4"
    GPT35 = "gpt-3.5-turbo"
    CLAUDE = "claude-3"

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "lumaa_users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    category = Column(Enum(UserCategory), nullable=False)
    pin_code = Column(String(6), nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    
    # Expanded user fields as requested
    function = Column(String(255), nullable=True)  # User's job function
    sip_endpoint = Column(String(255), nullable=True)  # SIP endpoint for calls
    prompt = Column(Text, nullable=True)  # User's custom prompt
    
    # Subscription & Usage
    min_subscribed = Column(Integer, default=1000)  # Minutes subscribed to
    min_used = Column(Integer, default=0)  # Minutes actually used
    credits_remaining = Column(Float, default=0.0)  # Credits balance
    
    # Billing
    monthly_plan_cost = Column(Float, default=150.0)
    next_billing_date = Column(DateTime, nullable=True)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PAID)
    
    # Revenue tracking (admin view only)
    revenue_generated = Column(Float, default=0.0)
    
    # Timestamps
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    call_logs = relationship("CallLog", back_populates="user")
    leads = relationship("Lead", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")

class Lead(Base):
    __tablename__ = "lumaa_leads"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey('lumaa_users.id'), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="leads")
    call_logs = relationship("CallLog", back_populates="lead")

class CallLog(Base):
    __tablename__ = "lumaa_call_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey('lumaa_users.id'), nullable=False)
    lead_id = Column(String, ForeignKey('lumaa_leads.id'), nullable=True)
    
    # Lead details (stored directly for quick access)
    lead_name = Column(String(255), nullable=False)
    lead_phone = Column(String(50), nullable=False)
    
    # Call details
    call_outcome = Column(Enum(CallOutcome), nullable=False)
    duration_minutes = Column(Integer, default=0)
    transcript = Column(Text, nullable=True)
    recording_url = Column(String(500), nullable=True)
    
    # Revenue (admin view only)
    revenue_generated = Column(Float, default=0.0)
    
    # SIP/Technical details
    sip_call_id = Column(String(255), nullable=True)
    caller_id = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="call_logs")
    lead = relationship("Lead", back_populates="call_logs")

class BotSettings(Base):
    __tablename__ = "bot_settings"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    category = Column(Enum(UserCategory), unique=True, nullable=False)
    model = Column(Enum(BotModel), default=BotModel.GPT4)
    temperature = Column(Float, default=0.7)
    opening_message = Column(Text, nullable=True)
    system_prompt = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    updated_by_admin = Column(String, nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    description = Column(String(500), nullable=True)
    payment_link = Column(String(500), nullable=True)
    payment_reference = Column(String(255), nullable=True)
    due_date = Column(DateTime, nullable=True)
    paid_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="payments")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    description = Column(String(500), nullable=False)
    credits_before = Column(Float, default=0.0)
    credits_after = Column(Float, default=0.0)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="transactions")

class SystemSettings(Base):
    __tablename__ = "system_settings"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    is_global_paused = Column(Boolean, default=False)
    updated_by = Column(String, nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
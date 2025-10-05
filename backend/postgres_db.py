from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError
from database_models import Base, User, Lead, CallLog, BotSettings, Payment, Transaction, SystemSettings
from database_models import UserRole, UserCategory, UserStatus, PaymentStatus, TransactionType, CallOutcome, BotModel
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
import bcrypt
import os

class PostgreSQLManager:
    def __init__(self, database_url: str):
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
    def create_tables(self):
        """Create all tables"""
        Base.metadata.create_all(bind=self.engine)
        
    def get_session(self) -> Session:
        """Get database session"""
        return self.SessionLocal()
    
    def _hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def _verify_password(self, password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

    # User Management
    async def create_user(self, user_data: dict, created_by: str = "system") -> str:
        """Create a new user"""
        session = self.get_session()
        try:
            hashed_password = self._hash_password(user_data.get("password", "pass"))
            
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                password=hashed_password,
                role=UserRole(user_data.get("role", "user")),
                category=UserCategory(user_data["category"]),
                pin_code=user_data["pin_code"],
                function=user_data.get("function"),
                sip_endpoint=user_data.get("sip_endpoint"),
                prompt=user_data.get("prompt"),
                min_subscribed=user_data.get("min_subscribed", 1000),
                min_used=user_data.get("min_used", 0),
                credits_remaining=user_data.get("credits_remaining", 0.0),
                monthly_plan_cost=user_data.get("monthly_plan_cost", 150.0),
                next_billing_date=datetime.now(timezone.utc) + timedelta(days=30)
            )
            
            session.add(user)
            session.commit()
            session.refresh(user)
            return user.id
        except IntegrityError as e:
            session.rollback()
            raise ValueError("User with this email already exists")
        finally:
            session.close()

    async def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        session = self.get_session()
        try:
            user = session.query(User).filter(User.email == email).first()
            if user:
                return self._user_to_dict(user)
            return None
        finally:
            session.close()

    async def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        session = self.get_session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            if user:
                return self._user_to_dict(user)
            return None
        finally:
            session.close()

    async def authenticate_user(self, email: str, password: str) -> Optional[Dict]:
        """Authenticate user"""
        user_data = await self.get_user_by_email(email)
        if not user_data:
            return None
            
        # For demo purposes, any password = "pass"
        if password != "pass":
            return None
            
        if user_data.get("status") != "active":
            return None
            
        return user_data

    async def verify_user_pin(self, user_id: str, pin: str) -> bool:
        """Verify user PIN"""
        user_data = await self.get_user_by_id(user_id)
        if not user_data:
            return False
        return user_data.get("pin_code") == pin

    async def update_user_status(self, user_id: str, status: UserStatus, updated_by: str) -> bool:
        """Update user status"""
        session = self.get_session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            if user:
                user.status = status
                user.updated_at = datetime.now(timezone.utc)
                session.commit()
                return True
            return False
        finally:
            session.close()

    async def get_all_users(self, include_admins: bool = False) -> List[Dict]:
        """Get all users"""
        session = self.get_session()
        try:
            query = session.query(User)
            if not include_admins:
                query = query.filter(User.role != UserRole.ADMIN)
            
            users = query.all()
            return [self._user_to_dict(user) for user in users]
        finally:
            session.close()

    async def update_user(self, user_id: str, update_data: dict) -> bool:
        """Update user details"""
        session = self.get_session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            
            for key, value in update_data.items():
                if hasattr(user, key) and value is not None:
                    setattr(user, key, value)
            
            user.updated_at = datetime.now(timezone.utc)
            session.commit()
            return True
        finally:
            session.close()

    # Lead Management
    async def create_lead(self, user_id: str, lead_data: dict) -> str:
        """Create a new lead"""
        session = self.get_session()
        try:
            lead = Lead(
                user_id=user_id,
                name=lead_data["name"],
                phone=lead_data["phone"],
                email=lead_data.get("email"),
                company=lead_data.get("company"),
                notes=lead_data.get("notes")
            )
            
            session.add(lead)
            session.commit()
            session.refresh(lead)
            return lead.id
        finally:
            session.close()

    async def bulk_create_leads(self, user_id: str, leads_data: List[dict]) -> List[str]:
        """Bulk create leads"""
        session = self.get_session()
        try:
            lead_ids = []
            for lead_data in leads_data:
                lead = Lead(
                    user_id=user_id,
                    name=lead_data["name"],
                    phone=lead_data["phone"],
                    email=lead_data.get("email"),
                    company=lead_data.get("company"),
                    notes=lead_data.get("notes")
                )
                session.add(lead)
                session.flush()  # To get the ID
                lead_ids.append(lead.id)
            
            session.commit()
            return lead_ids
        finally:
            session.close()

    async def get_user_leads(self, user_id: str, limit: int = 100) -> List[Dict]:
        """Get leads for a user"""
        session = self.get_session()
        try:
            leads = session.query(Lead).filter(Lead.user_id == user_id).limit(limit).all()
            return [self._lead_to_dict(lead) for lead in leads]
        finally:
            session.close()

    # Call Logs
    async def create_call_log(self, call_data: dict) -> str:
        """Create a call log entry"""
        session = self.get_session()
        try:
            call_log = CallLog(
                user_id=call_data["user_id"],
                lead_id=call_data.get("lead_id"),
                lead_name=call_data["lead_name"],
                lead_phone=call_data["lead_phone"],
                call_outcome=CallOutcome(call_data["call_outcome"]),
                duration_minutes=call_data["duration_minutes"],
                transcript=call_data.get("transcript"),
                recording_url=call_data.get("recording_url"),
                revenue_generated=call_data.get("revenue_generated", 0.0),
                sip_call_id=call_data.get("sip_call_id"),
                caller_id=call_data.get("caller_id")
            )
            
            session.add(call_log)
            session.commit()
            
            # Update user minutes and revenue
            user = session.query(User).filter(User.id == call_data["user_id"]).first()
            if user:
                user.min_used += call_data["duration_minutes"]
                user.revenue_generated += call_data.get("revenue_generated", 0.0)
                session.commit()
            
            session.refresh(call_log)
            return call_log.id
        finally:
            session.close()

    async def get_user_call_logs(self, user_id: str, limit: int = 100) -> List[Dict]:
        """Get call logs for a user (no revenue data)"""
        session = self.get_session()
        try:
            call_logs = session.query(CallLog).filter(CallLog.user_id == user_id).order_by(CallLog.created_at.desc()).limit(limit).all()
            
            result = []
            for log in call_logs:
                log_dict = self._call_log_to_dict(log)
                # Remove revenue data for user view
                log_dict.pop("revenue_generated", None)
                result.append(log_dict)
            
            return result
        finally:
            session.close()

    async def get_all_call_logs(self, limit: int = 100) -> List[Dict]:
        """Get all call logs (admin view with revenue)"""
        session = self.get_session()
        try:
            call_logs = session.query(CallLog).order_by(CallLog.created_at.desc()).limit(limit).all()
            
            result = []
            for log in call_logs:
                log_dict = self._call_log_to_dict(log)
                # Add user name for admin view
                user = session.query(User).filter(User.id == log.user_id).first()
                log_dict["user_name"] = user.name if user else "Unknown"
                result.append(log_dict)
            
            return result
        finally:
            session.close()

    # Bot Settings
    async def get_category_bot_settings(self, category: UserCategory) -> Optional[Dict]:
        """Get bot settings for a category"""
        session = self.get_session()
        try:
            settings = session.query(BotSettings).filter(BotSettings.category == category).first()
            if settings:
                return self._bot_settings_to_dict(settings)
            return None
        finally:
            session.close()

    async def update_category_bot_settings(self, category: UserCategory, settings_data: dict, updated_by: str) -> bool:
        """Update bot settings for a category"""
        session = self.get_session()
        try:
            settings = session.query(BotSettings).filter(BotSettings.category == category).first()
            
            if not settings:
                # Create new settings
                settings = BotSettings(
                    category=category,
                    model=BotModel(settings_data.get("model", "gpt-4")),
                    temperature=settings_data.get("temperature", 0.7),
                    opening_message=settings_data.get("opening_message"),
                    system_prompt=settings_data.get("prompt"),
                    updated_by_admin=updated_by
                )
                session.add(settings)
            else:
                # Update existing settings
                for key, value in settings_data.items():
                    if key == "model" and value:
                        settings.model = BotModel(value)
                    elif key == "temperature" and value is not None:
                        settings.temperature = value
                    elif key == "opening_message" and value:
                        settings.opening_message = value
                    elif key == "prompt" and value:
                        settings.system_prompt = value
                
                settings.updated_by_admin = updated_by
                settings.updated_at = datetime.now(timezone.utc)
            
            session.commit()
            return True
        finally:
            session.close()

    async def get_user_bot_settings(self, user_id: str) -> Optional[Dict]:
        """Get user-specific bot settings"""
        session = self.get_session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return None
            
            # Get category settings as base
            category_settings = await self.get_category_bot_settings(user.category)
            
            result = {
                "opening_message": user.prompt or (category_settings.get("opening_message") if category_settings else ""),
                "prompt": user.prompt or (category_settings.get("system_prompt") if category_settings else ""),
                "model": category_settings.get("model") if category_settings else "gpt-4",
                "temperature": category_settings.get("temperature") if category_settings else 0.7
            }
            
            return result
        finally:
            session.close()

    async def update_user_bot_settings(self, user_id: str, settings_data: dict) -> bool:
        """Update user-specific bot settings"""
        session = self.get_session()
        try:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            
            if "opening_message" in settings_data or "prompt" in settings_data:
                # Combine opening message and prompt into user's prompt field
                prompt_parts = []
                if settings_data.get("opening_message"):
                    prompt_parts.append(f"Opening: {settings_data['opening_message']}")
                if settings_data.get("prompt"):
                    prompt_parts.append(f"System: {settings_data['prompt']}")
                
                user.prompt = " | ".join(prompt_parts)
                user.updated_at = datetime.now(timezone.utc)
                session.commit()
            
            return True
        finally:
            session.close()

    # Payment & Billing
    async def create_payment(self, user_id: str, amount: float, transaction_type: str, description: str) -> str:
        """Create a payment record"""
        session = self.get_session()
        try:
            due_date = datetime.now(timezone.utc)
            if transaction_type == "monthly_bill":
                due_date = due_date.replace(day=1)
                if due_date.month == 12:
                    due_date = due_date.replace(year=due_date.year + 1, month=1)
                else:
                    due_date = due_date.replace(month=due_date.month + 1)
            
            payment = Payment(
                user_id=user_id,
                amount=amount,
                transaction_type=TransactionType(transaction_type),
                description=description,
                due_date=due_date
            )
            
            session.add(payment)
            session.commit()
            session.refresh(payment)
            return payment.id
        finally:
            session.close()

    async def process_payment(self, payment_id: str, payment_reference: str) -> bool:
        """Process payment and update user credits"""
        session = self.get_session()
        try:
            payment = session.query(Payment).filter(Payment.id == payment_id).first()
            if not payment:
                return False
            
            # Update payment status
            payment.status = PaymentStatus.PAID
            payment.payment_reference = payment_reference
            payment.paid_date = datetime.now(timezone.utc)
            
            # Add credits to user account
            user = session.query(User).filter(User.id == payment.user_id).first()
            if user:
                old_balance = user.credits_remaining
                user.credits_remaining += payment.amount
                
                # Create transaction record
                transaction = Transaction(
                    user_id=payment.user_id,
                    amount=payment.amount,
                    transaction_type=payment.transaction_type,
                    description=f"Payment processed: {payment.description}",
                    credits_before=old_balance,
                    credits_after=user.credits_remaining
                )
                session.add(transaction)
            
            session.commit()
            return True
        finally:
            session.close()

    # Helper methods to convert SQLAlchemy objects to dicts
    def _user_to_dict(self, user: User) -> Dict:
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "password": user.password,
            "role": user.role.value,
            "category": user.category.value,
            "pin_code": user.pin_code,
            "status": user.status.value,
            "function": user.function,
            "sip_endpoint": user.sip_endpoint,
            "prompt": user.prompt,
            "min_subscribed": user.min_subscribed,
            "min_used": user.min_used,
            "minutes_used": user.min_used,  # For compatibility
            "minutes_allocated": user.min_subscribed,  # For compatibility
            "credits_remaining": user.credits_remaining,
            "credits_balance": user.credits_remaining,  # For compatibility
            "monthly_plan_cost": user.monthly_plan_cost,
            "next_billing_date": user.next_billing_date,
            "payment_status": user.payment_status.value,
            "revenue_generated": user.revenue_generated,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }
    
    def _lead_to_dict(self, lead: Lead) -> Dict:
        return {
            "id": lead.id,
            "user_id": lead.user_id,
            "name": lead.name,
            "phone": lead.phone,
            "email": lead.email,
            "company": lead.company,
            "notes": lead.notes,
            "status": lead.status,
            "created_at": lead.created_at
        }
    
    def _call_log_to_dict(self, call_log: CallLog) -> Dict:
        return {
            "id": call_log.id,
            "user_id": call_log.user_id,
            "lead_id": call_log.lead_id,
            "lead_name": call_log.lead_name,
            "lead_phone": call_log.lead_phone,
            "call_outcome": call_log.call_outcome.value,
            "duration_minutes": call_log.duration_minutes,
            "transcript": call_log.transcript,
            "recording_url": call_log.recording_url,
            "revenue_generated": call_log.revenue_generated,
            "sip_call_id": call_log.sip_call_id,
            "caller_id": call_log.caller_id,
            "created_at": call_log.created_at
        }
    
    def _bot_settings_to_dict(self, settings: BotSettings) -> Dict:
        return {
            "id": settings.id,
            "category": settings.category.value,
            "model": settings.model.value,
            "temperature": settings.temperature,
            "opening_message": settings.opening_message,
            "prompt": settings.system_prompt,
            "system_prompt": settings.system_prompt,
            "is_active": settings.is_active,
            "updated_by_admin": settings.updated_by_admin,
            "updated_at": settings.updated_at
        }

# Initialize demo data
async def initialize_demo_data(db_manager: PostgreSQLManager):
    """Initialize demo data for testing"""
    
    # Check if admin exists
    admin = await db_manager.get_user_by_email("admin@lumaa.ai")
    if not admin:
        admin_data = {
            "name": "Admin User",
            "email": "admin@lumaa.ai",
            "password": "pass",
            "role": "admin",
            "category": "sales",
            "pin_code": "1234",
            "function": "System Administrator",
            "sip_endpoint": "sip:admin@lumaa.ai",
            "prompt": "You are an AI assistant administrator. Be professional and helpful.",
            "min_subscribed": 99999,
            "min_used": 0,
            "credits_remaining": 1000.0,
            "monthly_plan_cost": 0.0
        }
        await db_manager.create_user(admin_data)
    
    # Check if regular user exists
    user = await db_manager.get_user_by_email("user@lumaa.ai")
    if not user:
        user_data = {
            "name": "Demo User",
            "email": "user@lumaa.ai",
            "password": "pass",
            "role": "user",
            "category": "real_estate",
            "pin_code": "5678",
            "function": "Real Estate Agent",
            "sip_endpoint": "sip:user@lumaa.ai",
            "prompt": "You are a real estate AI assistant. Be helpful with property inquiries.",
            "min_subscribed": 1000,
            "min_used": 234,
            "credits_remaining": 250.0,
            "monthly_plan_cost": 150.0
        }
        await db_manager.create_user(user_data)
    
    # Initialize default bot settings for each category
    categories = ["real_estate", "hospitality", "sales", "healthcare", "automotive"]
    
    for category in categories:
        existing = await db_manager.get_category_bot_settings(UserCategory(category))
        if not existing:
            await db_manager.update_category_bot_settings(
                UserCategory(category),
                {
                    "model": "gpt-4",
                    "temperature": 0.7,
                    "opening_message": f"Hello! I'm an AI assistant specialized in {category.replace('_', ' ').title()}. How can I help you today?",
                    "prompt": f"You are a professional AI assistant for {category.replace('_', ' ').title()}. Be helpful, knowledgeable, and maintain a professional tone."
                },
                "system"
            )
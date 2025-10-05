from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import bcrypt
from models import *
import os

class DatabaseManager:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.users = db.users
        self.leads = db.leads
        self.call_logs = db.call_logs
        self.bot_settings = db.bot_settings
        self.user_bot_settings = db.user_bot_settings
        self.system_settings = db.system_settings

    # Helper methods
    def _generate_id(self) -> str:
        return str(uuid.uuid4())

    def _hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def _verify_password(self, password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

    def _prepare_for_mongo(self, data: dict) -> dict:
        """Prepare data for MongoDB storage"""
        if isinstance(data.get('created_at'), datetime):
            data['created_at'] = data['created_at'].isoformat()
        if isinstance(data.get('updated_at'), datetime):
            data['updated_at'] = data['updated_at'].isoformat()
        return data

    def _parse_from_mongo(self, item: dict) -> dict:
        """Parse data from MongoDB"""
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if isinstance(item.get('updated_at'), str):
            item['updated_at'] = datetime.fromisoformat(item['updated_at'])
        return item

    # User Management
    async def create_user(self, user_data: UserCreateRequest, created_by: str = "system") -> str:
        """Create a new user"""
        user_id = self._generate_id()
        hashed_password = self._hash_password(user_data.password)
        
        user_doc = {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "password": hashed_password,
            "role": UserRole.USER,
            "category": user_data.category,
            "pin_code": user_data.pin_code,
            "status": UserStatus.ACTIVE,
            "minutes_used": 0,
            "minutes_allocated": user_data.minutes_allocated,
            "revenue_generated": 0.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.users.insert_one(user_doc)
        return user_id

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get user by email"""
        user = await self.users.find_one({"email": email}, {"_id": 0})
        if user:
            return self._parse_from_mongo(user)
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """Get user by ID"""
        user = await self.users.find_one({"id": user_id}, {"_id": 0})
        if user:
            return self._parse_from_mongo(user)
        return None

    async def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        """Authenticate user with email and password"""
        user = await self.get_user_by_email(email)
        if not user:
            return None
            
        # For demo purposes, any password = "pass"
        if password != "pass":
            return None
            
        if user.get("status") != UserStatus.ACTIVE:
            return None
            
        return user

    async def verify_user_pin(self, user_id: str, pin: str) -> bool:
        """Verify user PIN"""
        user = await self.get_user_by_id(user_id)
        if not user:
            return False
        return user.get("pin_code") == pin

    async def update_user_status(self, user_id: str, status: UserStatus, updated_by: str) -> bool:
        """Update user status"""
        result = await self.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "status": status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        return result.modified_count > 0

    async def get_all_users(self, include_admins: bool = False) -> List[dict]:
        """Get all users (optionally include admins)"""
        query = {} if include_admins else {"role": {"$ne": UserRole.ADMIN}}
        users = await self.users.find(query, {"_id": 0}).to_list(length=None)
        return [self._parse_from_mongo(user) for user in users]

    async def update_user(self, user_id: str, update_data: UserUpdateRequest) -> bool:
        """Update user details"""
        update_fields = {}
        if update_data.name:
            update_fields["name"] = update_data.name
        if update_data.category:
            update_fields["category"] = update_data.category
        if update_data.minutes_allocated is not None:
            update_fields["minutes_allocated"] = update_data.minutes_allocated
        if update_data.status:
            update_fields["status"] = update_data.status
            
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await self.users.update_one(
            {"id": user_id},
            {"$set": update_fields}
        )
        return result.modified_count > 0

    # Lead Management
    async def create_lead(self, user_id: str, lead_data: dict) -> str:
        """Create a new lead"""
        lead_id = self._generate_id()
        lead_doc = {
            "id": lead_id,
            "user_id": user_id,
            "name": lead_data["name"],
            "phone": lead_data["phone"],
            "email": lead_data.get("email"),
            "company": lead_data.get("company"),
            "notes": lead_data.get("notes"),
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.leads.insert_one(lead_doc)
        return lead_id

    async def bulk_create_leads(self, user_id: str, leads_data: List[dict]) -> List[str]:
        """Bulk create leads from CSV"""
        lead_docs = []
        lead_ids = []
        
        for lead_data in leads_data:
            lead_id = self._generate_id()
            lead_ids.append(lead_id)
            
            lead_doc = {
                "id": lead_id,
                "user_id": user_id,
                "name": lead_data["name"],
                "phone": lead_data["phone"],
                "email": lead_data.get("email"),
                "company": lead_data.get("company"),
                "notes": lead_data.get("notes"),
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            lead_docs.append(lead_doc)
        
        if lead_docs:
            await self.leads.insert_many(lead_docs)
        
        return lead_ids

    async def get_user_leads(self, user_id: str, limit: int = 100) -> List[dict]:
        """Get leads for a user"""
        leads = await self.leads.find({"user_id": user_id}, {"_id": 0}).limit(limit).to_list(length=None)
        return [self._parse_from_mongo(lead) for lead in leads]

    # Call Logs
    async def create_call_log(self, call_data: dict) -> str:
        """Create a call log entry"""
        call_id = self._generate_id()
        call_doc = {
            "id": call_id,
            "user_id": call_data["user_id"],
            "lead_id": call_data.get("lead_id"),
            "lead_name": call_data["lead_name"],
            "lead_phone": call_data["lead_phone"],
            "call_outcome": call_data["call_outcome"],
            "duration_minutes": call_data["duration_minutes"],
            "transcript": call_data.get("transcript"),
            "recording_url": call_data.get("recording_url"),
            "revenue_generated": call_data.get("revenue_generated", 0.0),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.call_logs.insert_one(call_doc)
        
        # Update user minutes and revenue
        await self.users.update_one(
            {"id": call_data["user_id"]},
            {
                "$inc": {
                    "minutes_used": call_data["duration_minutes"],
                    "revenue_generated": call_data.get("revenue_generated", 0.0)
                }
            }
        )
        
        return call_id

    async def get_user_call_logs(self, user_id: str, limit: int = 100) -> List[dict]:
        """Get call logs for a user (no revenue data)"""
        call_logs = await self.call_logs.find({"user_id": user_id}, {"_id": 0}).limit(limit).to_list(length=None)
        
        # Remove revenue data for user view
        for log in call_logs:
            log.pop("revenue_generated", None)
            
        return [self._parse_from_mongo(log) for log in call_logs]

    async def get_all_call_logs(self, limit: int = 100) -> List[dict]:
        """Get all call logs (admin view with revenue)"""
        call_logs = await self.call_logs.find({}).limit(limit).to_list(length=None)
        
        # Add user names for admin view
        for log in call_logs:
            user = await self.get_user_by_id(log["user_id"])
            log["user_name"] = user["name"] if user else "Unknown"
            
        return [self._parse_from_mongo(log) for log in call_logs]

    # Bot Settings
    async def get_category_bot_settings(self, category: UserCategory) -> Optional[dict]:
        """Get bot settings for a category"""
        settings = await self.bot_settings.find_one({"category": category}, {"_id": 0})
        if settings:
            return self._parse_from_mongo(settings)
        return None

    async def update_category_bot_settings(self, category: UserCategory, settings_data: AdminBotSettingsUpdateRequest, updated_by: str) -> bool:
        """Update bot settings for a category"""
        update_fields = {}
        if settings_data.model:
            update_fields["model"] = settings_data.model
        if settings_data.temperature is not None:
            update_fields["temperature"] = settings_data.temperature
        if settings_data.opening_message:
            update_fields["opening_message"] = settings_data.opening_message
        if settings_data.prompt:
            update_fields["prompt"] = settings_data.prompt
            
        update_fields["updated_by_admin"] = updated_by
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await self.bot_settings.update_one(
            {"category": category},
            {"$set": update_fields},
            upsert=True
        )
        return True

    async def get_user_bot_settings(self, user_id: str) -> Optional[dict]:
        """Get user-specific bot settings"""
        settings = await self.user_bot_settings.find_one({"user_id": user_id}, {"_id": 0})
        if settings:
            return self._parse_from_mongo(settings)
        return None

    async def update_user_bot_settings(self, user_id: str, settings_data: BotSettingsUpdateRequest) -> bool:
        """Update user-specific bot settings"""
        update_fields = {}
        if settings_data.opening_message:
            update_fields["opening_message"] = settings_data.opening_message
        if settings_data.prompt:
            update_fields["prompt"] = settings_data.prompt
            
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await self.user_bot_settings.update_one(
            {"user_id": user_id},
            {"$set": update_fields},
            upsert=True
        )
        return True

    # System Settings
    async def set_global_pause(self, is_paused: bool, updated_by: str) -> bool:
        """Set global pause status"""
        result = await self.system_settings.update_one(
            {},
            {
                "$set": {
                    "is_global_paused": is_paused,
                    "updated_by": updated_by,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        return True

    async def get_system_settings(self) -> dict:
        """Get system settings"""
        settings = await self.system_settings.find_one({}, {"_id": 0})
        if settings:
            return self._parse_from_mongo(settings)
        return {"is_global_paused": False}

    # Analytics for Admin Dashboard
    async def get_admin_overview(self) -> dict:
        """Get overview data for admin dashboard"""
        # Aggregate data
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_revenue": {"$sum": "$revenue_generated"},
                    "total_minutes": {"$sum": "$minutes_used"},
                    "total_users": {"$sum": 1},
                    "active_users": {
                        "$sum": {"$cond": [{"$eq": ["$status", "active"]}, 1, 0]}
                    }
                }
            }
        ]
        
        result = await self.users.aggregate(pipeline).to_list(length=1)
        overview = result[0] if result else {
            "total_revenue": 0, "total_minutes": 0, 
            "total_users": 0, "active_users": 0
        }
        
        # Get top users by revenue
        top_revenue_users = await self.users.find(
            {"role": {"$ne": "admin"}}, 
            {"_id": 0, "name": 1, "revenue_generated": 1}
        ).sort("revenue_generated", -1).limit(5).to_list(length=None)
        
        # Get top users by minutes
        top_minutes_users = await self.users.find(
            {"role": {"$ne": "admin"}}, 
            {"_id": 0, "name": 1, "minutes_used": 1}
        ).sort("minutes_used", -1).limit(5).to_list(length=None)
        
        system_settings = await self.get_system_settings()
        
        return {
            "total_revenue": overview["total_revenue"],
            "total_minutes_used": overview["total_minutes"],
            "total_users": overview["total_users"],
            "active_users": overview["active_users"],
            "top_users_by_revenue": top_revenue_users,
            "top_users_by_minutes": top_minutes_users,
            "is_global_paused": system_settings.get("is_global_paused", False)
        }

# Initialize demo data
async def initialize_demo_data(db_manager: DatabaseManager):
    """Initialize demo data for testing"""
    
    # Check if admin exists
    admin = await db_manager.get_user_by_email("admin@lumaa.ai")
    if not admin:
        admin_data = UserCreateRequest(
            name="Admin User",
            email="admin@lumaa.ai",
            password="pass",
            category=UserCategory.SALES,
            pin_code="1234",
            minutes_allocated=99999
        )
        admin_id = await db_manager.create_user(admin_data)
        # Update to admin role
        await db_manager.users.update_one(
            {"id": admin_id},
            {"$set": {"role": UserRole.ADMIN}}
        )
    
    # Check if regular user exists
    user = await db_manager.get_user_by_email("user@lumaa.ai")
    if not user:
        user_data = UserCreateRequest(
            name="Regular User",
            email="user@lumaa.ai", 
            password="pass",
            category=UserCategory.REAL_ESTATE,
            pin_code="5678",
            minutes_allocated=1000
        )
        await db_manager.create_user(user_data)
    
    # Initialize default bot settings for each category
    categories = [UserCategory.REAL_ESTATE, UserCategory.HOSPITALITY, UserCategory.SALES, 
                 UserCategory.HEALTHCARE, UserCategory.AUTOMOTIVE]
    
    for category in categories:
        existing = await db_manager.get_category_bot_settings(category)
        if not existing:
            settings_doc = {
                "id": db_manager._generate_id(),
                "category": category,
                "model": BotModel.GPT4,
                "temperature": 0.7,
                "opening_message": f"Hello! I'm an AI assistant specialized in {category.value.replace('_', ' ').title()}. How can I help you today?",
                "prompt": f"You are a professional AI assistant for {category.value.replace('_', ' ').title()}. Be helpful, knowledgeable, and maintain a professional tone.",
                "is_active": True,
                "updated_by_admin": "system",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db_manager.bot_settings.insert_one(settings_doc)
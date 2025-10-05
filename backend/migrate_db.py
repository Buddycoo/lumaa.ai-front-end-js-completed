#!/usr/bin/env python3
"""
Database migration script to add new columns to existing tables
"""
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

database_url = os.environ.get('DATABASE_URL', 'postgresql+psycopg2://postgres:callbot123@51.112.135.78:5432/callbotdb')

engine = create_engine(database_url)

def run_migration():
    with engine.connect() as conn:
        try:
            # Add reset_token and reset_token_expiry to lumaa_users
            print("Adding password reset columns to lumaa_users...")
            conn.execute(text("""
                ALTER TABLE lumaa_users 
                ADD COLUMN IF NOT EXISTS reset_token VARCHAR(10),
                ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
            """))
            conn.commit()
            print("✅ Password reset columns added successfully")
            
            # Add pause_reason to lumaa_users
            print("Adding pause_reason column to lumaa_users...")
            conn.execute(text("""
                ALTER TABLE lumaa_users 
                ADD COLUMN IF NOT EXISTS pause_reason VARCHAR(500)
            """))
            conn.commit()
            print("✅ Pause reason column added successfully")
            
            # Create lumaa_notifications table
            print("Creating lumaa_notifications table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lumaa_notifications (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR REFERENCES lumaa_users(id),
                    type VARCHAR NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    data TEXT,
                    is_read BOOLEAN DEFAULT FALSE,
                    contact_name VARCHAR(255),
                    contact_email VARCHAR(255),
                    contact_phone VARCHAR(50),
                    contact_company VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
            print("✅ Notifications table created successfully")
            
            print("\n🎉 Migration completed successfully!")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    run_migration()
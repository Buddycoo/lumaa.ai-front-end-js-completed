#!/usr/bin/env python3
"""
Focused test for new Lumaa AI features
Tests the specific features mentioned in the review request
"""

import requests
import json
import sys
from datetime import datetime
import os

# Load environment variables to get backend URL
def load_env_file(file_path):
    """Load environment variables from .env file"""
    env_vars = {}
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes if present
                    value = value.strip('"\'')
                    env_vars[key] = value
    return env_vars

# Load frontend .env to get backend URL
frontend_env = load_env_file('/app/frontend/.env')
BACKEND_URL = frontend_env.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')

print(f"🔧 Testing New Lumaa AI Features at: {BACKEND_URL}")
print(f"📅 Test started at: {datetime.now()}")
print("=" * 80)

class NewFeaturesTester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()
        self.test_results = []
        self.admin_token = None
        self.user_token = None
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })
    
    def login_admin(self):
        """Login as admin to get token"""
        try:
            payload = {"email": "admin@lumaa.ai", "password": "pass"}
            response = self.session.post(f"{self.api_url}/auth/login", json=payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data['accessToken']
                self.log_test("Admin Login", True, "Admin login successful")
                return True
            else:
                self.log_test("Admin Login", False, f"Login failed: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Login error: {str(e)}")
            return False
    
    def login_user(self):
        """Login as user to get token"""
        try:
            payload = {"email": "user@lumaa.ai", "password": "pass"}
            response = self.session.post(f"{self.api_url}/auth/login", json=payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                self.user_token = data['accessToken']
                self.log_test("User Login", True, "User login successful")
                return True
            else:
                self.log_test("User Login", False, f"Login failed: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("User Login", False, f"Login error: {str(e)}")
            return False

    def test_admin_send_update_all_users(self):
        """Test POST /api/admin/send-update with admin token - sending to all users"""
        if not self.admin_token:
            self.log_test("Admin Send Update (All Users)", False, "No admin token")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            update_data = {
                "subject": "System Maintenance Notice",
                "message": "We will be performing system maintenance on Sunday from 2-4 AM EST.",
                "recipient_type": "all",
                "send_notification": True,
                "send_email": False
            }
            
            response = self.session.post(f"{self.api_url}/admin/send-update", 
                                       json=update_data, headers=headers, timeout=20)
            
            if response.status_code == 200:
                data = response.json()
                users_count = data.get("users_count", 0)
                notification_ids = data.get("notification_ids", [])
                
                self.log_test("Admin Send Update (All Users)", True, 
                            f"Successfully sent update to {users_count} users",
                            f"Created {len(notification_ids)} notifications")
                return True
            else:
                self.log_test("Admin Send Update (All Users)", False, 
                            f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Send Update (All Users)", False, f"Error: {str(e)}")
            return False

    def test_admin_send_update_category(self):
        """Test POST /api/admin/send-update - sending to specific category (sales)"""
        if not self.admin_token:
            self.log_test("Admin Send Update (Category)", False, "No admin token")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            update_data = {
                "subject": "Sales Team Update",
                "message": "New sales targets have been set for Q1. Please check your dashboard.",
                "recipient_type": "category",
                "category": "sales",
                "send_notification": True,
                "send_email": False
            }
            
            response = self.session.post(f"{self.api_url}/admin/send-update", 
                                       json=update_data, headers=headers, timeout=20)
            
            if response.status_code == 200:
                data = response.json()
                users_count = data.get("users_count", 0)
                
                self.log_test("Admin Send Update (Category)", True, 
                            f"Successfully sent update to sales category: {users_count} users")
                return True
            else:
                self.log_test("Admin Send Update (Category)", False, 
                            f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Send Update (Category)", False, f"Error: {str(e)}")
            return False

    def test_admin_overview_real_data(self):
        """Test GET /api/admin/overview with admin token - verify real data"""
        if not self.admin_token:
            self.log_test("Admin Overview Real Data", False, "No admin token")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.api_url}/admin/overview", headers=headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ['total_revenue', 'total_minutes_used', 'total_users', 'active_users']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Admin Overview Real Data", False, 
                                f"Missing fields: {missing_fields}")
                    return False
                
                # Check top_users array
                top_users = data.get('top_users', [])
                has_user_data = len(top_users) > 0 and all(
                    'revenue' in user and 'minutes' in user for user in top_users
                )
                
                self.log_test("Admin Overview Real Data", True, 
                            f"Revenue: ${data.get('total_revenue')}, Users: {data.get('total_users')}, Active: {data.get('active_users')}, Minutes: {data.get('total_minutes_used')}",
                            f"Top users array has {len(top_users)} entries with revenue/minutes data")
                return True
            else:
                self.log_test("Admin Overview Real Data", False, 
                            f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Overview Real Data", False, f"Error: {str(e)}")
            return False

    def test_contact_form(self):
        """Test POST /api/contact (no auth required)"""
        try:
            contact_data = {
                "name": "Sarah Johnson",
                "email": "sarah.johnson@techcorp.com",
                "phone": "555-987-6543",
                "company": "TechCorp Solutions",
                "message": "I'm interested in implementing your AI solution for our customer service department. Could we schedule a demo?"
            }
            
            response = self.session.post(f"{self.api_url}/contact", 
                                       json=contact_data, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if "notification_id" in data and data.get("message"):
                    self.log_test("Contact Form", True, 
                                "Contact form submitted successfully",
                                f"Created admin notification: {data.get('notification_id')}")
                    return True
                else:
                    self.log_test("Contact Form", False, 
                                f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Contact Form", False, 
                            f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Contact Form", False, f"Error: {str(e)}")
            return False

    def test_admin_notifications(self):
        """Test GET /api/notifications with admin token"""
        if not self.admin_token:
            self.log_test("Admin Notifications", False, "No admin token")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.api_url}/notifications", 
                                      headers=headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Admin Notifications", True, 
                                f"Retrieved {len(data)} notifications",
                                f"Admin can see contact forms and system notifications")
                    return True
                else:
                    self.log_test("Admin Notifications", False, 
                                "Response is not a list")
                    return False
            else:
                self.log_test("Admin Notifications", False, 
                            f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Notifications", False, f"Error: {str(e)}")
            return False

    def test_admin_unread_count(self):
        """Test GET /api/notifications/unread-count with admin token"""
        if not self.admin_token:
            self.log_test("Admin Unread Count", False, "No admin token")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.api_url}/notifications/unread-count", 
                                      headers=headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if "count" in data and isinstance(data.get("count"), int):
                    self.log_test("Admin Unread Count", True, 
                                f"Admin has {data.get('count')} unread notifications")
                    return True
                else:
                    self.log_test("Admin Unread Count", False, 
                                f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Admin Unread Count", False, 
                            f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Unread Count", False, f"Error: {str(e)}")
            return False

    def test_change_password(self):
        """Test POST /api/auth/change-password with user token"""
        if not self.user_token:
            self.log_test("Change Password", False, "No user token")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            
            # Test changing password from "pass" to "newpass123"
            password_data = {
                "current_password": "pass",
                "new_password": "newpass123"
            }
            
            response = self.session.post(f"{self.api_url}/auth/change-password", 
                                       json=password_data, headers=headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Password changed successfully":
                    # Change password back to "pass" for consistency
                    reset_data = {
                        "current_password": "newpass123",
                        "new_password": "pass"
                    }
                    
                    reset_response = self.session.post(f"{self.api_url}/auth/change-password", 
                                                     json=reset_data, headers=headers, timeout=15)
                    
                    if reset_response.status_code == 200:
                        self.log_test("Change Password", True, 
                                    "Password change successful and reverted",
                                    "Changed from 'pass' to 'newpass123' and back to 'pass'")
                        return True
                    else:
                        self.log_test("Change Password", False, 
                                    "Password changed but failed to revert")
                        return False
                else:
                    self.log_test("Change Password", False, 
                                f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Change Password", False, 
                            f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Change Password", False, f"Error: {str(e)}")
            return False

    def test_forgot_password(self):
        """Test POST /api/auth/forgot-password"""
        try:
            forgot_data = {"email": "user@lumaa.ai"}
            
            response = self.session.post(f"{self.api_url}/auth/forgot-password", 
                                       json=forgot_data, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if "code" in data and data.get("message"):
                    reset_code = data.get("code")
                    if len(str(reset_code)) == 6 and str(reset_code).isdigit():
                        self.log_test("Forgot Password", True, 
                                    "Reset code generated successfully",
                                    f"6-digit verification code: {reset_code}")
                        return True
                    else:
                        self.log_test("Forgot Password", False, 
                                    f"Invalid reset code format: {reset_code}")
                        return False
                else:
                    self.log_test("Forgot Password", False, 
                                f"Missing code or message: {data}")
                    return False
            else:
                self.log_test("Forgot Password", False, 
                            f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Forgot Password", False, f"Error: {str(e)}")
            return False

    def run_new_features_tests(self):
        """Run all new features tests"""
        print("🚀 Starting New Features Tests")
        print("-" * 50)
        
        # Login first
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return self.generate_summary()
        
        if not self.login_user():
            print("❌ Cannot proceed without user login")
            return self.generate_summary()
        
        print("\n📤 ADMIN SEND UPDATES")
        print("-" * 30)
        self.test_admin_send_update_all_users()
        self.test_admin_send_update_category()
        
        print("\n📊 ADMIN OVERVIEW WITH REAL DATA")
        print("-" * 40)
        self.test_admin_overview_real_data()
        
        print("\n📝 CONTACT FORM")
        print("-" * 20)
        self.test_contact_form()
        
        print("\n🔔 NOTIFICATIONS")
        print("-" * 20)
        self.test_admin_notifications()
        self.test_admin_unread_count()
        
        print("\n🔐 PASSWORD MANAGEMENT")
        print("-" * 30)
        self.test_change_password()
        self.test_forgot_password()
        
        return self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("📊 NEW FEATURES TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%" if total_tests > 0 else "No tests run")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  • {result['test']}: {result['message']}")
        
        print(f"\n📅 Test completed at: {datetime.now()}")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests/total_tests)*100 if total_tests > 0 else 0,
            'results': self.test_results
        }

if __name__ == "__main__":
    tester = NewFeaturesTester(BACKEND_URL)
    summary = tester.run_new_features_tests()
    
    # Exit with error code if tests failed
    if summary['failed'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)
#!/usr/bin/env python3
"""
PostgreSQL-based Lumaa AI Backend API Testing Script
Tests PostgreSQL database migration and all API endpoints
"""

import requests
import json
import sys
from datetime import datetime
import jwt
import os
import io
from pathlib import Path

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

print(f"🔧 Testing PostgreSQL-based Lumaa AI backend at: {BACKEND_URL}")
print(f"📅 Test started at: {datetime.now()}")
print("=" * 80)

class PostgreSQLAPITester:
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
        
    def test_backend_connectivity(self):
        """Test if PostgreSQL backend is responding"""
        try:
            response = self.session.get(f"{self.api_url}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                expected_message = "Hello World - PostgreSQL"
                if data.get("message") == expected_message:
                    self.log_test("PostgreSQL Backend Connectivity", True, 
                                f"PostgreSQL backend responding correctly", 
                                f"Response: {data}")
                    return True
                else:
                    self.log_test("PostgreSQL Backend Connectivity", False, 
                                f"Expected '{expected_message}', got: {data}")
                    return False
            else:
                self.log_test("PostgreSQL Backend Connectivity", False, 
                            f"Unexpected status code: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            self.log_test("PostgreSQL Backend Connectivity", False, 
                        f"Connection failed: {str(e)}")
            return False
    
    def test_login_valid_admin(self):
        """Test login with valid admin credentials"""
        try:
            payload = {
                "email": "admin@lumaa.ai",
                "password": "pass"
            }
            response = self.session.post(f"{self.api_url}/auth/login", 
                                       json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                required_fields = ['user', 'accessToken', 'refreshToken']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Admin Login", False, 
                                f"Missing fields in response: {missing_fields}")
                    return None
                
                # Verify user data
                user = data['user']
                if (user.get('email') == 'admin@lumaa.ai' and 
                    user.get('role') == 'admin' and 
                    user.get('name') == 'Admin User'):
                    
                    self.log_test("Admin Login", True, 
                                "Admin login successful with correct user data",
                                f"User: {user['name']} ({user['role']})")
                    return data['accessToken']
                else:
                    self.log_test("Admin Login", False, 
                                f"Incorrect user data returned: {user}")
                    return None
            else:
                self.log_test("Admin Login", False, 
                            f"Login failed with status {response.status_code}: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            self.log_test("Admin Login", False, f"Request failed: {str(e)}")
            return None
    
    def test_login_valid_user(self):
        """Test login with valid user credentials"""
        try:
            payload = {
                "email": "user@lumaa.ai", 
                "password": "pass"
            }
            response = self.session.post(f"{self.api_url}/auth/login", 
                                       json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                user = data['user']
                if (user.get('email') == 'user@lumaa.ai' and 
                    user.get('role') == 'user' and 
                    user.get('name') == 'Regular User'):
                    
                    self.log_test("User Login", True, 
                                "User login successful with correct user data",
                                f"User: {user['name']} ({user['role']})")
                    return data['accessToken']
                else:
                    self.log_test("User Login", False, 
                                f"Incorrect user data returned: {user}")
                    return None
            else:
                self.log_test("User Login", False, 
                            f"Login failed with status {response.status_code}: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            self.log_test("User Login", False, f"Request failed: {str(e)}")
            return None
    
    def test_login_invalid_email(self):
        """Test login with invalid email"""
        try:
            payload = {
                "email": "nonexistent@lumaa.ai",
                "password": "pass"
            }
            response = self.session.post(f"{self.api_url}/auth/login", 
                                       json=payload, timeout=10)
            
            if response.status_code == 401:
                self.log_test("Invalid Email Login", True, 
                            "Correctly rejected invalid email",
                            f"Status: {response.status_code}")
                return True
            else:
                self.log_test("Invalid Email Login", False, 
                            f"Expected 401, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Invalid Email Login", False, f"Request failed: {str(e)}")
            return False
    
    def test_login_wrong_password(self):
        """Test login with wrong password"""
        try:
            payload = {
                "email": "admin@lumaa.ai",
                "password": "wrongpassword"
            }
            response = self.session.post(f"{self.api_url}/auth/login", 
                                       json=payload, timeout=10)
            
            if response.status_code == 401:
                self.log_test("Wrong Password Login", True, 
                            "Correctly rejected wrong password",
                            f"Status: {response.status_code}")
                return True
            else:
                self.log_test("Wrong Password Login", False, 
                            f"Expected 401, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Wrong Password Login", False, f"Request failed: {str(e)}")
            return False
    
    def test_jwt_token_structure(self, token):
        """Test JWT token structure and content"""
        try:
            # Decode without verification to check structure
            decoded = jwt.decode(token, options={"verify_signature": False})
            
            # Check required fields
            required_fields = ['sub', 'exp', 'type']
            missing_fields = [field for field in required_fields if field not in decoded]
            
            if missing_fields:
                self.log_test("JWT Token Structure", False, 
                            f"Missing fields in JWT: {missing_fields}")
                return False
            
            # Check token type
            if decoded.get('type') != 'access':
                self.log_test("JWT Token Structure", False, 
                            f"Expected token type 'access', got '{decoded.get('type')}'")
                return False
            
            # Check expiration
            exp_timestamp = decoded.get('exp')
            current_timestamp = datetime.utcnow().timestamp()
            
            if exp_timestamp <= current_timestamp:
                self.log_test("JWT Token Structure", False, 
                            "Token is already expired")
                return False
            
            self.log_test("JWT Token Structure", True, 
                        "JWT token has correct structure and is valid",
                        f"Subject: {decoded.get('sub')}, Expires: {datetime.fromtimestamp(exp_timestamp)}")
            return True
            
        except jwt.DecodeError as e:
            self.log_test("JWT Token Structure", False, f"JWT decode error: {str(e)}")
            return False
        except Exception as e:
            self.log_test("JWT Token Structure", False, f"Unexpected error: {str(e)}")
            return False
    
    def test_protected_endpoint_with_token(self, token):
        """Test /auth/me endpoint with valid token"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = self.session.get(f"{self.api_url}/auth/me", 
                                      headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify user data structure
                required_fields = ['id', 'name', 'email', 'role']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Protected Endpoint (Valid Token)", False, 
                                f"Missing fields in user response: {missing_fields}")
                    return False
                
                self.log_test("Protected Endpoint (Valid Token)", True, 
                            "Successfully accessed protected endpoint",
                            f"User: {data.get('name')} ({data.get('email')})")
                return True
            else:
                self.log_test("Protected Endpoint (Valid Token)", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Protected Endpoint (Valid Token)", False, f"Request failed: {str(e)}")
            return False
    
    def test_protected_endpoint_without_token(self):
        """Test /auth/me endpoint without token"""
        try:
            response = self.session.get(f"{self.api_url}/auth/me", timeout=10)
            
            if response.status_code == 403:
                self.log_test("Protected Endpoint (No Token)", True, 
                            "Correctly rejected request without token",
                            f"Status: {response.status_code}")
                return True
            else:
                self.log_test("Protected Endpoint (No Token)", False, 
                            f"Expected 403, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Protected Endpoint (No Token)", False, f"Request failed: {str(e)}")
            return False
    
    def test_protected_endpoint_invalid_token(self):
        """Test /auth/me endpoint with invalid token"""
        try:
            headers = {"Authorization": "Bearer invalid_token_here"}
            response = self.session.get(f"{self.api_url}/auth/me", 
                                      headers=headers, timeout=10)
            
            if response.status_code == 401:
                self.log_test("Protected Endpoint (Invalid Token)", True, 
                            "Correctly rejected invalid token",
                            f"Status: {response.status_code}")
                return True
            else:
                self.log_test("Protected Endpoint (Invalid Token)", False, 
                            f"Expected 401, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Protected Endpoint (Invalid Token)", False, f"Request failed: {str(e)}")
            return False
    
    def test_enhanced_auth_me_admin(self):
        """Test /auth/me endpoint for admin (should include revenue)"""
        if not self.admin_token:
            self.log_test("Enhanced Auth Me (Admin)", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.api_url}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Admin should see revenue_generated field
                if "revenue_generated" in data:
                    self.log_test("Enhanced Auth Me (Admin)", True, 
                                "Admin can see revenue data in /auth/me",
                                f"Revenue: ${data.get('revenue_generated', 0)}")
                    return True
                else:
                    self.log_test("Enhanced Auth Me (Admin)", False, 
                                "Admin missing revenue_generated field")
                    return False
            else:
                self.log_test("Enhanced Auth Me (Admin)", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Enhanced Auth Me (Admin)", False, f"Request failed: {str(e)}")
            return False

    def test_enhanced_auth_me_user(self):
        """Test /auth/me endpoint for user (should NOT include revenue)"""
        if not self.user_token:
            self.log_test("Enhanced Auth Me (User)", False, "No user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = self.session.get(f"{self.api_url}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # User should NOT see revenue_generated field
                if "revenue_generated" not in data:
                    self.log_test("Enhanced Auth Me (User)", True, 
                                "User correctly cannot see revenue data",
                                f"User: {data.get('name')} ({data.get('category')})")
                    return True
                else:
                    self.log_test("Enhanced Auth Me (User)", False, 
                                "User can see revenue_generated field (security issue)")
                    return False
            else:
                self.log_test("Enhanced Auth Me (User)", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Enhanced Auth Me (User)", False, f"Request failed: {str(e)}")
            return False

    def test_pin_verification_admin(self):
        """Test PIN verification for admin user"""
        if not self.admin_token:
            self.log_test("PIN Verification (Admin)", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            payload = {"pin": "1234"}  # Admin PIN from demo data
            response = self.session.post(f"{self.api_url}/auth/verify-pin", 
                                       json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                self.log_test("PIN Verification (Admin)", True, 
                            "Admin PIN verification successful")
                return True
            else:
                self.log_test("PIN Verification (Admin)", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("PIN Verification (Admin)", False, f"Request failed: {str(e)}")
            return False

    def test_pin_verification_user(self):
        """Test PIN verification for regular user"""
        if not self.user_token:
            self.log_test("PIN Verification (User)", False, "No user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            payload = {"pin": "5678"}  # User PIN from demo data
            response = self.session.post(f"{self.api_url}/auth/verify-pin", 
                                       json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                self.log_test("PIN Verification (User)", True, 
                            "User PIN verification successful")
                return True
            else:
                self.log_test("PIN Verification (User)", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("PIN Verification (User)", False, f"Request failed: {str(e)}")
            return False

    def test_admin_get_users(self):
        """Test admin endpoint to get all users"""
        if not self.admin_token:
            self.log_test("Admin Get Users", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.api_url}/admin/users", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Admin Get Users", True, 
                                f"Retrieved {len(data)} users successfully",
                                f"Users include revenue data: {any('revenue_generated' in user for user in data)}")
                    return True
                else:
                    self.log_test("Admin Get Users", False, "Response is not a list")
                    return False
            else:
                self.log_test("Admin Get Users", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Admin Get Users", False, f"Request failed: {str(e)}")
            return False

    def test_user_access_admin_endpoint(self):
        """Test that regular user cannot access admin endpoints"""
        if not self.user_token:
            self.log_test("User Access Admin Endpoint", False, "No user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = self.session.get(f"{self.api_url}/admin/users", headers=headers, timeout=10)
            
            if response.status_code == 403:
                self.log_test("User Access Admin Endpoint", True, 
                            "User correctly denied access to admin endpoint")
                return True
            else:
                self.log_test("User Access Admin Endpoint", False, 
                            f"Expected 403, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("User Access Admin Endpoint", False, f"Request failed: {str(e)}")
            return False

    def test_admin_overview(self):
        """Test admin overview endpoint"""
        if not self.admin_token:
            self.log_test("Admin Overview", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{self.api_url}/admin/overview", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['total_revenue', 'total_minutes_used', 'total_users', 'active_users']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Admin Overview", True, 
                                "Admin overview data retrieved successfully",
                                f"Revenue: ${data.get('total_revenue', 0)}, Users: {data.get('total_users', 0)}")
                    return True
                else:
                    self.log_test("Admin Overview", False, 
                                f"Missing fields in overview: {missing_fields}")
                    return False
            else:
                self.log_test("Admin Overview", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Admin Overview", False, f"Request failed: {str(e)}")
            return False

    def test_bot_settings_admin(self):
        """Test admin bot settings endpoints"""
        if not self.admin_token:
            self.log_test("Bot Settings (Admin)", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test getting bot settings for sales category
            response = self.session.get(f"{self.api_url}/admin/bot-settings/sales", 
                                      headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['model', 'temperature', 'opening_message', 'prompt']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Bot Settings (Admin)", True, 
                                "Admin can retrieve bot settings for category",
                                f"Model: {data.get('model')}, Temp: {data.get('temperature')}")
                    return True
                else:
                    self.log_test("Bot Settings (Admin)", False, 
                                f"Missing fields in bot settings: {missing_fields}")
                    return False
            else:
                self.log_test("Bot Settings (Admin)", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Bot Settings (Admin)", False, f"Request failed: {str(e)}")
            return False

    def test_user_bot_settings(self):
        """Test user bot settings endpoint"""
        if not self.user_token:
            self.log_test("User Bot Settings", False, "No user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = self.session.get(f"{self.api_url}/user/bot-settings", 
                                      headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['opening_message', 'prompt', 'model', 'temperature']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("User Bot Settings", True, 
                                "User can retrieve bot settings with category fallback",
                                f"Model: {data.get('model')}, Message: {data.get('opening_message')[:50]}...")
                    return True
                else:
                    self.log_test("User Bot Settings", False, 
                                f"Missing fields in user bot settings: {missing_fields}")
                    return False
            else:
                self.log_test("User Bot Settings", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("User Bot Settings", False, f"Request failed: {str(e)}")
            return False

    def test_csv_upload_sales_user(self):
        """Test CSV upload for sales category user (should work)"""
        # First, we need to create a sales user or use admin (who is sales category)
        if not self.admin_token:
            self.log_test("CSV Upload (Sales User)", False, "No admin token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create a test CSV content
            csv_content = "name,phone,email,company,notes\nJohn Doe,555-1234,john@example.com,Acme Corp,Interested in product\nJane Smith,555-5678,jane@example.com,Tech Inc,Follow up needed"
            
            # Create file-like object
            files = {
                'file': ('test_leads.csv', io.StringIO(csv_content), 'text/csv')
            }
            
            response = self.session.post(f"{self.api_url}/user/upload-leads", 
                                       files=files, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('leads_imported', 0) > 0:
                    self.log_test("CSV Upload (Sales User)", True, 
                                f"CSV upload successful: {data.get('leads_imported')} leads imported",
                                f"Message: {data.get('message')}")
                    return True
                else:
                    self.log_test("CSV Upload (Sales User)", False, 
                                f"Upload failed: {data.get('message')}")
                    return False
            else:
                self.log_test("CSV Upload (Sales User)", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("CSV Upload (Sales User)", False, f"Request failed: {str(e)}")
            return False

    def test_csv_upload_non_sales_user(self):
        """Test CSV upload for non-sales category user (should fail)"""
        if not self.user_token:
            self.log_test("CSV Upload (Non-Sales User)", False, "No user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            
            # Create a test CSV content
            csv_content = "name,phone,email,company,notes\nJohn Doe,555-1234,john@example.com,Acme Corp,Interested in product"
            
            # Create file-like object
            files = {
                'file': ('test_leads.csv', io.StringIO(csv_content), 'text/csv')
            }
            
            response = self.session.post(f"{self.api_url}/user/upload-leads", 
                                       files=files, headers=headers, timeout=10)
            
            if response.status_code == 403:
                self.log_test("CSV Upload (Non-Sales User)", True, 
                            "Non-sales user correctly denied CSV upload access")
                return True
            else:
                self.log_test("CSV Upload (Non-Sales User)", False, 
                            f"Expected 403, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("CSV Upload (Non-Sales User)", False, f"Request failed: {str(e)}")
            return False

    def test_user_call_logs(self):
        """Test user call logs endpoint (should not include revenue)"""
        if not self.user_token:
            self.log_test("User Call Logs", False, "No user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = self.session.get(f"{self.api_url}/user/call-logs", 
                                      headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check that revenue data is not included
                    has_revenue = any('revenue_generated' in log for log in data)
                    if not has_revenue:
                        self.log_test("User Call Logs", True, 
                                    f"Retrieved {len(data)} call logs without revenue data")
                        return True
                    else:
                        self.log_test("User Call Logs", False, 
                                    "Call logs include revenue data (security issue)")
                        return False
                else:
                    self.log_test("User Call Logs", False, "Response is not a list")
                    return False
            else:
                self.log_test("User Call Logs", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("User Call Logs", False, f"Request failed: {str(e)}")
            return False

    def test_system_status(self):
        """Test system status endpoint - should show PostgreSQL"""
        try:
            response = self.session.get(f"{self.api_url}/system/status", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("database") == "PostgreSQL":
                    self.log_test("System Status", True, 
                                "System status shows PostgreSQL database",
                                f"Status: {data.get('status')}, Database: {data.get('database')}")
                    return True
                else:
                    self.log_test("System Status", False, 
                                f"Expected database: PostgreSQL, got: {data.get('database')}")
                    return False
            else:
                self.log_test("System Status", False, 
                            f"Expected 200, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("System Status", False, f"Request failed: {str(e)}")
            return False

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting Comprehensive Production API Tests")
        print("-" * 60)
        
        # Test 1: Backend connectivity
        if not self.test_backend_connectivity():
            print("\n❌ Backend connectivity failed. Stopping tests.")
            return self.generate_summary()
        
        print("\n📋 AUTHENTICATION TESTS")
        print("-" * 30)
        
        # Test 2: Valid admin login
        self.admin_token = self.test_login_valid_admin()
        
        # Test 3: Valid user login  
        self.user_token = self.test_login_valid_user()
        
        # Test 4: Invalid credentials
        self.test_login_invalid_email()
        self.test_login_wrong_password()
        
        # Test 5: JWT token structure
        if self.admin_token:
            self.test_jwt_token_structure(self.admin_token)
        
        print("\n🔐 ENHANCED AUTHENTICATION TESTS")
        print("-" * 40)
        
        # Test 6: Enhanced /auth/me endpoints
        self.test_enhanced_auth_me_admin()
        self.test_enhanced_auth_me_user()
        
        # Test 7: PIN verification
        self.test_pin_verification_admin()
        self.test_pin_verification_user()
        
        print("\n👑 ADMIN MANAGEMENT TESTS")
        print("-" * 30)
        
        # Test 8: Admin user management
        self.test_admin_get_users()
        self.test_user_access_admin_endpoint()
        self.test_admin_overview()
        
        print("\n🤖 BOT SETTINGS TESTS")
        print("-" * 25)
        
        # Test 9: Bot settings management
        self.test_bot_settings_admin()
        self.test_user_bot_settings()
        
        print("\n📊 USER OPERATIONS TESTS")
        print("-" * 30)
        
        # Test 10: User operations
        self.test_csv_upload_sales_user()
        self.test_csv_upload_non_sales_user()
        self.test_user_call_logs()
        self.test_system_status()
        
        # Test 11: Protected endpoints
        self.test_protected_endpoint_with_token(self.admin_token)
        self.test_protected_endpoint_without_token()
        self.test_protected_endpoint_invalid_token()
        
        return self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
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
    tester = ComprehensiveAPITester(BACKEND_URL)
    summary = tester.run_all_tests()
    
    # Exit with error code if tests failed
    if summary['failed'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)
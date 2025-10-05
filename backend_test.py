#!/usr/bin/env python3
"""
Backend Authentication Testing Script
Tests JWT-based authentication system for Lumaa AI backend
"""

import requests
import json
import sys
from datetime import datetime
import jwt
import os
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

print(f"🔧 Testing backend at: {BACKEND_URL}")
print(f"📅 Test started at: {datetime.now()}")
print("=" * 60)

class AuthenticationTester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()
        self.test_results = []
        
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
        """Test if backend is responding"""
        try:
            response = self.session.get(f"{self.api_url}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Backend Connectivity", True, 
                            f"Backend responding correctly", 
                            f"Response: {data}")
                return True
            else:
                self.log_test("Backend Connectivity", False, 
                            f"Unexpected status code: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            self.log_test("Backend Connectivity", False, 
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
    
    def run_all_tests(self):
        """Run all authentication tests"""
        print("🚀 Starting Authentication System Tests")
        print("-" * 40)
        
        # Test 1: Backend connectivity
        if not self.test_backend_connectivity():
            print("\n❌ Backend connectivity failed. Stopping tests.")
            return self.generate_summary()
        
        print()
        
        # Test 2: Valid admin login
        admin_token = self.test_login_valid_admin()
        
        # Test 3: Valid user login  
        user_token = self.test_login_valid_user()
        
        # Test 4: Invalid email
        self.test_login_invalid_email()
        
        # Test 5: Wrong password
        self.test_login_wrong_password()
        
        print()
        
        # Test 6: JWT token structure (if we got a token)
        if admin_token:
            self.test_jwt_token_structure(admin_token)
        
        print()
        
        # Test 7: Protected endpoint with valid token
        if admin_token:
            self.test_protected_endpoint_with_token(admin_token)
        
        # Test 8: Protected endpoint without token
        self.test_protected_endpoint_without_token()
        
        # Test 9: Protected endpoint with invalid token
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
    tester = AuthenticationTester(BACKEND_URL)
    summary = tester.run_all_tests()
    
    # Exit with error code if tests failed
    if summary['failed'] > 0:
        sys.exit(1)
    else:
        sys.exit(0)
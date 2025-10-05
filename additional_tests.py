#!/usr/bin/env python3
"""
Additional Edge Case Tests for Production API
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

print(f"🔧 Testing additional edge cases at: {BACKEND_URL}")
print(f"📅 Test started at: {datetime.now()}")
print("=" * 60)

class EdgeCaseTester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None
        
    def get_tokens(self):
        """Get admin and user tokens"""
        # Admin login
        admin_payload = {"email": "admin@lumaa.ai", "password": "pass"}
        admin_response = self.session.post(f"{self.api_url}/auth/login", json=admin_payload)
        if admin_response.status_code == 200:
            self.admin_token = admin_response.json()['accessToken']
            
        # User login
        user_payload = {"email": "user@lumaa.ai", "password": "pass"}
        user_response = self.session.post(f"{self.api_url}/auth/login", json=user_payload)
        if user_response.status_code == 200:
            self.user_token = user_response.json()['accessToken']
    
    def test_blocked_user_login(self):
        """Test that blocked users cannot login"""
        if not self.admin_token:
            print("❌ No admin token for blocking test")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # First, get the list of users to find the regular user ID
            users_response = self.session.get(f"{self.api_url}/admin/users", headers=headers)
            if users_response.status_code != 200:
                print(f"❌ Failed to get users list: {users_response.status_code}")
                return False
                
            users = users_response.json()
            regular_user = next((user for user in users if user['email'] == 'user@lumaa.ai'), None)
            if not regular_user:
                print("❌ Regular user not found in users list")
                return False
                
            user_id = regular_user['id']
            
            # Now try to pause the regular user
            response = self.session.post(f"{self.api_url}/admin/users/{user_id}/pause", headers=headers)
            
            if response.status_code == 200:
                print("✅ User paused successfully")
                
                # Now try to login as the blocked user
                blocked_payload = {"email": "user@lumaa.ai", "password": "pass"}
                login_response = self.session.post(f"{self.api_url}/auth/login", json=blocked_payload)
                
                if login_response.status_code == 401:
                    print("✅ Blocked user correctly denied login")
                    
                    # Resume the user
                    resume_response = self.session.post(f"{self.api_url}/admin/users/2/resume", headers=headers)
                    if resume_response.status_code == 200:
                        print("✅ User resumed successfully")
                        return True
                    else:
                        print(f"❌ Failed to resume user: {resume_response.status_code}")
                        return False
                else:
                    print(f"❌ Blocked user was able to login: {login_response.status_code}")
                    return False
            else:
                print(f"❌ Failed to pause user: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error in blocked user test: {str(e)}")
            return False
    
    def test_global_pause_functionality(self):
        """Test global pause functionality"""
        if not self.admin_token:
            print("❌ No admin token for global pause test")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Pause all users
            pause_response = self.session.post(f"{self.api_url}/admin/pause-all", headers=headers)
            
            if pause_response.status_code == 200:
                print("✅ Global pause activated")
                
                # Try to login as regular user (should fail)
                user_payload = {"email": "user@lumaa.ai", "password": "pass"}
                login_response = self.session.post(f"{self.api_url}/auth/login", json=user_payload)
                
                if login_response.status_code == 503:
                    print("✅ Regular user correctly denied login during global pause")
                    
                    # Admin should still be able to login
                    admin_payload = {"email": "admin@lumaa.ai", "password": "pass"}
                    admin_login_response = self.session.post(f"{self.api_url}/auth/login", json=admin_payload)
                    
                    if admin_login_response.status_code == 200:
                        print("✅ Admin can still login during global pause")
                        
                        # Resume all users
                        resume_response = self.session.post(f"{self.api_url}/admin/resume-all", headers=headers)
                        if resume_response.status_code == 200:
                            print("✅ Global pause deactivated")
                            return True
                        else:
                            print(f"❌ Failed to resume all users: {resume_response.status_code}")
                            return False
                    else:
                        print(f"❌ Admin cannot login during global pause: {admin_login_response.status_code}")
                        return False
                else:
                    print(f"❌ Regular user was able to login during global pause: {login_response.status_code}")
                    return False
            else:
                print(f"❌ Failed to activate global pause: {pause_response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error in global pause test: {str(e)}")
            return False
    
    def test_invalid_pin_operations(self):
        """Test PIN-protected operations with invalid PINs"""
        if not self.user_token:
            print("❌ No user token for PIN test")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            
            # Try to pause bot with wrong PIN
            wrong_pin_payload = {"pin": "0000"}
            pause_response = self.session.post(f"{self.api_url}/user/pause-bot", 
                                             json=wrong_pin_payload, headers=headers)
            
            if pause_response.status_code == 401:
                print("✅ Wrong PIN correctly rejected for bot pause")
                
                # Try to resume bot with wrong PIN
                resume_response = self.session.post(f"{self.api_url}/user/resume-bot", 
                                                  json=wrong_pin_payload, headers=headers)
                
                if resume_response.status_code == 401:
                    print("✅ Wrong PIN correctly rejected for bot resume")
                    return True
                else:
                    print(f"❌ Wrong PIN accepted for bot resume: {resume_response.status_code}")
                    return False
            else:
                print(f"❌ Wrong PIN accepted for bot pause: {pause_response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error in PIN test: {str(e)}")
            return False
    
    def test_user_leads_access(self):
        """Test that users can access their leads"""
        if not self.user_token:
            print("❌ No user token for leads test")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            
            # Get user leads
            response = self.session.get(f"{self.api_url}/user/leads", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"✅ User can access leads: {len(data)} leads found")
                    return True
                else:
                    print("❌ Leads response is not a list")
                    return False
            else:
                print(f"❌ Failed to get user leads: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error in leads test: {str(e)}")
            return False
    
    def run_edge_case_tests(self):
        """Run all edge case tests"""
        print("🚀 Starting Edge Case Tests")
        print("-" * 40)
        
        # Get tokens first
        self.get_tokens()
        
        if not self.admin_token or not self.user_token:
            print("❌ Failed to get required tokens")
            return False
        
        print("✅ Tokens obtained successfully")
        print()
        
        tests = [
            ("Blocked User Login", self.test_blocked_user_login),
            ("Global Pause Functionality", self.test_global_pause_functionality),
            ("Invalid PIN Operations", self.test_invalid_pin_operations),
            ("User Leads Access", self.test_user_leads_access),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"🧪 Testing: {test_name}")
            if test_func():
                passed += 1
            print()
        
        print("=" * 60)
        print(f"📊 EDGE CASE TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        return passed == total

if __name__ == "__main__":
    tester = EdgeCaseTester(BACKEND_URL)
    success = tester.run_edge_case_tests()
    
    if success:
        print("\n🎉 All edge case tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some edge case tests failed!")
        sys.exit(1)
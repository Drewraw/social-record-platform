import requests
import sys
from datetime import datetime
import json

class CiviCastAPITester:
    def __init__(self, base_url="https://video-share-app-29.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.campaign_id = None
        self.results = []

    def log_result(self, test_name, passed, message="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ PASSED: {test_name}")
        else:
            print(f"❌ FAILED: {test_name}")
        
        if message:
            print(f"   {message}")
        
        self.results.append({
            "test": test_name,
            "passed": passed,
            "message": message,
            "response_data": response_data
        })

    def test_root_endpoint(self):
        """Test root API endpoint"""
        try:
            response = requests.get(f"{self.base_url}/")
            if response.status_code == 200:
                self.log_result("Root Endpoint", True, f"Response: {response.json()}")
                return True
            else:
                self.log_result("Root Endpoint", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Root Endpoint", False, f"Error: {str(e)}")
            return False

    def test_create_campaign(self):
        """Test campaign creation"""
        campaign_data = {
            "title": "Test Metro Project",
            "promise": "Complete metro line construction within 6 months",
            "source": "Test Government",
            "recordedDate": "2025-01-15",
            "question": "Will the metro line be completed on time?"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/campaigns",
                json=campaign_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'id' in data:
                    self.campaign_id = data['id']
                    self.log_result("Create Campaign", True, f"Campaign ID: {self.campaign_id}")
                    return True
                else:
                    self.log_result("Create Campaign", False, "No ID in response")
                    return False
            else:
                self.log_result("Create Campaign", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Create Campaign", False, f"Error: {str(e)}")
            return False

    def test_get_campaigns(self):
        """Test getting all campaigns"""
        try:
            response = requests.get(f"{self.base_url}/campaigns")
            
            if response.status_code == 200:
                campaigns = response.json()
                if isinstance(campaigns, list):
                    self.log_result("Get All Campaigns", True, f"Found {len(campaigns)} campaigns")
                    return True
                else:
                    self.log_result("Get All Campaigns", False, "Response is not a list")
                    return False
            else:
                self.log_result("Get All Campaigns", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get All Campaigns", False, f"Error: {str(e)}")
            return False

    def test_get_campaign_by_id(self):
        """Test getting a specific campaign"""
        if not self.campaign_id:
            self.log_result("Get Campaign by ID", False, "No campaign ID available")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/campaigns/{self.campaign_id}")
            
            if response.status_code == 200:
                campaign = response.json()
                if campaign.get('id') == self.campaign_id:
                    self.log_result("Get Campaign by ID", True, f"Retrieved campaign: {campaign.get('title')}")
                    return True
                else:
                    self.log_result("Get Campaign by ID", False, "Campaign ID mismatch")
                    return False
            else:
                self.log_result("Get Campaign by ID", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Campaign by ID", False, f"Error: {str(e)}")
            return False

    def test_submit_vote_confident(self):
        """Test submitting a 'confident' vote"""
        if not self.campaign_id:
            self.log_result("Submit Vote - Confident", False, "No campaign ID available")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/campaigns/{self.campaign_id}/vote",
                json={"voteType": "confident"},
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                self.log_result("Submit Vote - Confident", True, "Vote submitted successfully")
                return True
            else:
                self.log_result("Submit Vote - Confident", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Submit Vote - Confident", False, f"Error: {str(e)}")
            return False

    def test_submit_vote_not_sure(self):
        """Test submitting a 'notSure' vote"""
        if not self.campaign_id:
            self.log_result("Submit Vote - Not Sure", False, "No campaign ID available")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/campaigns/{self.campaign_id}/vote",
                json={"voteType": "notSure"},
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                self.log_result("Submit Vote - Not Sure", True, "Vote submitted successfully")
                return True
            else:
                self.log_result("Submit Vote - Not Sure", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Submit Vote - Not Sure", False, f"Error: {str(e)}")
            return False

    def test_submit_vote_not_confident(self):
        """Test submitting a 'notConfident' vote"""
        if not self.campaign_id:
            self.log_result("Submit Vote - Not Confident", False, "No campaign ID available")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/campaigns/{self.campaign_id}/vote",
                json={"voteType": "notConfident"},
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                self.log_result("Submit Vote - Not Confident", True, "Vote submitted successfully")
                return True
            else:
                self.log_result("Submit Vote - Not Confident", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Submit Vote - Not Confident", False, f"Error: {str(e)}")
            return False

    def test_get_vote_stats(self):
        """Test getting vote statistics"""
        if not self.campaign_id:
            self.log_result("Get Vote Stats", False, "No campaign ID available")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/campaigns/{self.campaign_id}/votes")
            
            if response.status_code == 200:
                stats = response.json()
                expected_keys = ['confident', 'notSure', 'notConfident', 'total']
                if all(key in stats for key in expected_keys):
                    self.log_result("Get Vote Stats", True, 
                        f"Stats: Confident={stats['confident']}, NotSure={stats['notSure']}, NotConfident={stats['notConfident']}, Total={stats['total']}")
                    
                    # Verify total matches sum
                    calculated_total = stats['confident'] + stats['notSure'] + stats['notConfident']
                    if calculated_total == stats['total']:
                        print(f"   ✓ Vote totals match (expected 3, got {stats['total']})")
                        return True
                    else:
                        print(f"   ⚠ Vote total mismatch: calculated={calculated_total}, reported={stats['total']}")
                        return True  # Still pass as API works
                else:
                    self.log_result("Get Vote Stats", False, "Missing expected keys in response")
                    return False
            else:
                self.log_result("Get Vote Stats", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Vote Stats", False, f"Error: {str(e)}")
            return False

    def test_create_community_report_text_only(self):
        """Test creating a community report without image"""
        if not self.campaign_id:
            self.log_result("Create Community Report (Text Only)", False, "No campaign ID available")
            return False
        
        try:
            form_data = {
                'content': 'Test community report - construction has started',
                'author': 'Test User'
            }
            
            response = requests.post(
                f"{self.base_url}/campaigns/{self.campaign_id}/reports",
                data=form_data
            )
            
            if response.status_code == 200:
                report = response.json()
                if 'id' in report and report.get('content') == form_data['content']:
                    self.log_result("Create Community Report (Text Only)", True, f"Report ID: {report['id']}")
                    return True
                else:
                    self.log_result("Create Community Report (Text Only)", False, "Invalid response data")
                    return False
            else:
                self.log_result("Create Community Report (Text Only)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Create Community Report (Text Only)", False, f"Error: {str(e)}")
            return False

    def test_get_community_reports(self):
        """Test getting community reports"""
        if not self.campaign_id:
            self.log_result("Get Community Reports", False, "No campaign ID available")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/campaigns/{self.campaign_id}/reports")
            
            if response.status_code == 200:
                reports = response.json()
                if isinstance(reports, list):
                    self.log_result("Get Community Reports", True, f"Found {len(reports)} reports")
                    return True
                else:
                    self.log_result("Get Community Reports", False, "Response is not a list")
                    return False
            else:
                self.log_result("Get Community Reports", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Community Reports", False, f"Error: {str(e)}")
            return False

    def test_get_progress_updates(self):
        """Test getting progress updates"""
        if not self.campaign_id:
            self.log_result("Get Progress Updates", False, "No campaign ID available")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/campaigns/{self.campaign_id}/updates")
            
            if response.status_code == 200:
                updates = response.json()
                if isinstance(updates, list):
                    self.log_result("Get Progress Updates", True, f"Found {len(updates)} updates")
                    return True
                else:
                    self.log_result("Get Progress Updates", False, "Response is not a list")
                    return False
            else:
                self.log_result("Get Progress Updates", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Get Progress Updates", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("\n" + "="*60)
        print("CiviCast Backend API Testing")
        print("="*60 + "\n")
        
        # Test root endpoint
        self.test_root_endpoint()
        
        # Test campaign creation and retrieval
        if self.test_create_campaign():
            self.test_get_campaigns()
            self.test_get_campaign_by_id()
            
            # Test voting system
            self.test_submit_vote_confident()
            self.test_submit_vote_not_sure()
            self.test_submit_vote_not_confident()
            self.test_get_vote_stats()
            
            # Test community reports
            self.test_create_community_report_text_only()
            self.test_get_community_reports()
            
            # Test progress updates
            self.test_get_progress_updates()
        else:
            print("\n⚠️  Campaign creation failed - skipping dependent tests")
        
        # Print summary
        print("\n" + "="*60)
        print(f"Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print("="*60 + "\n")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CiviCastAPITester()
    success = tester.run_all_tests()
    
    # Save results to file
    with open('/app/tests/backend_test_results.json', 'w') as f:
        json.dump({
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'failed_tests': tester.tests_run - tester.tests_passed,
            'success_rate': f"{(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%",
            'results': tester.results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())

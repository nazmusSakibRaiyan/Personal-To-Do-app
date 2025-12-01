#!/bin/bash
# Email Integration Testing Guide
# Save as: test-email.sh

echo "=========================================="
echo "Email Integration Test Suite"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:8000/api"

# Test 1: Check email status
echo -e "${YELLOW}Test 1: Checking Email Status${NC}"
echo "GET $API_URL/email/status"
curl -s -X GET "$API_URL/email/status" | python3 -m json.tool
echo ""
echo ""

# Test 2: Configure email (replace with your details)
echo -e "${YELLOW}Test 2: Configuring Email${NC}"
echo "POST $API_URL/email/configure"
echo "⚠️  Update the email and password below with your credentials:"
echo ""

read -p "Enter your Gmail address: " EMAIL_ADDRESS
read -sp "Enter your 16-character app password: " APP_PASSWORD
echo ""
echo ""

curl -s -X POST "$API_URL/email/configure" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL_ADDRESS\",
    \"password\": \"$APP_PASSWORD\",
    \"smtp_server\": \"smtp.gmail.com\",
    \"smtp_port\": 587
  }" | python3 -m json.tool
echo ""
echo ""

# Test 3: Verify configuration
echo -e "${YELLOW}Test 3: Verifying Configuration${NC}"
echo "GET $API_URL/email/status"
curl -s -X GET "$API_URL/email/status" | python3 -m json.tool
echo ""
echo ""

# Test 4: Send task reminder
echo -e "${YELLOW}Test 4: Sending Task Reminder${NC}"
echo "POST $API_URL/email/task-reminder"
curl -s -X POST "$API_URL/email/task-reminder" \
  -H "Content-Type: application/json" \
  -d "{
    \"to_email\": \"$EMAIL_ADDRESS\",
    \"task_title\": \"Complete Project Report\",
    \"due_date\": \"2025-12-20\",
    \"priority\": \"high\"
  }" | python3 -m json.tool
echo ""
echo -e "${GREEN}✓ Check your email for the task reminder${NC}"
echo ""
echo ""

# Test 5: Send task completion notification
echo -e "${YELLOW}Test 5: Sending Task Completion Notification${NC}"
echo "POST $API_URL/email/task-completed"
curl -s -X POST "$API_URL/email/task-completed" \
  -H "Content-Type: application/json" \
  -d "{
    \"to_email\": \"$EMAIL_ADDRESS\",
    \"task_title\": \"Complete Project Report\"
  }" | python3 -m json.tool
echo ""
echo -e "${GREEN}✓ Check your email for the completion notification${NC}"
echo ""
echo ""

# Test 6: Send daily summary
echo -e "${YELLOW}Test 6: Sending Daily Summary${NC}"
echo "POST $API_URL/email/daily-summary"
curl -s -X POST "$API_URL/email/daily-summary" \
  -H "Content-Type: application/json" \
  -d "{
    \"to_email\": \"$EMAIL_ADDRESS\",
    \"tasks_count\": 15,
    \"completed_count\": 9
  }" | python3 -m json.tool
echo ""
echo -e "${GREEN}✓ Check your email for the daily summary${NC}"
echo ""
echo ""

# Test 7: Send custom email
echo -e "${YELLOW}Test 7: Sending Custom Email${NC}"
echo "POST $API_URL/email/send"
curl -s -X POST "$API_URL/email/send" \
  -H "Content-Type: application/json" \
  -d "{
    \"to_email\": \"$EMAIL_ADDRESS\",
    \"subject\": \"Test Email from Smart To-Do App\",
    \"body\": \"<html><body><h1>Hello!</h1><p>This is a test email from your Smart To-Do App.</p><p style='color: green;'><strong>✓ Email integration is working!</strong></p></body></html>\"
  }" | python3 -m json.tool
echo ""
echo -e "${GREEN}✓ Check your email for the custom message${NC}"
echo ""
echo ""

echo "=========================================="
echo -e "${GREEN}All Tests Complete!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "✓ Email configuration"
echo "✓ Task reminder email"
echo "✓ Completion notification"
echo "✓ Daily summary"
echo "✓ Custom email"
echo ""
echo "Check your inbox for all 4 test emails!"
echo ""

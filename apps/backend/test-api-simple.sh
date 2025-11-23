#!/bin/bash

# Simple API Test - with user creation
BASE_URL="http://localhost:4000/api"

echo "🧪 AI Flow API Test (Simplified)"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Create test user (if doesn't exist)
echo -e "${BLUE}Step 1: Creating/Using test user${NC}"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="Test123!@#"

echo "Attempting to create test user..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"Test User\"
  }")

echo "$SIGNUP_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNUP_RESPONSE"
echo ""

# Step 2: Login to get token
echo -e "${BLUE}Step 2: Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Login response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token (try multiple field names)
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken // .token // .access_token // .jwt // empty' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Failed to get token. Response was:${NC}"
  echo "$LOGIN_RESPONSE"
  echo ""
  echo -e "${YELLOW}Trying magic link instead...${NC}"
  
  MAGIC_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/magic-link/request" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\"}")
  
  echo "$MAGIC_RESPONSE" | jq '.' 2>/dev/null || echo "$MAGIC_RESPONSE"
  echo ""
  echo "Check your email and get the token, then run:"
  echo "  export TOKEN='your-token-here'"
  echo "  ./test-api-simple.sh"
  exit 1
fi

echo -e "${GREEN}✅ Got token: ${TOKEN:0:30}...${NC}"
echo ""

# Test 3: Create Chat
echo -e "${BLUE}Test 3: Create Chat${NC}"
CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/chats" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstMessage": "Book a flight from San Francisco to New York City"
  }')

echo "$CHAT_RESPONSE" | jq '.'
CHAT_ID=$(echo "$CHAT_RESPONSE" | jq -r '.id // empty')

if [ -z "$CHAT_ID" ] || [ "$CHAT_ID" = "null" ]; then
  echo -e "${RED}❌ Failed to create chat${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Chat created: $CHAT_ID${NC}"
echo ""

# Test 4: Get Chat
echo -e "${BLUE}Test 4: Get Chat Details${NC}"
curl -s -X GET "$BASE_URL/chats/$CHAT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 5: Create Task
echo -e "${BLUE}Test 5: Create Task in Chat${NC}"
TASK_RESPONSE=$(curl -s -X POST "$BASE_URL/chats/$CHAT_ID/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "intent": "Find flights under $500 departing next week",
    "priority": "HIGH"
  }')

echo "$TASK_RESPONSE" | jq '.'
TASK_ID=$(echo "$TASK_RESPONSE" | jq -r '.id // empty')

if [ -z "$TASK_ID" ] || [ "$TASK_ID" = "null" ]; then
  echo -e "${RED}❌ Failed to create task${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Task created: $TASK_ID${NC}"
echo ""

# Test 6: Get Task Details
echo -e "${BLUE}Test 6: Get Task Details & Status${NC}"
curl -s -X GET "$BASE_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 7: Get Task Logs
echo -e "${BLUE}Test 7: Get Task Logs${NC}"
LOGS=$(curl -s -X GET "$BASE_URL/tasks/$TASK_ID/logs" \
  -H "Authorization: Bearer $TOKEN")
echo "$LOGS" | jq '.'
LOG_COUNT=$(echo "$LOGS" | jq 'length')
echo -e "${GREEN}Found $LOG_COUNT log entries${NC}"
echo ""

# Test 8: Create Follow-up Task
echo -e "${BLUE}Test 8: Create Follow-up Task (Testing Context)${NC}"
TASK2_RESPONSE=$(curl -s -X POST "$BASE_URL/chats/$CHAT_ID/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "intent": "Actually make it business class instead"
  }')

echo "$TASK2_RESPONSE" | jq '.'
TASK2_ID=$(echo "$TASK2_RESPONSE" | jq -r '.id // empty')
echo -e "${GREEN}✅ Follow-up task created: $TASK2_ID${NC}"
echo ""

# Test 9: List All Tasks in Chat
echo -e "${BLUE}Test 9: List All Tasks in Chat${NC}"
TASKS=$(curl -s -X GET "$BASE_URL/chats/$CHAT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN")
echo "$TASKS" | jq '.'
TASK_COUNT=$(echo "$TASKS" | jq 'length')
echo -e "${GREEN}Chat has $TASK_COUNT tasks${NC}"
echo ""

# Test 10: List All Chats
echo -e "${BLUE}Test 10: List All Chats (Sidebar View)${NC}"
curl -s -X GET "$BASE_URL/chats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 11: Generate Chat Summary
echo -e "${BLUE}Test 11: Generate AI Summary${NC}"
SUMMARY=$(curl -s -X POST "$BASE_URL/chats/$CHAT_ID/summary" \
  -H "Authorization: Bearer $TOKEN")
echo "$SUMMARY" | jq '.'
echo ""

echo -e "${GREEN}=================================="
echo "✅ All tests completed!"
echo ""
echo "Summary:"
echo "  Chat ID: $CHAT_ID"
echo "  Task 1 ID: $TASK_ID"
echo "  Task 2 ID: $TASK2_ID"
echo "  Total Tasks: $TASK_COUNT"
echo "  Total Logs: $LOG_COUNT"
echo "==================================${NC}"

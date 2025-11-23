#!/bin/bash

# AI Flow Task & Chat API Test Script
# Tests the complete chat-based task management system

BASE_URL="http://localhost:4000/api"
TOKEN="fea9e4ec-24b0-4d8c-8f3b-30114c4d2543"  # Will be set after login

echo "🧪 Testing AI Flow Task & Chat API"
echo "=================================="
echo ""

# Step 0: Login first to get token
echo -e "${YELLOW}Step 0: Login to get JWT token${NC}"
read -p "Enter your email: " USER_EMAIL
read -sp "Enter your password: " USER_PASSWORD
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASSWORD\"
  }")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken // .token // .access_token // empty')

if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}⚠️  No token found. Trying magic link authentication...${NC}"
  echo ""
  
  # Try magic link request
  echo "Requesting magic link for $USER_EMAIL..."
  curl -s -X POST "$BASE_URL/auth/magic-link/request" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$USER_EMAIL\"}" | jq '.'
  
  echo ""
  echo "Check your email for the magic link, then enter the token from the link:"
  read -p "Enter token from magic link: " TOKEN
  
  if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  No token provided. Continuing without auth (will fail)${NC}"
  fi
else
  echo -e "${GREEN}✅ Logged in successfully!${NC}"
fi

echo ""
echo "Using token: ${TOKEN:0:20}..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Create a new chat
echo -e "${BLUE}Test 1: Create New Chat${NC}"
CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/chats" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstMessage": "Book a flight from San Francisco to New York City"
  }')

echo "$CHAT_RESPONSE" | jq '.'
CHAT_ID=$(echo "$CHAT_RESPONSE" | jq -r '.id')
echo -e "${GREEN}✅ Chat created with ID: $CHAT_ID${NC}"
echo ""

# Test 2: List all chats
echo -e "${BLUE}Test 2: List All Chats${NC}"
curl -s -X GET "$BASE_URL/chats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 3: Get specific chat details
echo -e "${BLUE}Test 3: Get Chat Details${NC}"
curl -s -X GET "$BASE_URL/chats/$CHAT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 4: Create a task in the chat
echo -e "${BLUE}Test 4: Create Task in Chat${NC}"
TASK_RESPONSE=$(curl -s -X POST "$BASE_URL/chats/$CHAT_ID/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "intent": "Search for flights under $500",
    "priority": "HIGH"
  }')

echo "$TASK_RESPONSE" | jq '.'
TASK_ID=$(echo "$TASK_RESPONSE" | jq -r '.id')
echo -e "${GREEN}✅ Task created with ID: $TASK_ID${NC}"
echo ""

# Test 5: Get task details
echo -e "${BLUE}Test 5: Get Task Details${NC}"
curl -s -X GET "$BASE_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 6: Get task logs
echo -e "${BLUE}Test 6: Get Task Logs${NC}"
curl -s -X GET "$BASE_URL/tasks/$TASK_ID/logs" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 7: Create follow-up task in same chat
echo -e "${BLUE}Test 7: Create Follow-up Task${NC}"
TASK2_RESPONSE=$(curl -s -X POST "$BASE_URL/chats/$CHAT_ID/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "intent": "Actually, make it business class"
  }')

echo "$TASK2_RESPONSE" | jq '.'
TASK2_ID=$(echo "$TASK2_RESPONSE" | jq -r '.id')
echo -e "${GREEN}✅ Follow-up task created with ID: $TASK2_ID${NC}"
echo ""

# Test 8: List all tasks in chat
echo -e "${BLUE}Test 8: List All Tasks in Chat${NC}"
curl -s -X GET "$BASE_URL/chats/$CHAT_ID/tasks" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 9: Pause task
echo -e "${BLUE}Test 9: Pause Task${NC}"
curl -s -X POST "$BASE_URL/tasks/$TASK_ID/pause" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 10: Resume task
echo -e "${BLUE}Test 10: Resume Task${NC}"
curl -s -X POST "$BASE_URL/tasks/$TASK_ID/resume" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# Test 11: Generate chat summary
echo -e "${BLUE}Test 11: Generate Chat Summary${NC}"
curl -s -X POST "$BASE_URL/chats/$CHAT_ID/summary" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

echo -e "${GREEN}=================================="
echo -e "✅ All API tests completed!"
echo -e "==================================${NC}"

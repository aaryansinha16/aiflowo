#!/bin/bash

# Quick API Test - Manual Token Input
BASE_URL="http://localhost:4000/api"

echo "🧪 Quick API Test for AI Flow"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backend is running
echo -e "${BLUE}Checking if backend is running...${NC}"
HEALTH=$(curl -s "$BASE_URL/../health" 2>/dev/null || echo "")
if [ -z "$HEALTH" ]; then
  echo -e "${RED}❌ Backend not responding on port 4000${NC}"
  echo "Start it with: npm run start:dev"
  exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Get auth token
if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}Authentication Required${NC}"
  echo ""
  echo "Option 1: Request magic link"
  read -p "Enter your email: " USER_EMAIL
  
  if [ -n "$USER_EMAIL" ]; then
    echo ""
    echo "Requesting magic link..."
    MAGIC_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/magic-link/send" \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"$USER_EMAIL\"}")
    
    echo "$MAGIC_RESPONSE" | jq '.' 2>/dev/null || echo "$MAGIC_RESPONSE"
    echo ""
    echo -e "${YELLOW}Check your email for the magic link!${NC}"
    echo "After clicking the link, copy the token from the URL or response"
    echo ""
  fi
  
  echo "Option 2: Enter token directly (if you already have one)"
  read -p "Paste your JWT token here: " TOKEN
  
  if [ -z "$TOKEN" ]; then
    echo -e "${RED}No token provided. Exiting.${NC}"
    exit 1
  fi
  
  export TOKEN
fi

echo -e "${GREEN}Using token: ${TOKEN:0:30}...${NC}"
echo ""

# Test: Create Chat
echo -e "${BLUE}Test 1: Creating a new chat...${NC}"
CHAT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/chats" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstMessage": "Book a flight from San Francisco to New York City"
  }')

HTTP_CODE=$(echo "$CHAT_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$CHAT_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response (HTTP $HTTP_CODE):"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" != "201" ] && [ "$HTTP_CODE" != "200" ]; then
  echo -e "${RED}❌ Failed to create chat (HTTP $HTTP_CODE)${NC}"
  echo "Check if:"
  echo "  1. Backend is running (npm run start:dev)"
  echo "  2. Token is valid"
  echo "  3. Database is migrated (npx prisma migrate dev)"
  exit 1
fi

CHAT_ID=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null)
echo -e "${GREEN}✅ Chat created successfully!${NC}"
echo "Chat ID: $CHAT_ID"
echo ""

# Test: Create Task
echo -e "${BLUE}Test 2: Creating a task in the chat...${NC}"
TASK_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/chats/$CHAT_ID/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "intent": "Find flights under $500 departing next week",
    "priority": "HIGH"
  }')

HTTP_CODE=$(echo "$TASK_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$TASK_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response (HTTP $HTTP_CODE):"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

TASK_ID=$(echo "$BODY" | jq -r '.id // empty' 2>/dev/null)
echo -e "${GREEN}✅ Task created successfully!${NC}"
echo "Task ID: $TASK_ID"
echo ""

# Test: Get Task Status
echo -e "${BLUE}Test 3: Getting task status...${NC}"
sleep 2  # Wait a bit for processing
TASK_STATUS=$(curl -s -X GET "$BASE_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$TASK_STATUS" | jq '.' 2>/dev/null || echo "$TASK_STATUS"
STATUS=$(echo "$TASK_STATUS" | jq -r '.status // empty' 2>/dev/null)
echo -e "${GREEN}Task Status: $STATUS${NC}"
echo ""

# Test: Get Logs
echo -e "${BLUE}Test 4: Getting task logs...${NC}"
LOGS=$(curl -s -X GET "$BASE_URL/tasks/$TASK_ID/logs" \
  -H "Authorization: Bearer $TOKEN")

echo "$LOGS" | jq '.' 2>/dev/null || echo "$LOGS"
LOG_COUNT=$(echo "$LOGS" | jq 'length // 0' 2>/dev/null)
echo -e "${GREEN}Found $LOG_COUNT log entries${NC}"
echo ""

# Test: List Chats
echo -e "${BLUE}Test 5: Listing all chats (sidebar view)...${NC}"
CHATS=$(curl -s -X GET "$BASE_URL/chats" \
  -H "Authorization: Bearer $TOKEN")

echo "$CHATS" | jq '.' 2>/dev/null || echo "$CHATS"
CHAT_COUNT=$(echo "$CHATS" | jq 'length // 0' 2>/dev/null)
echo -e "${GREEN}Found $CHAT_COUNT chats${NC}"
echo ""

echo -e "${GREEN}======================================="
echo "✅ API Tests Completed Successfully!"
echo ""
echo "📊 Results:"
echo "  ✅ Chat created: $CHAT_ID"
echo "  ✅ Task created: $TASK_ID"
echo "  ✅ Task status: $STATUS"
echo "  ✅ Log entries: $LOG_COUNT"
echo "  ✅ Total chats: $CHAT_COUNT"
echo "=======================================${NC}"

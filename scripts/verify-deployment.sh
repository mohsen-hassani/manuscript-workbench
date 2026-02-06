#!/bin/bash

# Manuscript Workbench Deployment Verification Script
# Run this after deployment to verify all components are working

set -e

DOMAIN="${1:-manuscript-workbench.codebnb.me}"
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}Manuscript Workbench Deployment Verification${COLOR_RESET}"
echo -e "${COLOR_BLUE}Domain: $DOMAIN${COLOR_RESET}"
echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Function to print test result
print_result() {
    local test_name=$1
    local result=$2
    local message=$3

    if [ "$result" = "PASS" ]; then
        echo -e "${COLOR_GREEN}✓${COLOR_RESET} $test_name"
        ((PASS_COUNT++))
    elif [ "$result" = "FAIL" ]; then
        echo -e "${COLOR_RED}✗${COLOR_RESET} $test_name"
        if [ -n "$message" ]; then
            echo -e "  ${COLOR_RED}Error: $message${COLOR_RESET}"
        fi
        ((FAIL_COUNT++))
    elif [ "$result" = "WARN" ]; then
        echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} $test_name"
        if [ -n "$message" ]; then
            echo -e "  ${COLOR_YELLOW}Warning: $message${COLOR_RESET}"
        fi
        ((WARN_COUNT++))
    fi
}

# Test 1: Frontend HTTPS
echo -e "${COLOR_BLUE}Testing Frontend...${COLOR_RESET}"
if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/" | grep -q "200"; then
    print_result "Frontend HTTPS accessible" "PASS"
else
    print_result "Frontend HTTPS accessible" "FAIL" "Cannot reach https://$DOMAIN/"
fi

# Test 2: HTTP to HTTPS redirect
HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN/" || echo "000")
if [ "$HTTP_REDIRECT" = "301" ] || [ "$HTTP_REDIRECT" = "302" ]; then
    print_result "HTTP to HTTPS redirect" "PASS"
else
    print_result "HTTP to HTTPS redirect" "WARN" "HTTP didn't redirect (got $HTTP_REDIRECT)"
fi

# Test 3: SSL certificate
if echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | grep -q "Verify return code: 0"; then
    print_result "SSL certificate valid" "PASS"
else
    print_result "SSL certificate valid" "FAIL" "SSL certificate verification failed"
fi

echo ""
echo -e "${COLOR_BLUE}Testing Backend...${COLOR_RESET}"

# Test 4: Backend health endpoint
HEALTH_RESPONSE=$(curl -s "https://$DOMAIN/health")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    print_result "Backend health endpoint" "PASS"
else
    print_result "Backend health endpoint" "FAIL" "Response: $HEALTH_RESPONSE"
fi

# Test 5: API documentation
if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/docs" | grep -q "200"; then
    print_result "API documentation accessible" "PASS"
else
    print_result "API documentation accessible" "WARN" "API docs not accessible"
fi

echo ""
echo -e "${COLOR_BLUE}Testing Security Headers...${COLOR_RESET}"

# Test 6: HSTS header
if curl -s -I "https://$DOMAIN/" | grep -i "Strict-Transport-Security" | grep -q "max-age"; then
    print_result "HSTS header present" "PASS"
else
    print_result "HSTS header present" "FAIL" "HSTS header missing"
fi

# Test 7: X-Frame-Options
if curl -s -I "https://$DOMAIN/" | grep -i "X-Frame-Options" | grep -q "SAMEORIGIN"; then
    print_result "X-Frame-Options header" "PASS"
else
    print_result "X-Frame-Options header" "WARN" "X-Frame-Options header missing or incorrect"
fi

# Test 8: X-Content-Type-Options
if curl -s -I "https://$DOMAIN/" | grep -i "X-Content-Type-Options" | grep -q "nosniff"; then
    print_result "X-Content-Type-Options header" "PASS"
else
    print_result "X-Content-Type-Options header" "WARN" "X-Content-Type-Options header missing"
fi

echo ""
echo -e "${COLOR_BLUE}Testing Docker Services...${COLOR_RESET}"

# Test 9: Backend container running
if docker-compose -f docker-compose.prod.yml ps backend 2>/dev/null | grep -q "Up"; then
    print_result "Backend container running" "PASS"
else
    print_result "Backend container running" "FAIL" "Backend container not running"
fi

# Test 10: Database container running
if docker-compose -f docker-compose.prod.yml ps db 2>/dev/null | grep -q "Up"; then
    print_result "Database container running" "PASS"
else
    print_result "Database container running" "FAIL" "Database container not running"
fi

# Test 11: Backend localhost binding
if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:18100/health" | grep -q "200"; then
    print_result "Backend localhost access (18100)" "PASS"
else
    print_result "Backend localhost access (18100)" "FAIL" "Cannot access backend on localhost:18100"
fi

echo ""
echo -e "${COLOR_BLUE}Testing File System...${COLOR_RESET}"

# Test 12: Storage directory exists
if [ -d "backend/storage" ]; then
    print_result "Storage directory exists" "PASS"
else
    print_result "Storage directory exists" "WARN" "Storage directory not found"
fi

# Test 13: Frontend build exists
if [ -f "frontend/dist/index.html" ]; then
    print_result "Frontend build exists" "PASS"
else
    print_result "Frontend build exists" "FAIL" "Frontend build not found (run npm run build)"
fi

# Test 14: .env.production exists
if [ -f "backend/.env.production" ]; then
    print_result ".env.production exists" "PASS"

    # Check if it has been configured (not using defaults)
    if grep -q "CHANGE_THIS" backend/.env.production; then
        print_result ".env.production configured" "FAIL" "Contains placeholder values (CHANGE_THIS)"
    else
        print_result ".env.production configured" "PASS"
    fi
else
    print_result ".env.production exists" "FAIL" ".env.production not found"
fi

echo ""
echo -e "${COLOR_BLUE}Testing WebSocket Endpoint...${COLOR_RESET}"

# Test 15: WebSocket endpoint (should return 426 Upgrade Required for HTTP)
WS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/chat/ws" || echo "000")
if [ "$WS_RESPONSE" = "426" ] || [ "$WS_RESPONSE" = "400" ] || [ "$WS_RESPONSE" = "401" ]; then
    print_result "WebSocket endpoint exists" "PASS"
    echo -e "  ${COLOR_YELLOW}Note: Actual WebSocket connection requires JWT token and browser testing${COLOR_RESET}"
else
    print_result "WebSocket endpoint exists" "FAIL" "Got HTTP $WS_RESPONSE (expected 426/400/401)"
fi

echo ""
echo -e "${COLOR_BLUE}Testing Monitoring Setup...${COLOR_RESET}"

# Test 16: Backup script exists and is executable
if [ -x "scripts/backup.sh" ]; then
    print_result "Backup script executable" "PASS"
else
    print_result "Backup script executable" "WARN" "Backup script not executable (run: chmod +x scripts/backup.sh)"
fi

# Test 17: Health check script exists and is executable
if [ -x "scripts/health-check.sh" ]; then
    print_result "Health check script executable" "PASS"
else
    print_result "Health check script executable" "WARN" "Health check script not executable (run: chmod +x scripts/health-check.sh)"
fi

# Test 18: Crontab configured
if crontab -l 2>/dev/null | grep -q "backup.sh"; then
    print_result "Backup cron job configured" "PASS"
else
    print_result "Backup cron job configured" "WARN" "Backup not scheduled in crontab"
fi

if crontab -l 2>/dev/null | grep -q "health-check.sh"; then
    print_result "Health check cron job configured" "PASS"
else
    print_result "Health check cron job configured" "WARN" "Health check not scheduled in crontab"
fi

echo ""
echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo -e "${COLOR_BLUE}Summary${COLOR_RESET}"
echo -e "${COLOR_BLUE}========================================${COLOR_RESET}"
echo -e "${COLOR_GREEN}Passed: $PASS_COUNT${COLOR_RESET}"
echo -e "${COLOR_YELLOW}Warnings: $WARN_COUNT${COLOR_RESET}"
echo -e "${COLOR_RED}Failed: $FAIL_COUNT${COLOR_RESET}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${COLOR_GREEN}✓ Deployment verification completed successfully!${COLOR_RESET}"
    echo ""
    echo -e "${COLOR_BLUE}Next Steps:${COLOR_RESET}"
    echo "1. Test login at https://$DOMAIN"
    echo "2. Test WebSocket chat in browser (most critical)"
    echo "3. Test file upload/download"
    echo "4. Review deployment-notes.md for manual browser tests"
    exit 0
else
    echo -e "${COLOR_RED}✗ Deployment verification failed with $FAIL_COUNT error(s)${COLOR_RESET}"
    echo ""
    echo -e "${COLOR_BLUE}Troubleshooting:${COLOR_RESET}"
    echo "1. Check docker-compose logs: docker-compose -f docker-compose.prod.yml logs"
    echo "2. Check Nginx logs: sudo tail -f /var/log/nginx/manuscript-workbench-error.log"
    echo "3. Review deployment-notes.md for detailed troubleshooting"
    exit 1
fi

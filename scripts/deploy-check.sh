#!/bin/bash

# Orchestr Production Deployment Checklist Script
# Run this before deploying to production

echo "🚀 Orchestr Production Deployment Checklist"
echo "============================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✓${NC} Node.js version: $(node -v)"
else
    echo -e "${RED}✗${NC} Node.js version too old. Need 18+, found: $(node -v)"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check if .env.production exists
echo "🔐 Checking environment configuration..."
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓${NC} .env.production file exists"
    
    # Check for required variables
    REQUIRED_VARS=("NODE_ENV" "JWT_SECRET" "CORS_ORIGIN")
    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${VAR}=" .env.production; then
            echo -e "${GREEN}✓${NC} $VAR is set"
        else
            echo -e "${RED}✗${NC} $VAR is missing"
            ERRORS=$((ERRORS + 1))
        fi
    done
    
    # Check for at least one LLM API key
    if grep -q "^OPENAI_API_KEY=sk-" .env.production || \
       grep -q "^ANTHROPIC_API_KEY=sk-ant-" .env.production || \
       grep -q "^GROQ_API_KEY=gsk_" .env.production || \
       grep -q "^GOOGLE_API_KEY=" .env.production; then
        echo -e "${GREEN}✓${NC} At least one LLM API key is configured"
    else
        echo -e "${YELLOW}⚠${NC} No LLM API keys found (optional but recommended)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗${NC} .env.production file not found"
    echo "  Create it from .env.production.example"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check if dependencies are installed
echo "📚 Checking dependencies..."
if [ -d "node_modules" ] && [ -d "frontend/node_modules" ] && [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} All dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Some dependencies missing. Run: npm run install:all"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check if builds exist
echo "🏗️  Checking builds..."
if [ -d "frontend/.next" ]; then
    echo -e "${GREEN}✓${NC} Frontend build exists"
else
    echo -e "${YELLOW}⚠${NC} Frontend not built. Run: npm run build:frontend"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check Git status
echo "📝 Checking Git status..."
if [ -d ".git" ]; then
    if [ -z "$(git status --porcelain)" ]; then
        echo -e "${GREEN}✓${NC} Working directory clean"
    else
        echo -e "${YELLOW}⚠${NC} Uncommitted changes detected"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    BRANCH=$(git branch --show-current)
    echo "  Current branch: $BRANCH"
else
    echo -e "${YELLOW}⚠${NC} Not a Git repository"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check for sensitive data in code
echo "🔒 Checking for sensitive data..."
if grep -r "sk-[a-zA-Z0-9]\{20,\}" --include="*.js" --include="*.ts" --exclude-dir=node_modules . > /dev/null 2>&1; then
    echo -e "${RED}✗${NC} Possible API keys found in code!"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓${NC} No hardcoded API keys detected"
fi
echo ""

# Security checks
echo "🛡️  Security checks..."
if grep -q "helmet" backend/server.js; then
    echo -e "${GREEN}✓${NC} Helmet.js security headers enabled"
else
    echo -e "${RED}✗${NC} Helmet.js not found"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "rateLimit" backend/server.js; then
    echo -e "${GREEN}✓${NC} Rate limiting enabled"
else
    echo -e "${RED}✗${NC} Rate limiting not found"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "cors" backend/server.js; then
    echo -e "${GREEN}✓${NC} CORS configured"
else
    echo -e "${RED}✗${NC} CORS not configured"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo "============================================"
echo "📊 Summary"
echo "============================================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found. Review before deploying.${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) and $WARNINGS warning(s) found.${NC}"
    echo "  Fix errors before deploying to production."
    exit 1
fi

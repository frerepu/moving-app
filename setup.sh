#!/bin/bash

echo "🏠 Moving Decisions App - Quick Setup"
echo "====================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 32)
    ADMIN_KEY=$(openssl rand -base64 32)
    
    # Update .env file
    sed -i "s/your-super-secret-jwt-key-change-this/$JWT_SECRET/" .env
    sed -i "s/your-admin-key-for-creating-users/$ADMIN_KEY/" .env
    
    echo "✅ .env file created with random secrets"
    echo ""
fi

# Source the env file
source .env

echo "🐳 Starting Docker containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ Application is running at: http://localhost:8080"
echo ""
echo "👥 Now create user accounts:"
echo ""
echo "Example command to create a user:"
echo ""
echo "curl -X POST http://localhost:8080/api/admin/create-user \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"username\": \"yourname\","
echo "    \"password\": \"yourpassword\","
echo "    \"displayName\": \"Your Name\","
echo "    \"adminKey\": \"$ADMIN_KEY\""
echo "  }'"
echo ""
echo "Create accounts for each family member, then share the URL and credentials!"
echo ""

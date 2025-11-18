#!/bin/bash

# Setup script for PostgreSQL database
# This script will create the database and update .env file

echo "🔧 Setting up PostgreSQL database for Inventory Manager..."

# Get current username
DB_USER=$(whoami)
DB_NAME="inventory"
DB_PASSWORD=""

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "✅ Database '$DB_NAME' already exists"
else
    echo "📦 Creating database '$DB_NAME'..."
    createdb "$DB_NAME" 2>/dev/null || {
        echo "❌ Failed to create database. Trying with psql..."
        psql -c "CREATE DATABASE $DB_NAME;" postgres 2>/dev/null || {
            echo "❌ Could not create database automatically."
            echo "Please run manually: createdb $DB_NAME"
            exit 1
        }
    }
    echo "✅ Database '$DB_NAME' created successfully"
fi

# Update .env file
echo "📝 Updating .env file..."
cat > .env << EOF
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public"
PORT=3000
NODE_ENV=development
EOF

echo "✅ .env file updated"
echo ""
echo "📋 Your DATABASE_URL is: postgresql://${DB_USER}@localhost:5432/${DB_NAME}"
echo ""
echo "🚀 Next steps:"
echo "   1. If your PostgreSQL requires a password, edit .env and add it"
echo "   2. Run: npm run prisma:generate"
echo "   3. Run: npm run prisma:migrate"


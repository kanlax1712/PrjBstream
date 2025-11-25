#!/bin/bash
# Vercel Deployment Script

echo "🚀 Starting Vercel Deployment..."

# Step 1: Login (if not already)
echo "📝 Step 1: Checking authentication..."
if ! vercel whoami &>/dev/null; then
    echo "Please authenticate with Vercel..."
    vercel login
fi

# Step 2: Link project
echo "📝 Step 2: Linking project..."
vercel link --yes

# Step 3: Deploy
echo "📝 Step 3: Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"

#!/bin/bash

# Simple deployment script for Vercel
echo "🚀 Deploying Traffic Light FSM to Vercel..."

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🌐 Deploying to production..."
vercel --prod --yes

echo "✅ Deployment completed!"
echo "🔗 Your app should be available at: https://traffic-light-fsm-kypythons-projects.vercel.app"
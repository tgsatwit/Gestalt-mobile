#!/bin/bash

# Deploy Firebase Rules Script
# This script deploys both Firestore and Storage rules to Firebase

echo "🚀 Deploying Firebase Rules..."
echo "================================"

# Check if Firebase CLI is available
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if we're logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "   firebase login"
    exit 1
fi

echo "📋 Current project:"
firebase use

echo ""
echo "🔒 Deploying Firestore rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Firestore rules deployed successfully!"
else
    echo "❌ Failed to deploy Firestore rules"
    exit 1
fi

echo ""
echo "📁 Deploying Storage rules..."
firebase deploy --only storage

if [ $? -eq 0 ]; then
    echo "✅ Storage rules deployed successfully!"
else
    echo "❌ Failed to deploy Storage rules"
    exit 1
fi

echo ""
echo "🎉 All rules deployed successfully!"
echo "📊 You can view your rules in the Firebase Console:"
echo "   https://console.firebase.google.com/project/$(firebase use --current)/firestore/rules"
echo "   https://console.firebase.google.com/project/$(firebase use --current)/storage/rules"

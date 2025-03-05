#!/bin/bash
# Automated Deployment Script for CoogMusic Application
# This script:
# 1. Builds the React client.
# 2. Moves the client’s build folder into the server folder.
# 3. Installs dependencies in the server folder.
# 4. Runs the Node server.
# 5. Waits for a key press to stop the server and clean up.

set -e

echo "=== Starting CoogMusic deployment ==="

# Step 1: Build the React Client
echo "Navigating to client folder..."
cd client
echo "Installing client dependencies..."
npm install
echo "Building the React client..."
npm run build
cd ..

# Step 2: Move the build folder into the server folder
echo "Moving the client build folder into the server folder..."
if [ -d "server/build" ]; then
    echo "Existing build folder found in server. Removing it..."
    rm -rf server/build
fi
mv client/build server/

# Step 3: Set Up and Run the Node Server
echo "Navigating to server folder..."
cd server
echo "Installing server dependencies..."
npm install

echo "Starting the Node server..."
node server.js &
SERVER_PID=$!
echo "Server is running with PID: $SERVER_PID"

echo "Press any key to stop the server and initiate cleanup..."
read -n 1 -s

echo "Stopping the server..."
kill $SERVER_PID
cd ..

# Step 4: Cleanup
echo "Cleaning up unnecessary folders..."
echo "Removing server/build and server/node_modules..."
rm -rf server/build server/node_modules
echo "Removing client/node_modules..."
rm -rf client/node_modules

echo "Deployment and cleanup completed."


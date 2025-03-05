# CoogMusic Application Deployment Guide

This guide explains how to build and run the CoogMusic application for deployment on Azure.

## Prerequisites

- Node.js installed on your machine.
- All necessary environment variables and database configurations are properly set up.

## Build and Run Steps

1. Open a terminal and navigate to the `client` folder:
   ```bash
   cd client
   npm install
   npm run build
   ```
   This command creates a production-ready `build` folder in the `client` directory.

2. Move the generated `build` folder from the `client` folder into the `server` folder.

3. Navigate to the `server` folder:
   ```bash
   cd server
   npm install
   node server.js
   ```
   The server will start and serve both the API endpoints and the static files from the `build` folder.

## Cleanup After Deployment

Once you are done, remove the unnecessary folders:

```bash
cd server
rm -rf build node_modules
cd ../client
rm -rf node_modules
```

This process simulates how the application is structured and deployed on Azure. Make sure your Azure deployment process reflects these steps.


# CoogMusic Application Deployment Guide

This guide explains how to build and run the CoogMusic application for deployment on Azure.

---

## Automated Deployment (Recommended)

To automate the deployment process, use the provided `deploy.sh` script. This script:

- Builds the React client.
- Moves the client’s `build` folder into the `server` folder.
- Installs dependencies in the `server` folder.
- Starts the Node server.
- Waits for user input to stop the server and clean up unnecessary files.

### Running the Automated Deployment Script:

1. Open a terminal and navigate to the project root folder.
2. Make the script executable (only needed the first time):
    ```bash
    chmod +x deploy.sh
    ```
    Run the script:

    ./deploy.sh

    Press any key to stop the server and clean up temporary files.


Manual Deployment (Alternative)

If you prefer to run the process manually, follow these steps.
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

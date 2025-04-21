# CoogMusic Database Application Submission

## Project Overview

CoogMusic is a comprehensive music streaming platform designed specifically for the University of Houston community. This application allows UH musicians to upload and share their music with listeners, while listeners can create playlists, follow their favorite artists, and discover new music on campus.

## Hosted Application Link

**Website URL:** [https://coogmusic.com/](https://coogmusic.com/)

## Files Included in Submission

This submission includes:

1. **SQL Database Dump**
   - `main_database_dump.sql` - Complete SQL dump of the populated database with all tables, data, and trigger definitions
   
2. **Application Source Code**
   - `client/` - Frontend React application
   - `server/` - Backend Node.js server
   - `easydeploy.sh` - Automated deployment script

3. **Documentation**
   - `README.md` - This file
   - `ProjectDocument.md` - Detailed project documentation

## Installation Instructions

### Prerequisites

Before installing CoogMusic, ensure you have the following:
- Node.js (v18 or later)
- npm (v8 or later)
- MySQL (v8 or later)
- Azure Storage Account (for production deployment)
- Clerk account for authentication

### Database Setup

1. Create a new MySQL database:
   ```sql
   CREATE DATABASE coogmusic;
   ```

2. Import the database dump:
   ```bash
   mysql -u your_username -p coogmusic < main_database_dump.sql
   ```

3. Update database configuration in `server/dbConfig.js` with your MySQL credentials.

### Local Development Setup

1. **Clone the Repository (if you're using the source files directly)**
   ```bash
   git clone https://github.com/yourusername/coogmusic.git
   cd coogmusic
   ```

2. **Set Up Environment Variables**

   Create a `.env` file in the `server` directory:
   ```
   CLERK_API_KEY=sk_test_hHsyPcEKFcdp7VAjqneTtFU1KLYIh0n1rw9JTkgSfD
   ```

   Create a `.env` file in the `client` directory:
   ```
   REACT_APP_CLERK_FRONTEND_API=pk_test_cmVsaWV2ZWQtZ25hdC0xNC5jbGVyay5hY2NvdW50cy5kZXYk
   ```

3. **Install Dependencies and Run**

   Use the provided deployment script:
   ```bash
   chmod +x easydeploy.sh
   ./easydeploy.sh
   ```

   Or manually:
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies and build
   cd ../client
   npm install
   npm run build
   
   # Move build folder to server and run
   mv build ../server/
   cd ../server
   node server.js
   ```

4. **Access the Application**

   Open your browser and navigate to `http://localhost:8080`

## Project Document Summary

### 1. Types of Data (CRUD Operations)

- **Songs:** Upload, stream, edit metadata, delete (with cascading effects)
- **Users:** Registration, profile management, verification, deletion
- **Playlists:** Creation, song addition/removal, renaming, deletion
- **Albums:** Group creation, management, deletion (with cascading song deletion)
- **Likes & Follows:** Social interactions between users and content

### 2. User Roles

- **Listener:** Basic consumption capabilities
- **Musician:** Content creation and management capabilities
- **Administrator:** System-wide management and reporting

### 3. Semantic Constraints (Triggers)

- **Trigger 1:** Prevents unverified users from uploading content
- **Trigger 2:** Automatically updates account type to Musician when uploading a song
- **Trigger 3:** Prevents users from liking their own songs and restricts likes to verified users

### 4. Queries/Reports

- **Genre Report:** Analysis of song distribution by genre with filtering capabilities
- **User Report:** User growth and engagement metrics with visualizations
- **Engagement Report:** Platform activity tracking over time
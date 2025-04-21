# CoogMusic Database Application Submission

## Project Overview

CoogMusic is a comprehensive music streaming platform designed specifically for the University of Houston community. This application allows UH musicians to upload and share their music with listeners, while listeners can create playlists, follow their favorite artists, and discover new music on campus.

## Hosted Application Link

**Website URL:** [https://coogmusic.com/](https://coogmusic.com/)

### Local Development Setup

1. **Install Dependencies and Run**
   1. Open a terminal and navigate to the project root folder.
   2. Make the script executable (only needed the first time):
      Use the provided deployment script:
      ```bash
      chmod +x easydeploy.sh
      ```
      Run the script:
      ```bash
      ./easydeploy.sh
      ```
      Press any key to stop the server and clean up temporary files.

2. **Access the Application**
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

- **Song Report:** Analysis of song distribution by genre with filtering capabilities
- **User Report:** User growth and engagement metrics with visualizations
- **Engagement Report:** Platform activity tracking over time

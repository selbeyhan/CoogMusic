const http = require("http");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dbConfig = require("./dbConfig");
const multer = require("multer");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const { exec } = require("child_process");
const { parse } = require("querystring"); // Used to parse the request body
require('dotenv').config();  // This should automatically look for .env in the same folder as server.js

const { Clerk } = require('@clerk/clerk-sdk-node'); // Import Clerk SDK

// Initialize Clerk SDK with the secret key from the environment
const clerkClient = new Clerk({
  apiKey: process.env.CLERK_API_KEY, // Use the Clerk Secret API Key from .env
});

// Ensure the environment variable is loaded
console.log("Clerk API Key:", process.env.CLERK_API_KEY); // Debugging step to check if it's loaded correctly

const PORT = process.env.PORT || 8080;
const upload = multer({ storage: multer.memoryStorage() });

const AZURE_ACCESS_KEY = "DefaultEndpointsProtocol=https;AccountName=coogsmusicstorage;AccountKey=WPvelBoCZ6xVs39HDIoJ+aVzkNwFoo0bex+H2uG9ANc+dZOUVlz3LxlVE91SLWIA3e1X0/L1sVba+AStpYb1uw==;EndpointSuffix=core.windows.net";
const SONGS_CONTAINER_NAME = "songs";
const PROFILE_PICTURE_CONTAINER_NAME = "profilepicture";
const SONG_PICTURE_CONTAINER_NAME = "songpictures";


if (!AZURE_ACCESS_KEY) {
  throw new Error("Azure Storage connection string is missing.");
}


const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_ACCESS_KEY);
const songContainerClient = blobServiceClient.getContainerClient(SONGS_CONTAINER_NAME);
const profilePictureContainerClient = blobServiceClient.getContainerClient(PROFILE_PICTURE_CONTAINER_NAME);
const songPictureContainerClient = blobServiceClient.getContainerClient(SONG_PICTURE_CONTAINER_NAME);


async function adminPortalUsers() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    // Fetch all the fields needed for the admin portal
    const [rows] = await connection.execute(`
      SELECT
        name,
        email,
        account_type,
        registration_date,
        profile_picture_url,
        bio,
        monthly_listeners,
        uh_affiliation,
        verification_status,
        admin_role,
        user_id,
        clerk_user_id
      FROM users
    `);
    return rows;
  } catch (err) {
    console.error("❌ Error fetching admin portal users:", err.message);
    return [];
  } finally {
    if (connection) await connection.end();
  }
}


async function getAllUsers() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM Users");
    return rows;
  } catch (err) {
    console.error("❌ Error fetching users:", err.message);
    return [];
  } finally {
    if (connection) await connection.end();
  }
}


async function getAllSongs() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Perform a join between the songs and users table to fetch the song details along with the musician's name
    const [rows] = await connection.execute(`
SELECT songs.song_id, songs.title, songs.musician_id, songs.upload_date, songs.genre, songs.duration, songs.file_url, songs.cover_art_url, songs.description, songs.views, users.name AS musician_name
FROM songs
JOIN users ON songs.musician_id = users.user_id
`);

    return rows;
  } catch (err) {
    console.error("❌ Error fetching songs:", err.message);
    return [];
  } finally {
    if (connection) await connection.end();
  }
}


// Fetch all songs uploaded by a specific user
async function getUserSongs(userId) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
SELECT songs.song_id, songs.title, songs.musician_id, songs.upload_date, songs.genre, songs.duration, songs.file_url, songs.cover_art_url, songs.description, songs.views, users.name AS musician_name
FROM songs
JOIN users ON songs.musician_id = users.user_id
WHERE songs.musician_id = ?
`, [userId]);  // Pass the user ID to filter songs by the user

    // Ensure that we always return an array, even if it's a single song
    return Array.isArray(rows) ? rows : [rows]; // Wrap the result in an array if it's a single object
  } catch (err) {
    console.error("❌ Error fetching user songs:", err.message);
    return []; // Return an empty array in case of an error
  } finally {
    if (connection) await connection.end();
  }
}



// Upload profile pic (should work by clicking the user's current profile picture)
async function uploadProfilePicture(req, res) {
  try {
    // Ensure the request body contains the user_id
    const { user_id } = req.body;
    if (!user_id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Missing user_id in request body" }));
    }

    // Check if a file was uploaded
    if (!req.file) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "No file uploaded" }));
    }

    // Set file properties from multer
    req.fileBuffer = req.file.buffer;
    req.fileName = req.file.originalname;
    req.fileType = req.file.mimetype;

    // Ensure the Azure container exists or create it
    await profilePictureContainerClient.createIfNotExists({
      access: "container" // or "private" if you don't want public access
    });
    console.log("✔️ Container ready:", PROFILE_PICTURE_CONTAINER_NAME);

    // Generate a unique file name and upload to Azure
    const fileName = `${uuidv4()}-${req.fileName}`;
    const blockBlobClient = profilePictureContainerClient.getBlockBlobClient(fileName);

    console.log("⬆️ Uploading profile picture to Azure Blob Storage...");
    await blockBlobClient.uploadData(req.fileBuffer, {
      blobHTTPHeaders: { blobContentType: req.fileType },
    });

    const fileUrl = blockBlobClient.url;
    console.log("✅ Profile picture uploaded:", fileUrl);

    // Update the user's profile picture URL in the database
    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);
      await connection.execute(
        "UPDATE users SET profile_picture_url = ? WHERE user_id = ?",
        [fileUrl, user_id]
      );
      console.log("✅ Profile picture URL updated in DB for user_id:", user_id);
    } catch (dbError) {
      console.error("❌ Database error:", dbError.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Database error", details: dbError.message }));
    } finally {
      if (connection) await connection.end();
    }

    // Respond with success
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Profile picture uploaded successfully", url: fileUrl }));
  } catch (error) {
    console.error("❌ Upload profile picture error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error uploading profile picture", details: error.message }));
  }
}

async function uploadSong(req, res) {




  try {
    const { title, genre, description, cover_art_url, musician_id } = req.body;
    const fileBuffer = req.fileBuffer;
    const fileName = `${uuidv4()}-${req.fileName}`;
    const blockBlobClient = songContainerClient.getBlockBlobClient(fileName);

    console.log("Uploading to Azure Blob Storage...");
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: { blobContentType: req.fileType },
    });

    const fileUrl = blockBlobClient.url;
    console.log("File uploaded:", fileUrl);

    // ---------------
    // Setting a default duration instead of using ffprobe
    // In production, replace this with an actual duration calculation
    const duration = 180; // Default duration of 3 minutes
    console.log("Skipping ffprobe. Using default duration:", duration);
    // ---------------

// Upload cover art if a file is provided (similar to profile picture upload)
let finalCoverArtUrl = cover_art_url; // Default to the value provided in the request body
if (req.files && req.files.cover_art && req.files.cover_art[0]) {
  const coverArtFile = req.files.cover_art[0];
  const coverArtBuffer = coverArtFile.buffer;
  const coverArtName = `${uuidv4()}-${coverArtFile.originalname}`;
  
  // Ensure the Azure container for song pictures exists (assumes songPictureContainerClient is defined)
  await songPictureContainerClient.createIfNotExists({ access: "container" });
  const coverArtBlockBlobClient = songPictureContainerClient.getBlockBlobClient(coverArtName);

  console.log("Uploading song cover art to Azure Blob Storage...");
  await coverArtBlockBlobClient.uploadData(coverArtBuffer, {
    blobHTTPHeaders: { blobContentType: coverArtFile.mimetype },
  });
  finalCoverArtUrl = coverArtBlockBlobClient.url;
  console.log("Song cover art uploaded:", finalCoverArtUrl);
}


    const uploadDate = new Date().toISOString().slice(0, 19).replace("T", " ");

    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);
      await connection.execute(
        `INSERT INTO Songs (title, musician_id, upload_date, genre, duration, file_url, cover_art_url, description)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, musician_id, uploadDate, genre, duration, fileUrl, finalCoverArtUrl, description]
      );
      console.log("✅ File metadata stored in database.");
    } catch (dbError) {
      console.error("❌ Database error:", dbError.message);
    } finally {
      if (connection) await connection.end();
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "File uploaded and saved successfully", url: fileUrl }));

  } catch (error) {
    console.error("❌ Upload error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error uploading file", details: error.message }));
  }
}


/**
* Handles user authentication (signup and login).
* - Checks if `clerk_user_id` already exists in the database.
* - If exists, returns user data (login).
* - If not, inserts a new user (signup).
*/
async function handleUserAuthentication(req, res) {
  let body = "";


  req.on("data", (chunk) => {
    body += chunk.toString();
  });


  req.on("end", async () => {
    try {
      const { clerk_user_id, name, email } = JSON.parse(body);


      if (!clerk_user_id || !email) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Missing Clerk user ID or email." }));
      }


      let uh_affiliation = "None";
      let verification_status = false;
      let admin_role = false;


      if (email.endsWith("@cougarnet.uh.edu")) {
        uh_affiliation = "Student";
        verification_status = true;
      }


      // ✅ Define password explicitly
      const password = "handled by Clerk auth";


      // Connect to Database
      const connection = await mysql.createConnection(dbConfig);


      // **Check if user already exists**
      const [existingUser] = await connection.execute(
        "SELECT user_id, clerk_user_id, name, email, uh_affiliation, verification_status, admin_role FROM users WHERE clerk_user_id = ?",
        [clerk_user_id]
      );


      if (existingUser.length > 0) {
        // **User exists, return their data**
        await connection.end();
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "User found", user: existingUser[0] }));
      }


      // **Insert new user if they don't exist**
      const query = `
INSERT INTO users (clerk_user_id, name, email, password, uh_affiliation, verification_status, admin_role, registration_date)
VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
`;


      const [result] = await connection.execute(query, [
        clerk_user_id,
        name,
        email,
        password, // ✅ Ensures password is stored as 'handled by Clerk auth'
        uh_affiliation,
        verification_status,
        admin_role
      ]);


      await connection.end();


      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "New user registered", user_id: result.insertId }));


    } catch (error) {
      console.error("❌ Error handling user:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  });
}








const server = http.createServer(async (req, res) => {


  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");




  // Set Content Security Policy (CSP) Headers
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; " +
      "media-src 'self' https://coogsmusicstorage.blob.core.windows.net; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
      "https://*.clerk.dev https://clerk.dev https://accounts.clerk.dev " +
      "https://cdn.jsdelivr.net https://unpkg.com https://relieved-gnat-14.clerk.accounts.dev; " +
      "worker-src 'self' blob:; " +
      "style-src 'self' 'unsafe-inline' " +
      "https://*.clerk.dev https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com https://static.clerk.dev; " +
      "connect-src 'self' https://*.clerk.dev https://accounts.clerk.dev https://api.clerk.dev " +
      "https://cdn.jsdelivr.net https://relieved-gnat-14.clerk.accounts.dev https://fonts.gstatic.com; " +
      "img-src 'self' https://*.clerk.dev https://accounts.clerk.dev https://img.clerk.com data: https://cdn.jsdelivr.net https://coogsmusicstorage.blob.core.windows.net; " +
      "font-src 'self' https://fonts.gstatic.com;"
  );


  // **User Authentication Route (Signup/Login)**
  if (req.url === "/register" && req.method === "POST") {
    return handleUserAuthentication(req, res);
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  // File upload route
  if (req.url === "/upload" && req.method === "POST") {
    upload.fields([
      { name: "file", maxCount: 1 },
      { name: "cover_art", maxCount: 1 }
    ])(req, res, async (err) => {
      if (err) {
        console.error("❌ Multer file upload error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "File upload failed" }));
        return;
      }
  
      try {
        console.log("✅ File upload received");
        console.log("Received req.body:", req.body);
        console.log("Received files:", req.files);
  
        // Extract audio file from req.files
        req.fileBuffer = req.files.file[0].buffer;
        req.fileName = req.files.file[0].originalname;
        req.fileType = req.files.file[0].mimetype;
  
        await uploadSong(req, res);
      } catch (error) {
        console.error("❌ Upload processing error:", error);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  // Fetch Top Songs from Database (only the top 5)
  if (req.url === "/top-songs" && req.method === "GET") {
    try {
      const songs = await getAllSongs(); // Fetch all songs and user data

      // Sort the songs by views in descending order and limit to top 5
      const topSongs = songs
      .sort((a, b) => b.views - a.views)  // Sort by views in descending order
      .slice(0, 5);  // Limit to top 5 songs

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(topSongs)); // Send only top 5 songs
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Error fetching songs", error: err.message }));
    }
    return;
  }

  // Admin Portal Users Endpoint: Fetch all users and info for the admin portal:
  if (req.method === "GET" && req.url === "/admin-users") {
    try {
      const users = await adminPortalUsers();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ users }));
    } catch (err) {
      console.error("❌ Error fetching admin portal users:", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }


  // Get user profile by Clerk user ID
  if (req.method === "GET" && req.url.startsWith("/user/")) {
    const clerkUserId = decodeURIComponent(req.url.split("/user/")[1]);

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(
        "SELECT * FROM users WHERE clerk_user_id = ?",
        [clerkUserId]
      );
      await connection.end();

      if (rows.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "User not found" }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ user: rows[0] }));
      }
    } catch (err) {
      console.error("❌ Error fetching user by Clerk ID:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Database error" }));
    }

    return;
  }

  // Increment the view count for a song
  if (req.method === "POST" && req.url.startsWith("/increment-view/")) {
    const songId = req.url.split("/increment-view/")[1]; // Get songId from URL

    if (!songId) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Song ID is required" }));
    }

    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);

      // Increment the view count for the song in the database
      const [result] = await connection.execute(
        "UPDATE songs SET views = views + 1 WHERE song_id = ?",
        [songId]
      );

      if (result.affectedRows === 0) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: "Song not found" }));
      }

      console.log(`View count for song ${songId} incremented.`);
      res.statusCode = 200;
      return res.end(JSON.stringify({ message: "View count incremented successfully" }));
    } catch (err) {
      console.error("Error incrementing views:", err.message);
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: "Failed to increment view count" }));
    } finally {
      if (connection) await connection.end();
    }
  }




  // Delete user by Clerk ID from both MySQL and Clerk system
  if (req.method === "DELETE" && req.url.startsWith("/user/")) {
    const clerkUserId = decodeURIComponent(req.url.split("/user/")[1]);
    console.log("Attempting to delete user with Clerk ID:", clerkUserId);

    try {
      const connection = await mysql.createConnection(dbConfig);
      console.log("Connected to MySQL");

      // Delete user from MySQL
      const [result] = await connection.execute(
        "DELETE FROM users WHERE clerk_user_id = ?",
        [clerkUserId]
      );

      console.log("Deletion result from MySQL:", result);
      await connection.end();
      console.log("MySQL connection closed");

      if (result.affectedRows === 0) {
        console.log("No user found with that Clerk ID");
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "User not found" }));
      } else {
        console.log("User and related data deleted via CASCADE in MySQL");

        // Delete user from Clerk
        try {
          await clerkClient.users.deleteUser(clerkUserId);
          console.log("User deleted from Clerk dashboard");
        } catch (clerkErr) {
          console.error("Error deleting user from Clerk:", clerkErr);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "User deleted from MySQL and Clerk" }));
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Database error" }));
    }

    return;
  }



  // Endpoint to get songs uploaded by a specific user (profile page)
  if (req.method === "GET" && req.url.startsWith("/api/profile/")) {
    const clerkUserId = req.url.split("/api/profile/")[1];

    try {
      // Fetch the user ID based on clerk_user_id
      const userQuery = `SELECT user_id FROM users WHERE clerk_user_id = ?`;
      const userConnection = await mysql.createConnection(dbConfig);
      const [userData] = await userConnection.execute(userQuery, [clerkUserId]);

      if (userData.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "User not found" }));
        return;
      }

      const userId = userData[0].user_id; // Get the user_id

      // Fetch the user's profile data
      const profileQuery = `SELECT * FROM users WHERE user_id = ?`;
      const [profileData] = await userConnection.execute(profileQuery, [userId]);

      // Fetch songs for this user
      const songs = await getUserSongs(userId);  // Your existing function to get songs

      await userConnection.end();

      // Ensure the songs are returned as an array
      const songsArray = Array.isArray(songs) ? songs : [songs];  // If it's not an array, wrap it

      // Send the profile and songs data back
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify([{
        user: profileData[0],  // Include the user profile data
        songs: songsArray   // Ensure songs are returned as an array
      }]));

    } catch (err) {
      console.error("❌ Error fetching user profile and songs:", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Error fetching user profile and songs", message: err.message }));
    }
    return;
  }

  // Update bio using Clerk user ID
  if (req.method === "PATCH" && req.url.startsWith("/update-bio/")) {
    const clerkUserId = decodeURIComponent(req.url.split("/update-bio/")[1]);
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { bio } = JSON.parse(body);
        if (!bio || !clerkUserId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Missing bio or clerk_user_id." }));
        }

        const connection = await mysql.createConnection(dbConfig);

        // Get user_id from clerk_user_id
        const [users] = await connection.execute(
          "SELECT user_id FROM users WHERE clerk_user_id = ?",
          [clerkUserId]
        );

        if (users.length === 0) {
          await connection.end();
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "User not found." }));
        }

        const userId = users[0].user_id;

        // Update bio
        const [result] = await connection.execute(
          "UPDATE users SET bio = ? WHERE user_id = ?",
          [bio, userId]
        );

        await connection.end();

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Bio updated successfully." }));
      } catch (err) {
        console.error("❌ Error updating bio:", err.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });

    return;
  }

  // search endpoint
  if (req.url.startsWith('/api/search') && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const query = url.searchParams.get('q');

    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Search query is required' }));
    }

    try {
      const connection = await mysql.createConnection(dbConfig);

      // Search songs
      const [songs] = await connection.execute(`
        SELECT s.*, u.name as musician_name
        FROM songs s
        JOIN users u ON s.musician_id = u.user_id
        WHERE s.title LIKE ? OR s.genre LIKE ? OR s.description LIKE ?
        LIMIT 20
      `, [`%${query}%`, `%${query}%`, `%${query}%`]);

      // Search artists (musician users) - Updated to not filter by account_type
      const [artists] = await connection.execute(`
        SELECT u.*,
          (SELECT COUNT(*) FROM songs WHERE musician_id = u.user_id) as songs_count
        FROM users u
        WHERE u.name LIKE ?
        LIMIT 20
      `, [`%${query}%`]);

      // Search playlists
      const [playlists] = await connection.execute(`
        SELECT p.*, u.name as creator_name,
          (SELECT COUNT(*) FROM \`playlist songs\` WHERE playlist_id = p.playlist_id) as songs_count
        FROM playlists p
        JOIN users u ON p.user_id = u.user_id
        WHERE p.name LIKE ?
        LIMIT 20
      `, [`%${query}%`]);

      await connection.end();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        songs,
        artists,
        playlists
      }));
    } catch (error) {
      console.error('❌ Search error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }

    return;
  }

    // Update a playlist name
  if (req.method === "PATCH" && req.url.startsWith("/api/playlist/update/")) {
    const playlistId = decodeURIComponent(req.url.split("/api/playlist/update/")[1]);
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { name } = JSON.parse(body);

        if (!name || !playlistId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Missing playlist name or ID" }));
        }

        const connection = await mysql.createConnection(dbConfig);

        // Update the playlist name
        const [result] = await connection.execute(
          "UPDATE playlists SET name = ? WHERE playlist_id = ?",
          [name, playlistId]
        );

        await connection.end();

        if (result.affectedRows === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Playlist not found" }));
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Playlist updated successfully" }));
      } catch (err) {
        console.error("❌ Error updating playlist:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });

    return;
  }

  // Update a song's details
  if (req.method === "PATCH" && req.url.startsWith("/api/song/update/")) {
    // Use multer to handle potential cover art file upload
    upload.fields([{ name: "cover_art", maxCount: 1 }])(req, res, async (err) => {
      if (err) {
        console.error("❌ Multer error in song update:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "File processing error" }));
      }
      try {
        const songId = decodeURIComponent(req.url.split("/api/song/update/")[1]);
        if (!songId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Missing song ID" }));
        }
    
        // Parse text fields from req.body (assumes JSON fields sent as text)
        const { title, genre, description, cover_art_url } = req.body;
    
        // Start building the update query dynamically
        let sql = "UPDATE songs SET ";
        const updates = [];
        const params = [];
    
        if (title) {
          updates.push("title = ?");
          params.push(title);
        }
        if (genre) {
          updates.push("genre = ?");
          params.push(genre);
        }
        if (description) {
          updates.push("description = ?");
          params.push(description);
        }
    
        // Check if a new cover art file was provided
        if (req.files && req.files.cover_art && req.files.cover_art[0]) {
          const coverArtFile = req.files.cover_art[0];
          const coverArtBuffer = coverArtFile.buffer;
          const coverArtName = `${uuidv4()}-${coverArtFile.originalname}`;
    
          // Ensure the Azure container for song pictures exists
          await songPictureContainerClient.createIfNotExists({ access: "container" });
          const coverArtBlockBlobClient = songPictureContainerClient.getBlockBlobClient(coverArtName);
    
          console.log("Uploading updated cover art to Azure Blob Storage...");
          await coverArtBlockBlobClient.uploadData(coverArtBuffer, {
            blobHTTPHeaders: { blobContentType: coverArtFile.mimetype },
          });
          const newCoverArtUrl = coverArtBlockBlobClient.url;
    
          updates.push("cover_art_url = ?");
          params.push(newCoverArtUrl);
        } else if (cover_art_url) {
          // Otherwise, if the client sends a cover_art_url value, update it
          updates.push("cover_art_url = ?");
          params.push(cover_art_url);
        }
    
        if (updates.length === 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "No fields to update" }));
        }
    
        sql += updates.join(", ") + " WHERE song_id = ?";
        params.push(songId);
    
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(sql, params);
        await connection.end();
    
        if (result.affectedRows === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Song not found" }));
        }
    
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Song updated successfully" }));
      } catch (err) {
        console.error("❌ Error updating song:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });
    return;
  }
  

  // Create a new playlist
  if (req.method === "POST" && req.url === "/api/createPlaylist") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { name, user_id } = JSON.parse(body);

        if (!name || !user_id) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Missing name or user_id" }));
        }

        const connection = await mysql.createConnection(dbConfig);

        // Check if user_id is a Clerk ID (starts with 'user_')
        let internalUserId = user_id;

        if (typeof user_id === 'string' && user_id.startsWith('user_')) {
          // Find the internal user_id from the Clerk ID
          const [userRow] = await connection.execute(
            "SELECT user_id FROM users WHERE clerk_user_id = ?",
            [user_id]
          );

          if (userRow.length === 0) {
            await connection.end();
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "User not found" }));
          }

          internalUserId = userRow[0].user_id;
        }

        const [result] = await connection.execute(
          `INSERT INTO playlists (user_id, name, creation_date) VALUES (?, ?, NOW())`,
          [internalUserId, name]
        );

        await connection.end();

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          message: "Playlist created successfully",
          playlist_id: result.insertId
        }));
      } catch (err) {
        console.error("❌ Error creating playlist:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });

    return;
  }

  // Profile picture upload route
  if (req.url === "/upload-profile-picture" && req.method === "POST") {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        console.error("❌ Multer file upload error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "File upload failed" }));
        return;
      }

      try {
        console.log("✅ Profile picture upload received");
        // Call the function to process the profile picture upload
        await uploadProfilePicture(req, res);
      } catch (error) {
        console.error("❌ Error processing profile picture:", error);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }


  // Update the DELETE endpoint for playlists (around line 659)
  if (req.method === "DELETE" && req.url.startsWith("/api/playlist/")) {
    const playlistId = decodeURIComponent(req.url.split("/api/playlist/")[1]);

    try {
      const connection = await mysql.createConnection(dbConfig);

      // First, verify if the playlist exists
      const [playlist] = await connection.execute(
        "SELECT * FROM playlists WHERE playlist_id = ?",
        [playlistId]
      );

      if (playlist.length === 0) {
        await connection.end();
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Playlist not found" }));
      }

      // First delete entries from the playlist_songs table
      await connection.execute(
        "DELETE FROM `playlist songs` WHERE playlist_id = ?",
        [playlistId]
      );

      // Then delete the playlist itself
      await connection.execute(
        "DELETE FROM playlists WHERE playlist_id = ?",
        [playlistId]
      );

      await connection.end();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Playlist deleted successfully" }));
    } catch (err) {
      console.error("❌ Error deleting playlist:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }

    return;
  }


  // Get all playlists for a specific user by Clerk user ID
  if (req.method === "GET" && req.url.startsWith("/api/getuserplaylists/")) {
    const clerkUserId = decodeURIComponent(req.url.split("/api/getuserplaylists/")[1]);

    try {
      const connection = await mysql.createConnection(dbConfig);

      // Get the user's internal user_id using Clerk ID
      const [users] = await connection.execute(
        "SELECT user_id FROM users WHERE clerk_user_id = ?",
        [clerkUserId]
      );

      if (users.length === 0) {
        await connection.end();
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "User not found" }));
      }

      const userId = users[0].user_id;

      // Fetch playlists created by the user
      const [playlists] = await connection.execute(
        "SELECT * FROM playlists WHERE user_id = ?",
        [userId]
      );

      await connection.end();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ playlists }));
    } catch (err) {
      console.error("❌ Error fetching playlists:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to fetch playlists" }));
    }

    return;
  }




  if (req.method === "POST" && req.url === "/api/addToPlaylist") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { playlist_id, song_id } = JSON.parse(body);

        if (!playlist_id || !song_id) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Missing playlist_id or song_id" }));
        }

        const connection = await mysql.createConnection(dbConfig);
        const addedDate = new Date().toISOString().slice(0, 19).replace("T", " ");

        await connection.execute(
          `INSERT IGNORE INTO \`playlist songs\` (playlist_id, song_id, added_date) VALUES (?, ?, ?)`,
          [playlist_id, song_id, addedDate]
        );

        await connection.end();

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Song added to playlist successfully" }));
      } catch (err) {
        console.error("❌ Error adding song to playlist:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });

    return;
  }

  // Audio streaming endpoint with Range support for audio seeking
  if (req.method === "GET" && req.url.startsWith("/stream/")) {
    const songId = req.url.split("/stream/")[1];
    if (!songId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Song ID is required" }));
      return;
    }

    let connection;
    try {
      // Query the database for the file URL of the requested song
      connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute("SELECT file_url FROM songs WHERE song_id = ?", [songId]);
      await connection.end();

      if (rows.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Song not found" }));
        return;
      }

      const fileUrl = rows[0].file_url;
      // Extract blob name from fileUrl.
      // Assumes URL format: https://<account>.blob.core.windows.net/songs/<blobName>
      const urlObj = new URL(fileUrl);
      const blobName = urlObj.pathname.split("/").pop();

      // Get the block blob client for the song file from the Azure songs container
      const blockBlobClient = songContainerClient.getBlockBlobClient(blobName);
      const properties = await blockBlobClient.getProperties();
      const contentLength = properties.contentLength;

      const range = req.headers.range;
      if (range) {
        // Parse Range header, e.g., "bytes=100-"
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : contentLength - 1;
        const chunkSize = (end - start) + 1;

        const downloadResponse = await blockBlobClient.download(start, chunkSize);
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${contentLength}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": "audio/mpeg"  // Adjust MIME type if needed
        });
        downloadResponse.readableStreamBody.pipe(res);
      } else {
        // No Range header provided, serve entire file
        const downloadResponse = await blockBlobClient.download(0);
        res.writeHead(200, {
          "Content-Length": contentLength,
          "Content-Type": "audio/mpeg"
        });
        downloadResponse.readableStreamBody.pipe(res);
      }
    } catch (err) {
      console.error("❌ Error streaming audio:", err.message);
      if (connection) await connection.end();
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Error streaming audio", details: err.message }));
    }
    return;
  }


  // Get a playlist and its songs
  if (req.method === "GET" && req.url.startsWith("/api/playlist/")) {
    const playlistId = decodeURIComponent(req.url.split("/api/playlist/")[1]);

    try {
      const connection = await mysql.createConnection(dbConfig);

      // Fetch playlist info
      const [playlistData] = await connection.execute(
        "SELECT * FROM playlists WHERE playlist_id = ?",
        [playlistId]
      );

      if (playlistData.length === 0) {
        await connection.end();
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Playlist not found" }));
      }

      // Fetch songs in the playlist
      const [songs] = await connection.execute(`
SELECT s.song_id, s.title, s.genre, s.upload_date, s.views, s.file_url, s.cover_art_url, s.description,
s.musician_id, u.name AS musician_name
FROM \`playlist songs\` ps
JOIN songs s ON ps.song_id = s.song_id
JOIN users u ON s.musician_id = u.user_id
WHERE ps.playlist_id = ?
ORDER BY ps.added_date ASC
`, [playlistId]);


      await connection.end();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        playlist: playlistData[0],
        songs
      }));
    } catch (err) {
      console.error("❌ Error fetching playlist and songs:", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }

    return;
  }







  //get the 20 newest songs
  if (req.url === '/newest-songs' && req.method === 'GET') {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const [results] = await connection.execute(`
SELECT songs.song_id, songs.title, songs.musician_id, songs.upload_date, songs.genre, songs.duration,
songs.file_url, songs.cover_art_url, songs.description, songs.views, users.name AS musician_name
FROM songs
JOIN users ON songs.musician_id = users.user_id
ORDER BY songs.upload_date DESC
LIMIT 20
`);
      await connection.end();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
    } catch (err) {
      console.error("❌ Error fetching newest songs:", err.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Failed to fetch newest songs' }));
    }
    return;
  }

  if (req.method === "DELETE" && req.url.startsWith("/api/song/")) {
    const songId = decodeURIComponent(req.url.split("/api/song/")[1]);

    try {
      const connection = await mysql.createConnection(dbConfig);

      // Delete from playlist songs table first (if you don't have ON DELETE CASCADE)
      await connection.execute(
        "DELETE FROM `playlist songs` WHERE song_id = ?",
        [songId]
      );

      // Delete from songs table
      const [result] = await connection.execute(
        "DELETE FROM songs WHERE song_id = ?",
        [songId]
      );

      await connection.end();

      if (result.affectedRows === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Song not found" }));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Song deleted successfully" }));
    } catch (err) {
      console.error("❌ Error deleting song:", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to delete song" }));
    }

    return;
  }




  // Deleting user by user_id (for admin portal -- for users without Clerk)
  if (req.method === "DELETE" && req.url.startsWith("/delete-by-id/")) {
    const userId = decodeURIComponent(req.url.split("/delete-by-id/")[1]);

    try {
      const connection = await mysql.createConnection(dbConfig);

      // First, fetch user details to log them before deletion
      const [userInfo] = await connection.execute(
        "SELECT name, email FROM users WHERE user_id = ?",
        [userId]
      );

      if (userInfo.length === 0) {
        await connection.end();
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "User not found" }));
      }

      const { name, email } = userInfo[0];
      console.log(`🗑️ Deleting user (no Clerk ID): [ID: ${userId}] Name: ${name}, Email: ${email}`);

      // Now delete the user
      const [result] = await connection.execute(
        "DELETE FROM users WHERE user_id = ?",
        [userId]
      );

      await connection.end();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "User deleted by user_id" }));
    } catch (err) {
      console.error("❌ Error deleting user by ID:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to delete user by ID" }));
    }

    return;
  }


  // Update verification status by user_id (from admin portal dropdown)
  if (req.method === "PATCH" && req.url.startsWith("/update-verification/")) {
    const userId = decodeURIComponent(req.url.split("/update-verification/")[1]);
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { verification_status } = JSON.parse(body);

        if (typeof verification_status !== "number") {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Invalid verification_status" }));
        }

        const connection = await mysql.createConnection(dbConfig);

        const [result] = await connection.execute(
          "UPDATE users SET verification_status = ? WHERE user_id = ?",
          [verification_status, userId]
        );

        await connection.end();

        if (result.affectedRows === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "User not found" }));
        }

        console.log(`✅ user_id ${userId} verification status changed to ${verification_status}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Verification status updated" }));
      } catch (err) {
        console.error("❌ Error updating verification status:", err.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to update verification status" }));
      }
    });

    return;
  }


  if (req.method === "GET" && req.url.startsWith("/api/user-by-id/")) {
    const userId = req.url.split("/api/user-by-id/")[1];

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(
        "SELECT * FROM users WHERE user_id = ?",
        [userId]
      );
      await connection.end();

      if (rows.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Artist not found" }));
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ user: rows[0] })); // ✅
      }
    } catch (err) {
      console.error("❌ Error fetching user by ID:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Database error" }));
    }

    return;
  }

  if (req.method === "GET" && req.url.startsWith("/api/artist-songs/")) {
    const artistId = req.url.split("/api/artist-songs/")[1];

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(
        `SELECT songs.*, users.name AS musician_name
FROM songs
JOIN users ON songs.musician_id = users.user_id
WHERE songs.musician_id = ?
ORDER BY songs.upload_date DESC`,
        [artistId]
      );
      await connection.end();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(rows));
    } catch (err) {
      console.error("❌ Error fetching artist songs:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Database error" }));
    }

    return;
  }


  // Toggle like: user can like or unlike a song
  if (req.method === "POST" && req.url === "/api/toggle-like") {
    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", async () => {
      try {
        const { clerk_user_id, song_id } = JSON.parse(body);

        if (!clerk_user_id || !song_id) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Missing clerk_user_id or song_id" }));
        }

        const connection = await mysql.createConnection(dbConfig);

        // Look up the internal user_id based on the clerk_user_id
        const [userRows] = await connection.execute(
          "SELECT user_id FROM users WHERE clerk_user_id = ?",
          [clerk_user_id]
        );

        if (!userRows || userRows.length === 0) {
          await connection.end();
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "User not found" }));
        }

        const user_id = userRows[0].user_id;

        // Check if the like already exists
        const [existing] = await connection.execute(
          "SELECT * FROM likes WHERE user_id = ? AND song_id = ?",
          [user_id, song_id]
        );

        if (existing.length > 0) {
          // Unlike: delete the existing like
          await connection.execute(
            "DELETE FROM likes WHERE user_id = ? AND song_id = ?",
            [user_id, song_id]
          );
          await connection.end();
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Unliked" }));
        } else {
          // Like: insert a new like record
          await connection.execute(
            "INSERT INTO likes (user_id, song_id, timestamp) VALUES (?, ?, NOW())",
            [user_id, song_id]
          );
          await connection.end();
          res.writeHead(201, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Liked" }));
        }
      } catch (err) {
        console.error("❌ Error toggling like:", err.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });
    return;
  }


  // GET /api/isLiked?clerk_user_id=...&song_id=...
  if (req.method === "GET" && req.url.startsWith("/api/isLiked")) {
    // Parse query parameters using the querystring module
    const urlParts = req.url.split("?");
    const queryString = urlParts[1] || "";
    const query = parse(queryString);
    const clerk_user_id = query.clerk_user_id;
    const song_id = query.song_id;

    if (!clerk_user_id || !song_id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Missing clerk_user_id or song_id" }));
    }

    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);

      // Look up the internal user_id from the clerk_user_id
      const [userRows] = await connection.execute(
        "SELECT user_id FROM users WHERE clerk_user_id = ?",
        [clerk_user_id]
      );

      if (!userRows || userRows.length === 0) {
        await connection.end();
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "User not found" }));
      }

      const user_id = userRows[0].user_id;

      // Check if the like exists for the given song
      const [likeRows] = await connection.execute(
        "SELECT * FROM likes WHERE user_id = ? AND song_id = ?",
        [user_id, song_id]
      );

      await connection.end();

      const liked = likeRows.length > 0;
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ liked }));
    } catch (err) {
      console.error("❌ Error fetching like status:", err.message);
      if (connection) await connection.end();
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  }

  // Get featured artists
if (req.method === "GET" && req.url === "/featured-artists") {
  try {
    const connection = await mysql.createConnection(dbConfig);
    // You can modify this query based on how you determine featured artists
    const [results] = await connection.execute(`
      SELECT u.user_id as id, u.name, u.profile_picture_url as profileImage
      FROM users u
      JOIN songs s ON u.user_id = s.musician_id
      GROUP BY u.user_id
      ORDER BY COUNT(s.song_id) DESC
      LIMIT 6
    `);

    await connection.end();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(results));
  } catch (err) {
    console.error("❌ Error fetching featured artists:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to fetch featured artists" }));
  }

  return;
}


  // GET /api/profile-likes/:clerkUserId
  if (req.method === "GET" && req.url.startsWith("/api/profile-likes/")) {
    const clerkUserId = decodeURIComponent(req.url.split("/api/profile-likes/")[1]);

    try {
      const connection = await mysql.createConnection(dbConfig);

      // 1) Convert clerkUserId -> user_id
      const [users] = await connection.execute(
        "SELECT user_id FROM users WHERE clerk_user_id = ?",
        [clerkUserId]
      );

      if (users.length === 0) {
        await connection.end();
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "User not found" }));
      }

      const userId = users[0].user_id;

      // 2) Fetch all liked songs for that user_id
      const [likedSongs] = await connection.execute(`
SELECT s.song_id, s.title, s.musician_id, s.upload_date, s.genre,
s.duration, s.file_url, s.cover_art_url, s.description,
s.views, u.name AS musician_name
FROM likes l
JOIN songs s ON l.song_id = s.song_id
JOIN users u ON s.musician_id = u.user_id
WHERE l.user_id = ?
ORDER BY l.timestamp DESC
`, [userId]);

      await connection.end();

      // 3) Return liked songs
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ likedSongs }));
    } catch (err) {
      console.error("❌ Error fetching liked songs:", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  }

// ----- Album Routes -----
// Note: For now, we're using the "songpictures" container for album cover art.
// Once a dedicated container for album cover art is set up, update the code accordingly.

if (req.method === "POST" && req.url === "/api/createAlbum") {
  // Use multer to handle the file upload; expect the file field named "cover_art"
  upload.single("cover_art")(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "File upload failed" }));
    }
    try {
      // Get text fields from req.body
      const { title, description, musician_id } = req.body;
      if (!title || !musician_id) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Missing album title or musician_id" }));
      }
      
      // Set the release_date to now
      const release_date = new Date().toISOString().slice(0, 19).replace("T", " ");
      
      // Set a fallback album art URL (if no file was uploaded)
      let albumArtUrl = req.body.album_art_url || "https://via.placeholder.com/300";
      
      // If a file was uploaded, use songPictureContainerClient to upload it
      if (req.file) {
        await songPictureContainerClient.createIfNotExists({ access: "container" });
        const fileName = `${uuidv4()}-${req.file.originalname}`;
        const blockBlobClient = songPictureContainerClient.getBlockBlobClient(fileName);
        await blockBlobClient.uploadData(req.file.buffer, {
          blobHTTPHeaders: { blobContentType: req.file.mimetype }
        });
        albumArtUrl = blockBlobClient.url;
      }
      
      // Insert the album into the database
      const connection = await mysql.createConnection(dbConfig);
      const [result] = await connection.execute(
        "INSERT INTO albums (musician_id, title, release_date, album_art_url, description) VALUES (?, ?, ?, ?, ?)",
        [musician_id, title, release_date, albumArtUrl, description]
      );
      await connection.end();
      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Album created successfully", album_id: result.insertId }));
    } catch (error) {
      console.error("❌ Error creating album:", error.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  });
  return;
}


// Get albums for a user (by Clerk user ID)
if (req.method === "GET" && req.url.startsWith("/api/getuseralbums/")) {
  const clerkUserId = decodeURIComponent(req.url.split("/api/getuseralbums/")[1]);
  try {
    const connection = await mysql.createConnection(dbConfig);
    // Convert Clerk user ID to internal user_id
    const [users] = await connection.execute(
      "SELECT user_id FROM users WHERE clerk_user_id = ?",
      [clerkUserId]
    );
    if (users.length === 0) {
      await connection.end();
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "User not found" }));
    }
    const userId = users[0].user_id;
    // Fetch albums for the user ordered by release_date (newest first)
    const [albums] = await connection.execute(
      "SELECT * FROM albums WHERE musician_id = ? ORDER BY release_date DESC",
      [userId]
    );
    await connection.end();
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ albums }));
  } catch (error) {
    console.error("❌ Error fetching albums:", error.message);
    res.writeHead(500, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}


if (req.url === "/api/upload-album-songs" && req.method === "POST") {
  upload.fields([
    { name: "files" },
    { name: "cover_arts" }
  ])(req, res, async (err) => {
    if (err) return res.end(JSON.stringify({ error: "Upload error" }));

    const { album_id, musician_id, titles, genres, descriptions } = req.body;

    if (!album_id || !titles || !Array.isArray(req.files?.files)) {
      return res.end(JSON.stringify({ error: "Missing required fields" }));
    }

    try {
      const connection = await mysql.createConnection(dbConfig);
      const addedSongs = [];

      for (let i = 0; i < req.files.files.length; i++) {
        const file = req.files.files[i];
        const title = Array.isArray(titles) ? titles[i] : titles;
        const genre = Array.isArray(genres) ? genres[i] : genres;
        const description = Array.isArray(descriptions) ? descriptions[i] : descriptions;

        // Upload audio
        const fileName = `${uuidv4()}-${file.originalname}`;
        const audioBlob = songContainerClient.getBlockBlobClient(fileName);
        await audioBlob.uploadData(file.buffer, {
          blobHTTPHeaders: { blobContentType: file.mimetype }
        });
        const fileUrl = audioBlob.url;

        // Upload cover art
        let coverArtUrl = "https://via.placeholder.com/300";
        if (req.files.cover_arts && req.files.cover_arts[i]) {
          const cover = req.files.cover_arts[i];
          const coverName = `${uuidv4()}-${cover.originalname}`;
          const coverBlob = songPictureContainerClient.getBlockBlobClient(coverName);
          await coverBlob.uploadData(cover.buffer, {
            blobHTTPHeaders: { blobContentType: cover.mimetype }
          });
          coverArtUrl = coverBlob.url;
        }

        const uploadDate = new Date().toISOString().slice(0, 19).replace("T", " ");
        const duration = 180;

        // Insert into `songs`
        const [songResult] = await connection.execute(
          `INSERT INTO songs (title, musician_id, upload_date, genre, duration, file_url, cover_art_url, description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [title, musician_id, uploadDate, genre, duration, fileUrl, coverArtUrl, description]
        );

        const songId = songResult.insertId;

        // Insert into album_songs
        await connection.execute(
          `INSERT INTO album_songs (album_id, song_id, added_date) VALUES (?, ?, ?)`,
          [album_id, songId, uploadDate]
        );

        addedSongs.push(songId);
      }

      await connection.end();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Songs uploaded and linked", song_ids: addedSongs }));
    } catch (e) {
      console.error("❌ Upload album songs error:", e);
      return res.end(JSON.stringify({ error: "Upload failed" }));
    }
  });

  return;
}


if (req.method === "GET" && req.url.startsWith("/api/album/")) {
  const albumId = decodeURIComponent(req.url.split("/api/album/")[1]);

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Fetch album info
    const [albumData] = await connection.execute(
      "SELECT * FROM albums WHERE album_id = ?",
      [albumId]
    );

    if (albumData.length === 0) {
      await connection.end();
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Album not found" }));
    }

    // Fetch songs in the album
    const [songs] = await connection.execute(`
      SELECT s.song_id, s.title, s.genre, s.upload_date, s.views, s.file_url, s.cover_art_url, s.description,
             s.musician_id, u.name AS musician_name
      FROM album_songs a
      JOIN songs s ON a.song_id = s.song_id
      JOIN users u ON s.musician_id = u.user_id
      WHERE a.album_id = ?
      ORDER BY a.added_date ASC
    `, [albumId]);

    await connection.end();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      album: albumData[0],
      songs
    }));
  } catch (err) {
    console.error("❌ Error fetching album and songs:", err.message);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }

  return;
}


//update album pic or title from the albumview page 
//(only if that user owns that album)
if (req.method === "PATCH" && req.url === "/editalbumtitleorpic") {
  upload.single("cover_art")(req, res, async (err) => {
    if (err) {
      console.error("❌ Multer error during album update:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "File processing error" }));
    }

    try {
      const { album_id, title, description } = req.body;

      if (!album_id) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Missing album_id" }));
      }

      const updates = [];
      const values = [];

      if (title) {
        updates.push("title = ?");
        values.push(title);
      }

      if (description) {  // Update description if provided
        updates.push("description = ?");
        values.push(description);
      }

      let albumArtUrl;

      if (req.file) {
        const blobName = `${uuidv4()}-${req.file.originalname}`;
        await songPictureContainerClient.createIfNotExists({ access: "container" });
        const blockBlobClient = songPictureContainerClient.getBlockBlobClient(blobName);
        await blockBlobClient.uploadData(req.file.buffer, {
          blobHTTPHeaders: { blobContentType: req.file.mimetype },
        });
        albumArtUrl = blockBlobClient.url;
        updates.push("album_art_url = ?");
        values.push(albumArtUrl);
      }

      if (updates.length === 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "No updates provided" }));
      }

      values.push(album_id); // for WHERE clause

      const connection = await mysql.createConnection(dbConfig);
      await connection.execute(
        `UPDATE albums SET ${updates.join(", ")} WHERE album_id = ?`,
        values
      );
      await connection.end();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        message: "Album updated successfully",
        album_art_url: albumArtUrl
      }));
    } catch (error) {
      console.error("❌ Error updating album:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  });

  return;
}




  // Serve React Frontend (Static Files)
  const buildPath = path.join(__dirname, "build");

  if (req.method === "GET") {
    let requestedPath = req.url.split("?")[0]; // Remove query string if present
    let filePath = path.join(buildPath, requestedPath);

    // If the request does not have a file extension, fallback to index.html (React route)
    if (!path.extname(requestedPath)) {
      filePath = path.join(buildPath, "index.html");
    }

    fs.readFile(filePath, (err, content) => {
      if (!err) {
        res.writeHead(200);
        res.end(content);
      } else {
        // Fallback to index.html if file not found, assuming it's a React route
        fs.readFile(path.join(buildPath, "index.html"), (indexErr, indexContent) => {
          if (!indexErr) {
            res.writeHead(200);
            res.end(indexContent);
          } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Not Found" }));
          }
        });
      }
    });

    return;
  }


  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Not Found" }));
});




server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

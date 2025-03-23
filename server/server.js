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




const AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=coogsmusicstorage;AccountKey=WPvelBoCZ6xVs39HDIoJ+aVzkNwFoo0bex+H2uG9ANc+dZOUVlz3LxlVE91SLWIA3e1X0/L1sVba+AStpYb1uw==;EndpointSuffix=core.windows.net";
const AZURE_CONTAINER_NAME = "songs";




if (!AZURE_STORAGE_CONNECTION_STRING) {
 throw new Error("Azure Storage connection string is missing.");
}




const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);




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






async function uploadSong(req, res) {
 try {
   const { title, genre, description, cover_art_url, musician_id } = req.body;
   const fileBuffer = req.fileBuffer;
   const fileName = `${uuidv4()}-${req.fileName}`;
   const blockBlobClient = containerClient.getBlockBlobClient(fileName);




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




   const uploadDate = new Date().toISOString().slice(0, 19).replace("T", " ");




   let connection;
   try {
     connection = await mysql.createConnection(dbConfig);
     await connection.execute(
       `INSERT INTO Songs (title, musician_id, upload_date, genre, duration, file_url, cover_art_url, description)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
       [title, musician_id, uploadDate, genre, duration, fileUrl, cover_art_url, description]
     );
     console.log("✅ File metadata stored in database.");
   } catch (dbError) {
     console.error("❌ Database error:", dbError);
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
res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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
 "img-src 'self' https://*.clerk.dev https://accounts.clerk.dev https://img.clerk.com data: https://cdn.jsdelivr.net; " +
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
   upload.single("file")(req, res, async (err) => {
     if (err) {
       console.error("❌ Multer file upload error:", err);
       res.writeHead(500, { "Content-Type": "application/json" });
       res.end(JSON.stringify({ error: "File upload failed" }));
       return;
     }




     try {
       console.log("✅ File upload received");
       console.log("Received req.body:", req.body);
       console.log("Received file:", req.file);




       // Extract form metadata from req.body
       const { title, genre, description, cover_art_url, musician_id } = req.body;




       if (!title || !genre || !description || !cover_art_url || !musician_id) {
         throw new Error("Missing required metadata fields.");
       }




       // Extract uploaded file data
       req.fileBuffer = req.file.buffer;
       req.fileName = req.file.originalname;
       req.fileType = req.file.mimetype;




       console.log("✅ Processing file:", req.fileName);




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
             u.name AS musician_name
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



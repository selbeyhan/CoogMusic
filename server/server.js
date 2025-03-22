const http = require("http");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dbConfig = require("./dbConfig");
const multer = require("multer");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const { exec } = require("child_process");




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
   const [rows] = await connection.execute("SELECT * FROM Songs");
   return rows;
 } catch (err) {
   console.error("❌ Error fetching songs:", err.message);
   return [];
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




 // Fetch Top Songs from Database
 if (req.url === "/top-songs" && req.method === "GET") {
   try {
     const songs = await getAllSongs();
     res.writeHead(200, { "Content-Type": "application/json" });
     res.end(JSON.stringify(songs));
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
      res.end(JSON.stringify(rows[0]));
    }
  } catch (err) {
    console.error("❌ Error fetching user by Clerk ID:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Database error" }));
  }

  return;
}




 // Serve React Frontend (Static Files)
 const buildPath = path.join(__dirname, "build");
 if (req.method === "GET") {
   let filePath = path.join(buildPath, req.url === "/" ? "index.html" : req.url);


   fs.readFile(filePath, (err, content) => {
     if (!err) {
       res.writeHead(200);
       res.end(content);
     } else {
       // Fallback to index.html for client-side routing
       fs.readFile(path.join(buildPath, "index.html"), (err, content) => {
         if (!err) {
           res.writeHead(200);
           res.end(content);
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



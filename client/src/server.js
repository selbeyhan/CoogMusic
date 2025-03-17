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


const server = http.createServer(async (req, res) => {
 // Set CORS headers
 res.setHeader("Access-Control-Allow-Origin", "*");
 res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
 res.setHeader("Access-Control-Allow-Headers", "Content-Type");


 // Set Content Security Policy (CSP) Headers
 res.setHeader("Content-Security-Policy",
   "default-src 'self'; " +
   "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +  // ✅ ALLOWED UNSAFE-EVAL
   "https://*.clerk.dev https://clerk.dev https://accounts.clerk.dev " +
   "https://cdn.jsdelivr.net https://unpkg.com " +
   "https://relieved-gnat-14.clerk.accounts.dev; " + 
   "style-src 'self' 'unsafe-inline' " +
   "https://*.clerk.dev https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com https://static.clerk.dev; " + 
   "connect-src 'self' https://*.clerk.dev https://accounts.clerk.dev https://api.clerk.dev " +
   "https://cdn.jsdelivr.net https://relieved-gnat-14.clerk.accounts.dev " +
   "https://fonts.gstatic.com; " +  // ✅ ADDED FOR GOOGLE FONTS LOADING
   "img-src 'self' https://*.clerk.dev https://accounts.clerk.dev data: https://cdn.jsdelivr.net; " +
   "font-src 'self' https://fonts.gstatic.com;"
);


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


 // Serve React Frontend (Static Files)
 const buildPath = path.join(__dirname, "build");
 if (req.method === "GET") {
   let filePath = path.join(buildPath, req.url === "/" ? "index.html" : req.url);


   fs.readFile(filePath, (err, content) => {
     if (!err) {
       res.writeHead(200);
       res.end(content);
     } else {
       res.writeHead(404, { "Content-Type": "application/json" });
       res.end(JSON.stringify({ message: "Not Found" }));
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
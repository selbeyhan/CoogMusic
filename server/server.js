const http = require("http");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dbConfig = require("./dbConfig");
const multer = require("multer");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");

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



//try this func , should return link to the uploaded file that we can store in mysql dbs
async function uploadSong(req, res) {
  try {
      // Extract the file buffer from the request
      const fileBuffer = req.fileBuffer;

      // Generate a unique filename to avoid overwriting files
      const fileName = `${uuidv4()}-${req.fileName}`;

      // Get a reference to Azure Blob Storage
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);

      console.log("Uploading to Azure Blob Storage...");
      
      // Upload the file to Azure Blob Storage
      await blockBlobClient.uploadData(fileBuffer, {
          blobHTTPHeaders: { blobContentType: req.fileType },
      });

      // Get the public URL of the uploaded file
      const fileUrl = blockBlobClient.url;
      console.log("File uploaded:", fileUrl);

      
      // FOR TESTING: Adding fake values for song metadata
      const title = "test";  // Hardcoded title for testing
      const musician_id = "test1234";  // Fake musician ID for testing (should come from frontend)
      const genre = "Unknown";  // Default genre for testing
      const duration = 200;  // Fake duration in seconds
      const cover_art_url = null;  // No cover art in testing
      const description = "test";  // Hardcoded description for testing

      /* 
      Modify it for Production (Use Data from Frontend)

      // FOR PRODUCTION: Use actual values from the frontend request
      const { title, musician_id, genre, duration, cover_art_url, description } = req.body;

      // Ensure required fields are present
      if (!title || !musician_id || !duration) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing required song details (title, musician_id, duration)" }));
          return;
      }
      */


      // Get current timestamp in MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
      const uploadDate = new Date().toISOString().slice(0, 19).replace("T", " ");

      // ✅ Insert the song details into MySQL database
      let connection;
      try {
          connection = await mysql.createConnection(dbConfig);
          await connection.execute(
              `INSERT INTO Songs (title, musician_id, upload_date, genre, duration, file_url, cover_art_url, description) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [title, musician_id, uploadDate, genre, duration, fileUrl, cover_art_url, description]
          );
          console.log("File URL stored in database.");
      } catch (dbError) {
          console.error("Database error:", dbError);
      } finally {
          if (connection) await connection.end();
      }

      // ✅ Return success response with file URL
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "File uploaded and saved successfully", url: fileUrl }));
  } catch (error) {
      console.error("Upload error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Error uploading file", details: error.message }));
  }
}



const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle File Uploads -- function that is used for 
  // getting  file upload from user and uploading it to Azure Blob Storage
  if (req.url === "/upload" && req.method === "POST") {
    let data = []; // Store incoming file data in an array

    // Listen for incoming file chunks and add them to the array
    req.on("data", (chunk) => {
        data.push(chunk);
    });

    // When the entire file has been received, process it
    req.on("end", async () => {
        req.fileBuffer = Buffer.concat(data); // Combine all chunks into a single buffer
        req.fileName = "uploaded-song.mp3"; // Assign a filename
        req.fileType = "audio/mpeg"; // Set the file type (MIME type)

        await uploadSong(req, res); // Call the function to upload to Azure
    });

    return; // End request processing here
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

  //  404 Handler (If No Routes Match)
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Not Found" }));
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

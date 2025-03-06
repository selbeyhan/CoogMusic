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
    // Extract the file data from the request object
    const fileBuffer = req.fileBuffer; // The file content in binary format (Buffer)
    
    // Generate a unique filename using UUID to prevent overwriting existing files
    const fileName = `${uuidv4()}-${req.fileName}`;

    // Get a reference to the Azure Blob Storage container and create a new blob client for this file
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    console.log("Uploading to Azure Blob Storage...");

    // Upload the file buffer to Azure Blob Storage
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: { blobContentType: req.fileType }, // Set the correct content type (e.g., "audio/mpeg")
    });

    // Get the public URL of the uploaded file from Azure Blob Storage
    const fileUrl = blockBlobClient.url;
    console.log("File uploaded:", fileUrl);

    // Send a success response to the client with the file URL
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "File uploaded successfully", url: fileUrl }));
  } catch (error) {
    // Log any upload errors that occur
    console.error("Upload error:", error);

    // Send an error response to the client
    res.writeHead(500, { 'Content-Type': 'application/json' });
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

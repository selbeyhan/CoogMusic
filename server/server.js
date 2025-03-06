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

async function uploadSong(req, res) {
  try {
    const fileBuffer = req.fileBuffer;
    const fileName = `${uuidv4()}-${req.fileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    console.log("Uploading to Azure Blob Storage...");
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: { blobContentType: req.fileType },
    });

    const fileUrl = blockBlobClient.url;
    console.log("File uploaded:", fileUrl);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "File uploaded successfully", url: fileUrl }));
  } catch (error) {
    console.error("Upload error:", error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: "Error uploading file", details: error.message }));
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/upload' && req.method === 'POST') {
    let data = [];
    req.on('data', chunk => data.push(chunk));
    req.on('end', async () => {
      req.fileBuffer = Buffer.concat(data);
      req.fileName = "uploaded-song.mp3";
      req.fileType = "audio/mpeg";
      await uploadSong(req, res);
    });
    return;
  }

  if (req.url === '/top-songs' && req.method === 'GET') {
    try {
      const songs = await getAllSongs();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(songs));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Error fetching songs', error: err.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

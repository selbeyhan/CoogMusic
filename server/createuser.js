const http = require("http");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const dbConfig = require("./dbConfig");
const express = require("express");
const multer = require("multer");
const { BlobServiceClient } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 8080;
const upload = multer({ storage: multer.memoryStorage() });

const AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=coogsmusicstorage;AccountKey=WPvelBoCZ6xVs39HDIoJ+aVzkNwFoo0bex+H2uG9ANc+dZOUVlz3LxlVE91SLWIA3e1X0/L1sVba+AStpYb1uw==;EndpointSuffix=core.windows.net"
const AZURE_CONTAINER_NAME = "songs" 
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

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileName = `${uuidv4()}-${req.file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });

    const fileUrl = blockBlobClient.url;
    res.status(200).json({ message: "File uploaded successfully", url: fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Error uploading file" });
  }
});

app.get("/top-songs", async (req, res) => {
  try {
    const songs = await getAllSongs();
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: "Error fetching songs" });
  }
});

app.use(express.static("build"));
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

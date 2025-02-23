
const mysql = require('mysql2');
const fs = require('fs');

// Create a connection to Azure MySQL
const connection = mysql.createConnection({
    host: "coogsmusic-database-server.mysql.database.azure.com",
    user: "selbeyhan",  // ✅ Add @server-name
    password: "1234801&$@)HJFDS92h",         // 🔹 Replace with your actual password
    database: "main_database",         // 🔹 Replace with your actual database name
    port: 3306,
    ssl: {
        ca: fs.readFileSync("DigiCertGlobalRootCA.crt.pem")  // ✅ Use correct CA certificate
    }
});
// Test the connection
connection.connect(err => {
    if (err) {
        console.error("❌ Connection failed: " + err.message);
        return;
    }
    console.log("✅ Connected to Azure MySQL successfully!");
});

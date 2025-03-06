const fs = require('fs');

const dbConfig = {
  host: "coogsmusic-database-server.mysql.database.azure.com",
  user: "selbeyhan",
  password: "1234801&$@)HJFDS92h",
  database: "main_database",
  port: 3306,
  ssl: { ca: fs.readFileSync("DigiCertGlobalRootCA.crt.pem") }
};

module.exports = dbConfig;


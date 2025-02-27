const http = require('http');
const fs = require('fs');
const path = require('path');
const { getAllUsers } = require('./testconnection'); // Import getAllUsers

const PORT = process.env.PORT || 8080;

const server = http.createServer(async (req, res) => {
  if (req.url === '/users' && req.method === 'GET') {
    try {
      const users = await getAllUsers(); // Fetch users from MySQL

      // Debugging: Log data before sending to frontend
      console.log("🟢 Sending users to frontend:", users);
      console.log("🟡 Type of users:", typeof users);
      console.log("🟠 Is users an array?", Array.isArray(users));

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(users)); // Ensure an array is sent
    } catch (err) {
      console.error("❌ Error in API:", err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Error fetching users', error: err.message }));
    }
    return; // Stop further processing
  }

  // Serve frontend files (React app)
  let filePath = req.url === '/' 
    ? path.join(__dirname, '../client/build', 'index.html') 
    : path.join(__dirname, '../client/build', req.url);
  const extname = path.extname(filePath);
  let contentType = 'text/html';

  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpg'; break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, 'build', 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('500 - Internal Server Error');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

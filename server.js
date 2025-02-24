const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  // Determine the file path. Serve index.html for the root or any unknown route.
  let filePath = req.url === '/' ? path.join(__dirname, 'build', 'index.html') : path.join(__dirname, 'build', req.url);
  
  // Get the file extension to set the content type.
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
    // Add more types as needed.
  }

  // Read the file from the build directory.
  fs.readFile(filePath, (err, content) => {
    if (err) {
      // If the file isn't found, default to index.html for client-side routing.
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


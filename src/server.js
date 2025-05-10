const fs = require("fs");
const path = require("path");
const https = require('https');

const hostname = "127.0.0.1";
const port = 3000;

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
};

require("dotenv").config();

const api_keys = {
  "pidApiKey": process.env.PID_API_KEY,
  "weatherApiKey": process.env.WEATHER_API_KEY,
};

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

const server = https.createServer(options,(req, res) => {
  console.log(`Request for ${req.url} received.`);
  if (req.url.startsWith("/api/key")) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const key = url.searchParams.get("key");

    if (key && api_keys[key]) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ apiKey: api_keys[key] }));
    } else {
      res.statusCode = 400;
      res.end("Invalid or missing key parameter");
    }
  } else {
    // Serve static files
    const filePath = req.url === "/" ? "index.html" : req.url.substring(1).split("?")[0];
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile("./public/" + filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end("Error loading " + filePath);
      } else {
        res.statusCode = 200;
        res.setHeader("Content-Type", contentType);
        res.end(data);
      }
    });
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at https://${hostname}:${port}/`);
});

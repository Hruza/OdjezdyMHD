const fs = require("fs");
const path = require("path");
const https = require("https");
const { parseStringPromise } = require("xml2js");
const { GoogleGenAI } = require("@google/genai"); // Import Google AI SDK

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
  pidApiKey: process.env.PID_API_KEY,
  weatherApiKey: process.env.WEATHER_API_KEY,
  gemini: process.env.GEMINI_API_KEY, // Add your Google GenAI API key here
};

const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

const ai = new GoogleGenAI({ apiKey: api_keys.gemini }); // Initialize Google AI

const server = https.createServer(options, async (req, res) => {
  console.log(`Request for ${req.url} received.`);

  if (req.url.startsWith("/api/news")) {
    // Endpoint for RSS
    const rssUrl = "https://ct24.ceskatelevize.cz/rss/hlavni-zpravy";

    try {
      // Fetch RSS data
      const rssData = await fetchRSS(rssUrl);

      // Parse RSS data
      const news = await parseRSS(rssData);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(news));
    } catch (error) {
      console.error("Error fetching or parsing RSS feed:", error);
      res.statusCode = 500;
      res.end("Error fetching RSS feed");
    }
  } else if (req.url.startsWith("/api/analyze-news")) {
    // Endpoint to analyze news using Google AI
    const rssUrl = "https://ct24.ceskatelevize.cz/rss/hlavni-zpravy";

    try {
      // Fetch and parse RSS data
      const rssData = await fetchRSS(rssUrl);
      const news = await parseRSS(rssData);

      // Combine news data into a single string for AI processing
      const newsContent = news
        .map((item) => `${item.title}: ${item.description}`)
        .join("\n");

      const prompt = JSON.parse(fs.readFileSync("prompts.json", "utf-8")).news-analysis;

      // Use Google AI to analyze the news content
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `${prompt}\n\n${newsContent}`,
      });

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ summary: response.text }));
    } catch (error) {
      console.error("Error analyzing news:", error);
      res.statusCode = 500;
      res.end("Error analyzing news");
    }
  } else if (req.url.startsWith("/api/key")) {
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
    var filePath = req.url.substring(1).split("?")[0];
    filePath = filePath === "" ? "index.html" : filePath;
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

// Function to fetch RSS data
async function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400) {
        // Handle redirect
        const locationHeader = response.headers.location;
        const newUrl = locationHeader.startsWith("http")
          ? locationHeader
          : new URL(locationHeader, url).href;
        if (newUrl) {
          console.log(`Redirecting to ${newUrl}`);
          fetchRSS(newUrl).then(resolve).catch(reject);
        } else {
          reject(new Error("Redirected but no Location header provided"));
        }
        return;
      }

      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        if (response.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Failed to fetch RSS feed: ${response.statusCode}`));
        }
      });
    }).on("error", (error) => {
      reject(error);
    });
  });
}

// Function to parse RSS data
async function parseRSS(rssData) {
  const parsed = await parseStringPromise(rssData);
  const items = parsed.rss.channel[0].item;

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  return items
    .map((item) => ({
      title: item.title[0],
      link: item.link[0],
      description: item.description[0],
      pubDate: new Date(item.pubDate[0]),
    }))
    .filter((item) => item.pubDate > oneDayAgo); // Filter news from the last day
}

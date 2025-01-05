require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const urlParser = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware to parse POST request body
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());

// In-memory database for storing URLs
let urlDatabase = {};
let idCounter = 1;

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Helper function to validate URLs
const isValidUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (err) {
    return false;
  }
};

// POST Endpoint: Shorten a URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Validate the URL format
  if (!isValidUrl(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // Extract the hostname to verify it using DNS
  const hostname = new URL(originalUrl).hostname;
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // If valid, add to the database and return the short URL
    const shortUrl = idCounter++;
    urlDatabase[shortUrl] = originalUrl;

    res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});

// GET Endpoint: Redirect to original URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (!originalUrl) {
    return res.status(404).json({ error: 'No short URL found' });
  }

  res.redirect(originalUrl);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

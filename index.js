require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Require body-parser
const bodyParser = require('body-parser');
// Configure body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// In-memory URL Storage
const urlDatabase = {};
let urlCounter = 0;

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function (req, res) {
  // Get Original URL via Request Body
  const originalUrl = req.body.url;
  const hostname = urlParser.parse(originalUrl).hostname;

  // If there does not exist a hostname, return invalid url error
  if (!hostname) {
    return res.json({ error: 'invalid url' }); 
  } 

  // Check if the URL is valid
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    } else {
      // If the URL is valid, store it in the database and return the short URL
      const shortUrl = urlCounter++;
      urlDatabase[shortUrl] = originalUrl;
      return res.json({ original_url: originalUrl, short_url: shortUrl });
    }
  });
});

// Redirect to original URL
app.get('/api/shorturl/:short_url', function (req, res) {
  // Get the short URL from the request parameters
  const shortUrl = req.params.short_url;
  // Check if the Original URL exists in the database
  const originalUrl = urlDatabase[shortUrl];
  if (originalUrl) {
    // If it exists, redirect to the original URL
    res.redirect(originalUrl);  
  } else {
    // If it does not exist, return an error message
    res.json({ error: 'No short URL found for the given input' });
  }
});

// API Endpoint to list down the current in-memory URLS
app.get('/api/listshorturl', function (req, res) {
  const prettyJsonDatabase = JSON.stringify(urlDatabase, null, 4); // Indent with 4 spaces
  console.log(prettyJsonDatabase);
  res.setHeader('Content-Type', 'application/json');
  res.send(prettyJsonDatabase); // Use send instead of json to preserve formatting
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

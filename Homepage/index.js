const express = require('express');
const path = require('path'); // Use path module for file handling
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const port = process.env.PORT || 5000; // Use Render's assigned port if available

app.use(express.static(path.join(__dirname, 'public'))); // Correct static file path
app.use(bodyParser.json());

// Serve homepage correctly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Homepage', 'index.html')); // Fix homepage route
});

// Serve signup page properly
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'Homepage', 'signup', 'index.html')); // Correct path
});

// Serve login page correctly
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'Homepage', 'signup', 'login.html'));
});

// Handle signup POST request
app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;

  db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
    [username, email, password], 
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          res.status(400).json({ message: 'Username or email already exists' });
        } else {
          res.status(500).json({ message: 'Error registering user' });
        }
        return;
      }
      res.json({ message: 'User registered successfully' });
    }
  );
});

// Handle login POST request
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ? AND password = ?', 
    [username, password], 
    (err, user) => {
      if (err) {
        res.status(500).json({ message: 'Error logging in' });
        return;
      }
      if (user) {
        res.json({ message: 'Login successful' });
      } else {
        res.status(401).json({ message: 'Invalid username or password' });
      }
    }
  );
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});

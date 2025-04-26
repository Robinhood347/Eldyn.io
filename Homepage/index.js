const express = require('express');
const path = require('path'); // Import path module for better file handling
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const port = process.env.PORT || 5000; // Allow Render to set the correct port

app.use(express.static(__dirname));
app.use(bodyParser.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup', 'index.html')); // Ensure correct path
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup', 'index.html')); // Fix incorrect path
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup', 'login.html'));
});

// Handle signup
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

// Handle login
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

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});

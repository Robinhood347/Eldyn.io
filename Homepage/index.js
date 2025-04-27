const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./db');
const app = express();
const port = process.env.PORT || 5000;

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: 'https://eldyn-io.onrender.com', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.get('/test', (req, res) => {
    res.json({ message: 'CORS is working!' });
});

app.listen(10000, () => {
    console.log('Server running on port 10000');
});

// Change from 'public' to serve from root directory
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());

// Serve homepage correctly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Main index.html in root
});

// Serve signup page properly
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'Homepage', 'signup', 'signup.html')); 
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

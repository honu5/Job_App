const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
// Database connection pool
const pool = new Pool({
    user: 'your_username',
    host: 'localhost',
    database: 'job_app_db',
    password: 'your_password',
    port: 5432,
});

// Test the database connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error connecting to the database:', err.stack);
    }
    console.log('Successfully connected to the PostgreSQL database!');
    release();
});

// Routes to serve the HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// API route for user registration
app.post('/api/register', async (req, res) => {
    const { username, password, userType } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO Users (username, password, user_type) VALUES ($1, $2, $3) RETURNING id',
            [username, password, userType]
        );
        res.status(201).json({ message: 'User registered successfully!', userId: result.rows[0].id });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Username already exists.' });
        }
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});

// API route for user login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM Users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        
        res.status(200).json({ message: 'Logged in successfully!', user: { id: user.id, username: user.username, userType: user.user_type } });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

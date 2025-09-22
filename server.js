import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const saltRound = 10;
const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'job_app_db',
  password: process.env.DB_PASS,   
  port: 5432,
});

pool.connect()
  .then(() => console.log("Connected to database successfully"))
  .catch(err => console.error("Error connecting to the database", err));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.CALLBACK_URL_BASE}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value;

    let { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    let user = rows[0];

    if (!user && email) {
      ({ rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]));
      user = rows[0];
      if (user) {
        await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
      }
    }

    if (!user) {
      const insert = await pool.query(
        'INSERT INTO users (user_name, email, google_id) VALUES ($1, $2, $3) RETURNING *',
        [profile.displayName || email, email, googleId]
      );
      user = insert.rows[0];
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    session: false
  })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    res.render('dashboard', { message: "You logged in successfully! Enjoy MelaAfalagi", user: req.user });
  }
);

app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login'));
app.get('/signup', (req, res) => res.render('signup'));

app.post("/signup", async (req, res) => {
  const { name, email, password, confirm_password } = req.body;

  if (password !== confirm_password) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRound);

    const result = await pool.query(
      "INSERT INTO users (user_name, email, my_password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    console.log("User registered successfully:", result.rows[0]);
    res.render("dashboard", { message: "You signed up successfully! Enjoy MelaAfalagi" });
  } catch (err) {
    console.error("Error registering user", err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.render("login", { error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.my_password);

    if (!match) {
      return res.render("login", { error: "Invalid credentials" });
    }

    return res.render("dashboard");
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

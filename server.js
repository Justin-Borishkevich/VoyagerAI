const express = require('express');
const path = require('path');
const axios = require('axios');
const session = require('express-session');

const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your-secret-key', // Change this to an environment variable for safety
  resave: false,
  saveUninitialized: false
}));

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    // Redirect the user to the login page and pass along the originally requested URL.
    return res.redirect('/login.html?next=' + encodeURIComponent(req.originalUrl));
  }
}

// Your Discord webhook URL
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1387206644651262042/PYNJdYVWb4_p6GazYeRMXNwZu73iBB4Nd7oPyMhELYTG8KzJt2G2km6ZdoS3i_vHZDPs';

// POST endpoint to receive contact form submissions
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  const discordPayload = {
    content: `📬 **New Contact Form Submission**\n\n**Name:** ${name}\n**Email:** ${email}\n**Subject:** ${subject}\n**Message:**\n${message}`
  };

  try {
    await axios.post(DISCORD_WEBHOOK_URL, discordPayload);
    res.status(200).json({ success: true, message: 'Message sent to Discord!' });
  } catch (error) {
    console.error('Error sending to Discord:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});


// ###################################...

// ----------------------
// Route: Login Page (GET)
// ----------------------
app.get('/login.html', (req, res) => {
  // Get the "next" parameter from the query string. Default to home if not provided.
  const nextUrl = req.query.next || '/index.html';
  // Render a simple dynamic login form.
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Login | VoyagerAI</title>
    </head>
    <body>
      <h2>Login</h2>
      <form method="POST" action="/login.html">
         <!-- Preserve the "next" parameter -->
         <input type="hidden" name="next" value="${nextUrl}" />
         <div>
           <label>Username:</label>
           <input type="text" name="username" required />
         </div>
         <div>
           <label>Password:</label>
           <input type="password" name="password" required />
         </div>
         <button type="submit">Login</button>
      </form>
    </body>
    </html>
  `);
});

// ----------------------
// Route: Process Login (POST)
// ----------------------
app.post('/login.html', (req, res) => {
  const { username, password, next } = req.body;
  
  // Dummy authentication: Replace with proper auth logic
  if (username === 'user' && password === 'pass') {
    req.session.user = { username: username };
    // Redirect back to the originally requested page (if provided).
    return res.redirect(next || '/index.html');
  } else {
    return res.send('Login failed. <a href="/login.html">Try again</a>');
  }
});


// Route: Protected Rentals Page
// This route intercepts GET requests to rentals.html and checks for authentication.
app.get('/rentals.html', isAuthenticated, (req, res) => {
  // If the user is authenticated, serve the static rentals.html file.
  res.sendFile(path.join(__dirname, 'public', 'rentals.html'));
});


// serve the other static web pages
app.use(express.static(path.join(__dirname, 'public')));

// ...################################

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

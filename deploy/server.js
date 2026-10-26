/**
 * Lex Global Advocacy — Secure Production Backend Server
 * Technology: Node.js + Express (CommonJS, no build step required)
 * Run: node server.js
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.resolve(__dirname, 'data', 'db.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lexglobal2026';

// Active authenticated session tokens
const activeSessions = new Set();

// In-memory sliding window rate limiter
const rateLimits = new Map();
function rateLimiter(windowMs, maxRequests) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    const record = rateLimits.get(key);
    if (!record || now > record.resetAt) {
      rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.'
      });
    }

    record.count++;
    next();
  };
}

// Security Headers (OWASP & PCI recommended)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline'; img-src 'self' https: data:;"
  );
  next();
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Database Helpers
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { posts: [], courses: [], team: [], inquiries: [], adminPassword: ADMIN_PASSWORD };
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading db.json:', e);
    return { posts: [], courses: [], team: [], inquiries: [], adminPassword: ADMIN_PASSWORD };
  }
}

function writeDb(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing db.json:', e);
  }
}

// Authentication Guard Middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required.' });
  }
  next();
}

function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
}

// ==================== REST API ENDPOINTS ====================

// 1. Admin Authentication
app.post('/api/auth/login', rateLimiter(60000, 10), (req, res) => {
  const { password } = req.body;
  const db = readDb();
  const validPw = db.adminPassword || ADMIN_PASSWORD;

  if (password === validPw) {
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.add(token);
    res.json({ success: true, token, message: 'Authentication successful.' });
  } else {
    res.status(401).json({ error: 'Incorrect management password.' });
  }
});

app.get('/api/auth/verify', (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  res.json({ authenticated: activeSessions.has(token) });
});

app.post('/api/auth/password', requireAuth, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  const db = readDb();
  db.adminPassword = newPassword;
  writeDb(db);
  res.json({ success: true, message: 'Password updated successfully.' });
});

// 2. Blog & Legal Articles API
app.get('/api/blogs', (req, res) => {
  const db = readDb();
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const isAdmin = activeSessions.has(token);

  const posts = isAdmin ? db.posts : (db.posts || []).filter((p) => p.published !== false);
  res.json(posts || []);
});

app.get('/api/blogs/:slug', (req, res) => {
  const db = readDb();
  const post = (db.posts || []).find((p) => p.slug === req.params.slug);
  if (!post) return res.status(404).json({ error: 'Article not found.' });

  post.views = (post.views || 0) + 1;
  writeDb(db);
  res.json(post);
});

// Create Blog (Protected)
app.post('/api/blogs', requireAuth, (req, res) => {
  const { title, subtitle, category, tags, author, authorRole, authorAvatar, image, content, featured, published, readTime } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Headline and content are required.' });
  }

  const slug = (req.body.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const db = readDb();

  if (db.posts.some((p) => p.slug === slug)) {
    return res.status(409).json({ error: 'An article with this URL slug already exists.' });
  }

  const newPost = {
    id: 'p-' + Date.now(),
    slug,
    title: sanitizeText(title),
    subtitle: sanitizeText(subtitle || ''),
    category: sanitizeText(category || 'General'),
    tags: Array.isArray(tags) ? tags.map((t) => sanitizeText(t)) : [],
    author: sanitizeText(author || 'Lex Global Advocacy'),
    authorRole: sanitizeText(authorRole || 'Legal Counsel'),
    authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    date: new Date().toISOString().slice(0, 10),
    updated: new Date().toISOString().slice(0, 10),
    readTime: readTime || '6 min read',
    image: image || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=80',
    featured: Boolean(featured),
    published: published !== false,
    views: 1,
    likes: 0,
    content,
    comments: []
  };

  db.posts.unshift(newPost);
  writeDb(db);
  res.status(201).json(newPost);
});

// Update Blog (Protected)
app.put('/api/blogs/:id', requireAuth, (req, res) => {
  const db = readDb();
  const index = db.posts.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Article not found.' });

  const existing = db.posts[index];
  const updates = req.body;

  db.posts[index] = {
    ...existing,
    ...updates,
    title: updates.title !== undefined ? sanitizeText(updates.title) : existing.title,
    subtitle: updates.subtitle !== undefined ? sanitizeText(updates.subtitle) : existing.subtitle,
    category: updates.category !== undefined ? sanitizeText(updates.category) : existing.category,
    tags: Array.isArray(updates.tags) ? updates.tags.map((t) => sanitizeText(t)) : existing.tags,
    author: updates.author !== undefined ? sanitizeText(updates.author) : existing.author,
    updated: new Date().toISOString().slice(0, 10),
    content: updates.content !== undefined ? updates.content : existing.content
  };

  writeDb(db);
  res.json(db.posts[index]);
});

// Delete Blog (Protected)
app.delete('/api/blogs/:id', requireAuth, (req, res) => {
  const db = readDb();
  const initial = db.posts.length;
  db.posts = db.posts.filter((p) => p.id !== req.params.id);
  if (db.posts.length === initial) return res.status(404).json({ error: 'Article not found.' });

  writeDb(db);
  res.json({ success: true, message: 'Article deleted.' });
});

// Like Blog (Public)
app.post('/api/blogs/:id/like', rateLimiter(10000, 10), (req, res) => {
  const db = readDb();
  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Article not found.' });
  post.likes = (post.likes || 0) + 1;
  writeDb(db);
  res.json({ likes: post.likes });
});

// Add Comment (Public)
app.post('/api/blogs/:id/comments', rateLimiter(30000, 5), (req, res) => {
  const { author, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content cannot be empty.' });

  const db = readDb();
  const post = db.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Article not found.' });

  const newComment = {
    id: 'cm-' + Date.now(),
    author: sanitizeText(author || 'Legal Practitioner'),
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    date: new Date().toISOString().slice(0, 10),
    content: sanitizeText(content),
    likes: 0,
    replies: []
  };

  post.comments = post.comments || [];
  post.comments.unshift(newComment);
  writeDb(db);
  res.status(201).json(newComment);
});

// 3. Courses API
app.get('/api/courses', (req, res) => {
  const db = readDb();
  res.json(db.courses || []);
});

app.get('/api/courses/:slug', (req, res) => {
  const db = readDb();
  const course = (db.courses || []).find((c) => c.slug === req.params.slug);
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  res.json(course);
});

// 4. Team API
app.get('/api/team', (req, res) => {
  const db = readDb();
  res.json(db.team || []);
});

// 5. Confidential Client Intake Inquiries (Rate Limited)
app.post('/api/inquiries', rateLimiter(60000, 5), (req, res) => {
  const { name, email, organization, practiceArea, jurisdiction, description, urgency } = req.body;
  if (!name || !email || !description) {
    return res.status(400).json({ error: 'Name, email, and synopsis are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const db = readDb();
  const newInquiry = {
    id: 'inq-' + Date.now(),
    name: sanitizeText(name),
    email: sanitizeText(email),
    organization: sanitizeText(organization || 'Individual Party'),
    practiceArea: sanitizeText(practiceArea || 'International Arbitration'),
    jurisdiction: sanitizeText(jurisdiction || 'Multi-Jurisdictional'),
    urgency: sanitizeText(urgency || 'Routine'),
    description: sanitizeText(description),
    createdAt: new Date().toISOString(),
    status: 'New'
  };

  db.inquiries = db.inquiries || [];
  db.inquiries.unshift(newInquiry);
  writeDb(db);

  res.status(201).json({
    success: true,
    message: 'Confidential inquiry submitted successfully.',
    id: newInquiry.id
  });
});

app.get('/api/inquiries', requireAuth, (req, res) => {
  const db = readDb();
  res.json(db.inquiries || []);
});

// ==================== SERVE STATIC FRONTEND ====================
const publicDir = path.resolve(__dirname, 'public');
app.use(express.static(publicDir));

// Fallback to index.html for SPA hash/history routing
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`  Lex Global Advocacy Production Server Online      `);
  console.log(`  Port: http://localhost:${PORT}                      `);
  console.log(`  Admin Password: ${ADMIN_PASSWORD}                 `);
  console.log(`====================================================`);
});

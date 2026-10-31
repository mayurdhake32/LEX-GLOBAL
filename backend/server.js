/**
 * LEX GLOBAL ADVOCACY — Production Backend API Server
 * Technology: Node.js + Express (CommonJS, no build step required)
 * Run: node server.js
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.resolve(__dirname, 'data', 'db.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lexglobal2026';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

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

// Enable CORS for external frontends (e.g. Vercel, Netlify, S3)
app.use(cors({
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Database Helpers
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { posts: [], courses: [], team: [], inquiries: [], enrollments: [], adminPassword: ADMIN_PASSWORD };
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(raw);
    data.posts = data.posts || [];
    data.courses = data.courses || [];
    data.team = data.team || [];
    data.inquiries = data.inquiries || [];
    data.enrollments = data.enrollments || [];
    return data;
  } catch (e) {
    console.error('Error reading db.json:', e);
    return { posts: [], courses: [], team: [], inquiries: [], enrollments: [], adminPassword: ADMIN_PASSWORD };
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

// ==================== HEALTH & ROOT ====================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    firm: 'LEX GLOBAL ADVOCACY LLP',
    llpin: 'ACK-4630',
    version: '2.4.0',
    timestamp: new Date().toISOString()
  });
});

// ==================== AUTHENTICATION ROUTES ====================

app.post('/api/auth/login', rateLimiter(60000, 10), (req, res) => {
  const { password } = req.body;
  const db = readDb();
  const validPw = db.adminPassword || ADMIN_PASSWORD;

  if (password === validPw) {
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.add(token);
    res.json({ success: true, token, message: 'Authentication successful.' });
  } else {
    res.status(401).json({ error: 'Invalid management password.' });
  }
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  res.json({ authenticated: activeSessions.has(token) });
});

app.post('/api/auth/password', requireAuth, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }
  const db = readDb();
  db.adminPassword = newPassword;
  writeDb(db);
  res.json({ success: true, message: 'Admin password updated successfully.' });
});

// ==================== COURSES & ACADEMY ROUTES ====================

app.get('/api/courses', (req, res) => {
  const db = readDb();
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isAdmin = activeSessions.has(token);
  const courses = isAdmin ? db.courses : (db.courses || []).filter(c => c.published !== false);
  res.json(courses || []);
});

app.get('/api/courses/:slug', (req, res) => {
  const db = readDb();
  const course = (db.courses || []).find(c => c.slug === req.params.slug || c.id === req.params.slug);
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  res.json(course);
});

app.post('/api/courses', requireAuth, (req, res) => {
  const { title, slug, category, level, duration, price, instructor, instructorTitle, instructorAvatar, image, description, outcomes, curriculum, published } = req.body;

  if (!title) return res.status(400).json({ error: 'Course title is required.' });

  const courseSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const db = readDb();

  const newCourse = {
    id: 'c-' + Date.now(),
    slug: courseSlug,
    title: sanitizeText(title),
    category: sanitizeText(category || 'General Legal Practice'),
    level: sanitizeText(level || 'Masterclass'),
    duration: sanitizeText(duration || '6 weeks · 18 lectures'),
    price: Number(price) || 0,
    currency: 'INR',
    instructor: sanitizeText(instructor || 'Senior Partner'),
    instructorTitle: sanitizeText(instructorTitle || 'Executive Faculty'),
    instructorAvatar: instructorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    rating: 4.9,
    students: 1,
    image: image || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=80',
    description: sanitizeText(description || ''),
    accreditation: 'Accredited by Global Bar CLE Council',
    outcomes: Array.isArray(outcomes) ? outcomes.map(o => sanitizeText(o)) : [],
    curriculum: Array.isArray(curriculum) ? curriculum : [],
    published: published !== false
  };

  db.courses.unshift(newCourse);
  writeDb(db);
  res.status(201).json(newCourse);
});

app.delete('/api/courses/:id', requireAuth, (req, res) => {
  const db = readDb();
  const initialLen = db.courses.length;
  db.courses = db.courses.filter(c => c.id !== req.params.id);
  if (db.courses.length === initialLen) return res.status(404).json({ error: 'Course not found.' });
  writeDb(db);
  res.json({ success: true, message: 'Course removed.' });
});

app.post('/api/courses/enroll', rateLimiter(60000, 10), (req, res) => {
  const { courseId, courseSlug, name, email, phone, organization, mode, note } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Student full name and email are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const db = readDb();
  const matchedCourse = (db.courses || []).find(c => c.id === courseId || c.slug === courseSlug);
  const courseTitle = matchedCourse ? matchedCourse.title : (req.body.courseTitle || 'Executive Legal Masterclass');

  const enrollmentId = 'ENR-' + Date.now();
  const studentId = 'LGA-ACAD-' + Math.floor(1000 + Math.random() * 9000);

  const newEnrollment = {
    id: enrollmentId,
    courseId: courseId || (matchedCourse ? matchedCourse.id : 'c1'),
    courseTitle,
    name: sanitizeText(name),
    email: sanitizeText(email),
    phone: sanitizeText(phone || ''),
    organization: sanitizeText(organization || 'Individual Practitioner'),
    mode: sanitizeText(mode || 'Live Interactive Weekend Cohort'),
    note: sanitizeText(note || ''),
    status: 'Confirmed',
    enrolledAt: new Date().toISOString(),
    studentId
  };

  db.enrollments = db.enrollments || [];
  db.enrollments.unshift(newEnrollment);

  if (matchedCourse) {
    matchedCourse.students = (matchedCourse.students || 0) + 1;
  }

  writeDb(db);

  res.status(201).json({
    success: true,
    message: 'Enrollment confirmed successfully.',
    enrollmentId,
    studentId,
    courseTitle,
    enrolledAt: newEnrollment.enrolledAt
  });
});

app.get('/api/enrollments', requireAuth, (req, res) => {
  const db = readDb();
  res.json(db.enrollments || []);
});

app.delete('/api/enrollments/:id', requireAuth, (req, res) => {
  const db = readDb();
  db.enrollments = (db.enrollments || []).filter(e => e.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: 'Enrollment record removed.' });
});

// ==================== BLOGS & PUBLICATIONS ====================

app.get('/api/blogs', (req, res) => {
  const db = readDb();
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isAdmin = activeSessions.has(token);
  const posts = isAdmin ? db.posts : (db.posts || []).filter(p => p.published !== false);
  res.json(posts || []);
});

app.get('/api/blogs/:slug', (req, res) => {
  const db = readDb();
  const post = (db.posts || []).find(p => p.slug === req.params.slug || p.id === req.params.slug);
  if (!post) return res.status(404).json({ error: 'Article not found.' });
  post.views = (post.views || 0) + 1;
  writeDb(db);
  res.json(post);
});

app.post('/api/blogs', requireAuth, (req, res) => {
  const { title, subtitle, category, tags, author, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content are required.' });

  const slug = (req.body.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const db = readDb();

  const newPost = {
    id: 'p-' + Date.now(),
    slug,
    title: sanitizeText(title),
    subtitle: sanitizeText(subtitle || ''),
    category: sanitizeText(category || 'General Legal Practice'),
    tags: Array.isArray(tags) ? tags.map(t => sanitizeText(t)) : [],
    author: sanitizeText(author || 'Lex Global Advocacy'),
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    date: new Date().toISOString().slice(0, 10),
    readTime: req.body.readTime || '6 min read',
    image: req.body.image || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=80',
    published: req.body.published !== false,
    views: 1,
    likes: 0,
    content: content,
    comments: []
  };

  db.posts.unshift(newPost);
  writeDb(db);
  res.status(201).json(newPost);
});

app.delete('/api/blogs/:id', requireAuth, (req, res) => {
  const db = readDb();
  const initialLen = db.posts.length;
  db.posts = db.posts.filter(p => p.id !== req.params.id);
  if (db.posts.length === initialLen) return res.status(404).json({ error: 'Article not found.' });
  writeDb(db);
  res.json({ success: true, message: 'Article removed.' });
});

// ==================== INQUIRIES & CONTACT ====================

const handleInquiry = (req, res) => {
  const { name, email, phone, organization, practiceArea, message, description } = req.body;
  const content = description || message || '';

  if (!name || !email || !content) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const db = readDb();
  const newInq = {
    id: 'inq-' + Date.now(),
    name: sanitizeText(name),
    email: sanitizeText(email),
    phone: sanitizeText(phone || ''),
    organization: sanitizeText(organization || 'Individual Party'),
    practiceArea: sanitizeText(practiceArea || 'General Legal Practice'),
    urgency: sanitizeText(req.body.urgency || 'Routine'),
    description: sanitizeText(content),
    createdAt: new Date().toISOString(),
    status: 'New'
  };

  db.inquiries = db.inquiries || [];
  db.inquiries.unshift(newInq);
  writeDb(db);

  res.status(201).json({ success: true, message: 'Inquiry registered.', id: newInq.id });
};

app.post('/api/inquiries', rateLimiter(60000, 10), handleInquiry);
app.post('/api/contact', rateLimiter(60000, 10), handleInquiry);

app.get('/api/inquiries', requireAuth, (req, res) => {
  const db = readDb();
  res.json(db.inquiries || []);
});

app.put('/api/inquiries/:id', requireAuth, (req, res) => {
  const { status } = req.body;
  const db = readDb();
  const inq = (db.inquiries || []).find(i => i.id === req.params.id);
  if (!inq) return res.status(404).json({ error: 'Inquiry not found.' });
  inq.status = sanitizeText(status || inq.status);
  writeDb(db);
  res.json(inq);
});

app.delete('/api/inquiries/:id', requireAuth, (req, res) => {
  const db = readDb();
  db.inquiries = (db.inquiries || []).filter(i => i.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: 'Inquiry deleted.' });
});

// ==================== ADMIN STATS & BACKUP ====================

app.get('/api/admin/stats', requireAuth, (req, res) => {
  const db = readDb();
  res.json({
    totalInquiries: (db.inquiries || []).length,
    newInquiries: (db.inquiries || []).filter(i => i.status === 'New').length,
    totalEnrollments: (db.enrollments || []).length,
    totalCourses: (db.courses || []).length,
    totalPosts: (db.posts || []).length
  });
});

app.get('/api/admin/export', requireAuth, (req, res) => {
  const db = readDb();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="lex-global-backup.json"');
  res.send(JSON.stringify(db, null, 2));
});

app.get('/api/team', (req, res) => {
  const db = readDb();
  res.json(db.team || []);
});

// Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`LEX GLOBAL ADVOCACY API Server listening on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/api/health`);
});

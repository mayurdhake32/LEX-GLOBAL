import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_PATH = path.resolve(process.cwd(), 'data', 'db.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'lexglobal2026';

// Cryptographic token store for authenticated sessions
const activeSessions = new Set<string>();

// Simple in-memory sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function rateLimiter(windowMs: number, maxRequests: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    const record = rateLimitMap.get(key as string);
    if (!record || now > record.resetAt) {
      rateLimitMap.set(key as string, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.'
      });
      return;
    }

    record.count++;
    next();
  };
}

// Enable CORS for all origins (permits separate frontend hosting e.g. Vercel, Netlify)
app.use(cors());

// Security Headers Middleware (Permit iframe embedding for AI Studio preview)
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
      return { posts: [], courses: [], team: [], inquiries: [], enrollments: [] };
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(raw);
    data.posts = data.posts || [];
    data.courses = data.courses || [];
    data.team = data.team || [];
    data.inquiries = data.inquiries || [];
    data.enrollments = data.enrollments || [];
    return data;
  } catch (err) {
    console.error('Error reading DB:', err);
    return { posts: [], courses: [], team: [], inquiries: [], enrollments: [] };
  }
}

function writeDb(data: any) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Authentication Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token || !activeSessions.has(token)) {
    res.status(401).json({ error: 'Unauthorized: Valid admin token required.' });
    return;
  }
  next();
}

function sanitizeText(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
}

// ==================== AUTHENTICATION ROUTES ====================

// Auth: Login
app.post('/api/auth/login', rateLimiter(60000, 10), (req: Request, res: Response) => {
  const { username, password } = req.body;
  const db = readDb();
  const validPw = db.adminPassword || ADMIN_PASSWORD;

  // Accept username 'admin' or direct password match
  if (password === validPw) {
    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.add(token);
    res.json({ success: true, token, message: 'Authentication successful.' });
  } else {
    res.status(401).json({ error: 'Invalid management password.' });
  }
});

// Auth: Verify
app.get('/api/auth/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  res.json({ authenticated: activeSessions.has(token) });
});

// Auth: Change password (Protected)
app.post('/api/auth/password', requireAuth, (req: Request, res: Response) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }
  const db = readDb();
  db.adminPassword = newPassword;
  writeDb(db);
  res.json({ success: true, message: 'Admin password updated successfully.' });
});

// ==================== BLOGS & PUBLICATIONS ROUTES ====================

// Blogs: List
app.get('/api/blogs', (req: Request, res: Response) => {
  const db = readDb();
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isAdmin = activeSessions.has(token);

  const posts = isAdmin ? db.posts : (db.posts || []).filter((p: any) => p.published !== false);
  res.json(posts || []);
});

// Blogs: Get by Slug or ID
app.get('/api/blogs/:slug', (req: Request, res: Response) => {
  const db = readDb();
  const post = (db.posts || []).find((p: any) => p.slug === req.params.slug || p.id === req.params.slug);
  if (!post) {
    res.status(404).json({ error: 'Article not found.' });
    return;
  }
  post.views = (post.views || 0) + 1;
  writeDb(db);
  res.json(post);
});

// Blogs: Create (Protected)
app.post('/api/blogs', requireAuth, (req: Request, res: Response) => {
  const { title, subtitle, category, tags, author, authorRole, authorAvatar, image, content, featured, published, readTime } = req.body;

  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required.' });
    return;
  }

  const slug = (req.body.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const db = readDb();

  const newPost = {
    id: 'p-' + Date.now(),
    slug,
    title: sanitizeText(title),
    subtitle: sanitizeText(subtitle || ''),
    category: sanitizeText(category || 'General'),
    tags: Array.isArray(tags) ? tags.map((t: string) => sanitizeText(t)) : [],
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
    content: content,
    comments: []
  };

  db.posts.unshift(newPost);
  writeDb(db);
  res.status(201).json(newPost);
});

// Blogs: Update (Protected)
app.put('/api/blogs/:id', requireAuth, (req: Request, res: Response) => {
  const db = readDb();
  const index = db.posts.findIndex((p: any) => p.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'Article not found.' });
    return;
  }

  const existing = db.posts[index];
  const updates = req.body;

  db.posts[index] = {
    ...existing,
    ...updates,
    title: updates.title !== undefined ? sanitizeText(updates.title) : existing.title,
    subtitle: updates.subtitle !== undefined ? sanitizeText(updates.subtitle) : existing.subtitle,
    category: updates.category !== undefined ? sanitizeText(updates.category) : existing.category,
    tags: Array.isArray(updates.tags) ? updates.tags.map((t: string) => sanitizeText(t)) : existing.tags,
    author: updates.author !== undefined ? sanitizeText(updates.author) : existing.author,
    updated: new Date().toISOString().slice(0, 10),
    content: updates.content !== undefined ? updates.content : existing.content
  };

  writeDb(db);
  res.json(db.posts[index]);
});

// Blogs: Delete (Protected)
app.delete('/api/blogs/:id', requireAuth, (req: Request, res: Response) => {
  const db = readDb();
  const initialLen = db.posts.length;
  db.posts = db.posts.filter((p: any) => p.id !== req.params.id);

  if (db.posts.length === initialLen) {
    res.status(404).json({ error: 'Article not found.' });
    return;
  }

  writeDb(db);
  res.json({ success: true, message: 'Article deleted successfully.' });
});

// ==================== COURSES & ACADEMY ROUTES ====================

// Courses: List
app.get('/api/courses', (req: Request, res: Response) => {
  const db = readDb();
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isAdmin = activeSessions.has(token);

  const courses = isAdmin ? db.courses : (db.courses || []).filter((c: any) => c.published !== false);
  res.json(courses || []);
});

// Courses: Get by Slug or ID
app.get('/api/courses/:slug', (req: Request, res: Response) => {
  const db = readDb();
  const course = (db.courses || []).find((c: any) => c.slug === req.params.slug || c.id === req.params.slug);
  if (!course) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }
  res.json(course);
});

// Courses: Create / Update (Protected)
app.post('/api/courses', requireAuth, (req: Request, res: Response) => {
  const { title, slug, category, level, duration, price, instructor, instructorTitle, instructorAvatar, image, description, outcomes, curriculum, published } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Course title is required.' });
    return;
  }

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
    outcomes: Array.isArray(outcomes) ? outcomes.map((o: string) => sanitizeText(o)) : [],
    curriculum: Array.isArray(curriculum) ? curriculum : [],
    published: published !== false
  };

  db.courses.unshift(newCourse);
  writeDb(db);
  res.status(201).json(newCourse);
});

// Courses: Delete (Protected)
app.delete('/api/courses/:id', requireAuth, (req: Request, res: Response) => {
  const db = readDb();
  const initialLen = db.courses.length;
  db.courses = db.courses.filter((c: any) => c.id !== req.params.id);

  if (db.courses.length === initialLen) {
    res.status(404).json({ error: 'Course not found.' });
    return;
  }

  writeDb(db);
  res.json({ success: true, message: 'Course deleted successfully.' });
});

// Courses: Student Enrollment (Public, rate limited)
app.post('/api/courses/enroll', rateLimiter(60000, 10), (req: Request, res: Response) => {
  const { courseId, courseSlug, name, email, phone, organization, mode, note } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: 'Student full name and a valid email are required.' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }

  const db = readDb();
  const matchedCourse = (db.courses || []).find((c: any) => c.id === courseId || c.slug === courseSlug);
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

  // Increment course student count if matched
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

// Enrollments: List (Protected)
app.get('/api/enrollments', requireAuth, (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.enrollments || []);
});

// Enrollments: Delete (Protected)
app.delete('/api/enrollments/:id', requireAuth, (req: Request, res: Response) => {
  const db = readDb();
  db.enrollments = (db.enrollments || []).filter((e: any) => e.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: 'Enrollment record removed.' });
});

// ==================== INQUIRIES & CONTACT ROUTES ====================

const handleInquirySubmission = (req: Request, res: Response) => {
  const { name, email, phone, organization, practiceArea, jurisdiction, description, message, subject, urgency } = req.body;
  const content = description || message || '';

  if (!name || !email || !content) {
    res.status(400).json({ error: 'Name, email, and a brief description/message are required.' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }

  const db = readDb();
  const newInquiry = {
    id: 'inq-' + Date.now(),
    name: sanitizeText(name),
    email: sanitizeText(email),
    phone: sanitizeText(phone || ''),
    subject: sanitizeText(subject || ''),
    organization: sanitizeText(organization || 'Individual Party'),
    practiceArea: sanitizeText(practiceArea || 'General Counsel & Advocacy'),
    jurisdiction: sanitizeText(jurisdiction || 'Multi-Jurisdictional'),
    urgency: sanitizeText(urgency || 'Routine'),
    description: sanitizeText(content),
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
};

app.post('/api/inquiries', rateLimiter(60000, 10), handleInquirySubmission);
app.post('/api/contact', rateLimiter(60000, 10), handleInquirySubmission);

// Inquiries: List (Protected)
app.get('/api/inquiries', requireAuth, (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.inquiries || []);
});

// Inquiries: Update Status (Protected)
app.put('/api/inquiries/:id', requireAuth, (req: Request, res: Response) => {
  const { status } = req.body;
  const db = readDb();
  const inq = (db.inquiries || []).find((i: any) => i.id === req.params.id);
  if (!inq) {
    res.status(404).json({ error: 'Inquiry not found.' });
    return;
  }
  inq.status = sanitizeText(status || inq.status);
  writeDb(db);
  res.json(inq);
});

// Inquiries: Delete (Protected)
app.delete('/api/inquiries/:id', requireAuth, (req: Request, res: Response) => {
  const db = readDb();
  db.inquiries = (db.inquiries || []).filter((i: any) => i.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: 'Inquiry removed.' });
});

// ==================== ADMIN PORTAL DASHBOARD STATS & EXPORT ====================

app.get('/api/admin/stats', requireAuth, (req: Request, res: Response) => {
  const db = readDb();
  res.json({
    totalInquiries: (db.inquiries || []).length,
    newInquiries: (db.inquiries || []).filter((i: any) => i.status === 'New').length,
    totalEnrollments: (db.enrollments || []).length,
    totalCourses: (db.courses || []).length,
    totalPosts: (db.posts || []).length
  });
});

app.get('/api/admin/export', requireAuth, (req: Request, res: Response) => {
  const db = readDb();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="lex-global-backup.json"');
  res.send(JSON.stringify(db, null, 2));
});

// Team: List
app.get('/api/team', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.team || []);
});

// ==================== ADMIN PORTAL SERVING ====================

// Serve admin.html directly on /admin or /admin.html
app.get(['/admin', '/admin.html'], (req: Request, res: Response) => {
  const adminFile = path.resolve(process.cwd(), 'admin.html');
  if (fs.existsSync(adminFile)) {
    res.sendFile(adminFile);
  } else {
    res.redirect('/');
  }
});

// ==================== FRONTEND SERVING ====================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite dev server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve built static assets from dist/
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lex Global Advocacy Server running on http://0.0.0.0:${PORT}`);
    console.log(`Admin Portal accessible at http://0.0.0.0:${PORT}/admin.html`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

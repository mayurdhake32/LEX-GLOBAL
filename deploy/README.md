# Lex Global Advocacy — Production Deployment Package

A standalone, secure legal counsel and dynamic blogs website built with **HTML5, CSS3, Vanilla JavaScript, and a Secure Node.js / Express Backend**. No React or TSX build step required.

---

## 📁 Directory Structure

```
deploy/
├── package.json         # Server dependencies (Express, Dotenv)
├── server.js            # Secure Node.js / Express backend server
├── data/
│   └── db.json          # Persistent database (blogs, courses, inquiries)
└── public/
    ├── index.html       # Standalone HTML entry point
    ├── css/
    │   └── style.css    # Pure responsive CSS (Fraunces + Inter typography)
    └── js/
        └── app.js       # Dynamic client controller & API connector
```

---

## 🚀 How to Run Locally

1. Open your terminal in the `deploy/` directory:
   ```bash
   cd deploy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser at:
   `http://localhost:3000`

---

## 🔒 Security Architecture & Features

1. **HTTP Security Headers**:
   - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
   - `X-Frame-Options: SAMEORIGIN` (mitigates clickjacking)
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - Strict `Content-Security-Policy` protecting against third-party script injection.

2. **In-Memory Rate Limiting**:
   - Protects confidential client intake endpoints (`POST /api/inquiries`) and authentication (`POST /api/auth/login`) against DDoS, brute-force, and automated form abuse.

3. **Cryptographic Token Authorization**:
   - Admin authentication issues random hex bearer tokens.
   - Restricts blog creation (`POST /api/blogs`), editing (`PUT /api/blogs/:id`), deletion (`DELETE /api/blogs/:id`), and viewing private intake inquiries (`GET /api/inquiries`).

4. **Input Sanitization**:
   - Strips malicious script payloads from headlines, summaries, and comments.

5. **Persistent Storage (`data/db.json`)**:
   - All newly written blogs, comments, appreciations, and client consultation requests persist directly to the server filesystem without requiring external database provisioning.

---

## 🌐 Deploy to Cloud Providers

### Dockerfile (Optional)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Render / Railway / Heroku
- Set **Build Command**: `npm install`
- Set **Start Command**: `node server.js`
- Set Environment Variable: `ADMIN_PASSWORD=your_secure_password`

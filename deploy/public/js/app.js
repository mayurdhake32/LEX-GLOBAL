/**
 * Lex Global Advocacy — Dynamic Frontend Controller
 * Connects to the secure Express REST API (/api/*) with local storage fallback
 */

const API = {
  getBlogs: async () => {
    try {
      const res = await fetch('/api/blogs');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getBlogs fallback to local data', e);
    }
    return loadStorage('lga_posts', DEFAULT_POSTS);
  },
  getBlogBySlug: async (slug) => {
    try {
      const res = await fetch(`/api/blogs/${encodeURIComponent(slug)}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getBlogBySlug fallback', e);
    }
    const posts = loadStorage('lga_posts', DEFAULT_POSTS);
    return posts.find((p) => p.slug === slug);
  },
  createBlog: async (data, token) => {
    const res = await fetch('/api/blogs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create blog');
    }
    return await res.json();
  },
  updateBlog: async (id, data, token) => {
    const res = await fetch(`/api/blogs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update blog');
    }
    return await res.json();
  },
  deleteBlog: async (id, token) => {
    const res = await fetch(`/api/blogs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete blog');
    }
    return await res.json();
  },
  likeBlog: async (id) => {
    const res = await fetch(`/api/blogs/${encodeURIComponent(id)}/like`, { method: 'POST' });
    return res.ok ? await res.json() : { likes: 0 };
  },
  addComment: async (id, commentData) => {
    const res = await fetch(`/api/blogs/${encodeURIComponent(id)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    });
    if (!res.ok) throw new Error('Failed to post comment');
    return await res.json();
  },
  getCourses: async () => {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getCourses fallback', e);
    }
    return loadStorage('lga_courses', DEFAULT_COURSES);
  },
  submitInquiry: async (inquiryData) => {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Submission failed');
    }
    return await res.json();
  },
  loginAdmin: async (password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return await res.json();
  }
};

// Fallback Seeds (used if backend is unavailable)
const DEFAULT_POSTS = [
  {
    id: 'p1',
    slug: 'new-york-convention-primer',
    title: 'The 1958 New York Convention: A Strategic Guide to Global Award Enforcement',
    subtitle: 'Why the New York Convention remains the undisputed bedrock of cross-border dispute resolution — and how sophisticated counsel pre-empt Article V challenges.',
    category: 'Arbitration',
    author: 'Dr. Amara Okonkwo',
    date: '2026-10-18',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=80',
    featured: true,
    published: true,
    likes: 184,
    content: `<p class="lead">An arbitral award is only as valuable as the assets it can successfully attach. International arbitration that ignores post-award execution is an academic exercise.</p><h2>The Enduring Genius of the 1958 Architecture</h2><p>Over 170 contracting states adhere to the Convention on the Recognition and Enforcement of Foreign Arbitral Awards (the New York Convention). Its foundational premise is deceptively simple: foreign arbitral awards must be recognized as binding and enforced generally in accordance with the rules of procedure of the territory where the award is relied upon, without re-litigating the underlying merits of the dispute.</p><h2>The Exhaustive Grounds of Article V</h2><p>Article V represents an exhaustive list of defenses. A national enforcing court cannot craft novel common-law grounds to deny enforcement; it is strictly constrained to the defenses established under Article V(1) (raised by the resisting party) and Article V(2) (invoked ex officio by the court).</p><h3>1. Incapacity and Agreement Invalidity (Article V(1)(a))</h3><p>Resisting parties often claim that the signatory lacked requisite corporate authority or that the underlying arbitration clause violates the law of the seat. Proactive transactional counsel eliminate this vulnerability by obtaining formal board resolutions and specifying a clear governing law for the arbitration agreement itself.</p><blockquote>The public policy exception under Article V(2)(b) is construed with extreme narrowness across major pro-enforcement seats.</blockquote><h2>Practical Checklist for Counsel</h2><ul><li>Verify contracting status of all potential asset jurisdictions.</li><li>Preserve original certified apostilled copies of agreements and awards.</li><li>Deploy simultaneous asset tracing and interim freezing orders early.</li></ul>`
  },
  {
    id: 'p2',
    slug: 'gdpr-cross-border-transfers',
    title: 'Cross-Border Data Transfers Under GDPR: The Compliance Blueprint',
    subtitle: 'Navigating Standard Contractual Clauses, Transfer Impact Assessments (TIAs), and supplementary encryption protocols in high-risk foreign jurisdictions.',
    category: 'Data & Privacy',
    author: 'Dr. Sofia Lindqvist',
    date: '2026-10-14',
    readTime: '9 min read',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
    featured: false,
    published: true,
    likes: 142,
    content: `<h2>The Global Reach of Chapter V GDPR</h2><p>Under Chapter V of the General Data Protection Regulation (Regulation (EU) 2016/679), personal data cannot leave the European Economic Area unless the importing country guarantees an essentially equivalent level of protection, or the data exporter implements appropriate safeguards.</p><h2>The Modern Transfer Impact Assessment (TIA)</h2><p>Merely signing Standard Contractual Clauses (SCCs) is no longer a safe harbor. Exporters must carry out a documented Transfer Impact Assessment evaluating destination laws concerning government surveillance and national security intercept powers.</p><blockquote>If foreign statutory laws mandate unencrypted backdoors without independent judicial oversight, SCCs alone cannot legitimize the transfer.</blockquote>`
  },
  {
    id: 'p3',
    slug: 'drafting-bulletproof-indemnities',
    title: 'Drafting Bulletproof Indemnities in Cross-Border Commercial Agreements',
    subtitle: 'Bridging the common law and civil law divide on consequential damages, gross negligence carve-outs, and liability caps.',
    category: 'Cross-Border Contracts',
    author: 'Adv. Priya Menon',
    date: '2026-10-06',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80',
    featured: false,
    published: true,
    likes: 98,
    content: `<h2>Why Indemnities Generate Intense Cross-Border Friction</h2><p>In common-law drafting traditions (England, US, Singapore, India), an indemnity creates an independent, debt-based primary obligation to hold another harmless. In civil-law jurisdictions, an indemnity is frequently assimilated into the statutory framework of breach of contractual duty and damages.</p><h2>Core Drafting Rules</h2><p>Specify whether causation and mitigation rules apply, avoid uncapped exposure for non-IP claims, and define who controls settlement negotiations when a third party sues.</p>`
  }
];

const DEFAULT_COURSES = [
  {
    id: 'c1',
    slug: 'international-commercial-arbitration',
    title: 'International Commercial Arbitration: Strategy & Practice',
    category: 'Arbitration',
    level: 'Advanced',
    duration: '8 weeks · 24 lessons',
    price: 4999,
    instructor: 'Dr. Amara Okonkwo',
    instructorTitle: 'Arbitrator on LCIA, SIAC & ICC Panels',
    rating: 4.9,
    students: 1420,
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=80',
    description: 'A practitioner-led masterclass on drafting arbitration agreements, seat selection, emergency arbitral measures, evidence, and cross-border enforcement under the New York Convention.',
    curriculum: [
      {
        title: 'Module 1: The Arbitration Agreement',
        lessons: [
          { id: 'l1', title: 'The New York Convention 1958 in Modern Practice', duration: '28 min', type: 'video', preview: true },
          { id: 'l2', title: 'Drafting Dispute Clauses: Pathology & Perfection', duration: '32 min', type: 'video', preview: true },
          { id: 'l3', title: 'Selecting Seat vs Venue: Practical Consequences', duration: '24 min', type: 'text', preview: false }
        ]
      },
      {
        title: 'Module 2: Evidence & Enforcement',
        lessons: [
          { id: 'l4', title: 'Emergency Arbitrators & Interim Measures', duration: '25 min', type: 'video', preview: false },
          { id: 'l5', title: 'Redfern Schedules and IBA Evidence Rules', duration: '30 min', type: 'video', preview: false },
          { id: 'l6', title: 'Cross-Border Enforcement & Asset Attachment', duration: '35 min', type: 'video', preview: false }
        ]
      }
    ],
    quiz: {
      question: 'Under Article V(1)(c) of the 1958 New York Convention, what is a recognised ground for refusing recognition and enforcement?',
      options: [
        'The award dealt with a dispute not contemplated by or beyond the scope of the submission to arbitration',
        'The prevailing party was represented by counsel from a non-member state',
        'The hearing was conducted in a language other than Latin',
        'The respondent was dissatisfied with the damages calculation'
      ],
      answer: 0,
      explanation: 'Article V(1)(c) allows refusal when the award contains decisions beyond the scope of the agreement.'
    },
    published: true
  },
  {
    id: 'c2',
    slug: 'cross-border-contract-drafting',
    title: 'Cross-Border Contract Drafting & Negotiation',
    category: 'Cross-Border Contracts',
    level: 'Intermediate',
    duration: '6 weeks · 18 lessons',
    price: 3499,
    instructor: 'Adv. Priya Menon',
    instructorTitle: 'International Commercial Counsel',
    rating: 4.8,
    students: 1180,
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80',
    description: 'Master commercial agreements bridging common law and civil law, allocate foreign exchange risks, and structure enforceable indemnities.',
    curriculum: [
      {
        title: 'Module 1: Architecture of the International Agreement',
        lessons: [
          { id: 'l1', title: 'Governing Law vs Forum Clauses', duration: '22 min', type: 'video', preview: true },
          { id: 'l2', title: 'Representations & Indemnities Divergence', duration: '28 min', type: 'video', preview: true }
        ]
      }
    ],
    quiz: {
      question: 'What is the primary role of a governing law clause in an international contract?',
      options: [
        'It determines exclusive court jurisdiction automatically',
        'It selects the substantive legal system used to interpret the rights and obligations of the parties',
        'It renders the contract exempt from international sanctions',
        'It mandates arbitration over litigation'
      ],
      answer: 1,
      explanation: 'Governing law determines substantive rules of interpretation.'
    },
    published: true
  },
  {
    id: 'c4',
    slug: 'consumer-protection-across-borders',
    title: 'Cross-Border Consumer Protection & Platform Law',
    category: 'Consumer Protection',
    level: 'Beginner',
    duration: '5 weeks · 15 lessons',
    price: 0,
    instructor: 'Adv. Rohan Desai',
    instructorTitle: 'Consumer Protection Advocate',
    rating: 4.8,
    students: 2340,
    image: 'https://images.unsplash.com/photo-1453945619913-79ec89a82c51?auto=format&fit=crop&w=1400&q=80',
    description: 'An open-access foundational course on consumer statutory rights, deceptive dark patterns, e-commerce disputes, and complaint advocacy.',
    curriculum: [
      {
        title: 'Module 1: Rights & Remedies',
        lessons: [
          { id: 'l1', title: 'Who is a Consumer? Definitions & Exclusions', duration: '18 min', type: 'video', preview: true },
          { id: 'l2', title: 'Unfair Trade Practices & False Claims', duration: '22 min', type: 'video', preview: true }
        ]
      }
    ],
    quiz: {
      question: 'What is the primary definition of an Unfair Contract Term in consumer law?',
      options: [
        'A term in font smaller than 14pt',
        'A term causing significant imbalance in rights to the detriment of the consumer contrary to good faith',
        'Any term requiring digital currency payment',
        'A clause requiring electronic signatures'
      ],
      answer: 1,
      explanation: 'Unfair terms cause significant imbalance in rights to the detriment of the consumer contrary to good faith.'
    },
    published: true
  }
];

const TEAM = [
  {
    id: 't1',
    name: 'Dr. Amara Okonkwo',
    role: 'Managing Partner',
    specialty: 'International Commercial & Treaty Arbitration',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    bio: 'Dr. Okonkwo founded Lex Global Advocacy after eighteen years in international dispute resolution across Europe, Africa, and Southeast Asia. She has sat as arbitrator and counsel in over 45 proceedings under ICC, LCIA, SIAC, and ICSID rules.',
    admissions: ['Nigeria', 'England & Wales', 'Singapore'],
    experience: '18 years'
  },
  {
    id: 't2',
    name: 'Adv. Priya Menon',
    role: 'Partner',
    specialty: 'Cross-Border Contracts & Technology Transactions',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    bio: 'Priya advises funds, cross-border fintech platforms, and enterprise software providers on cross-jurisdictional M&A, licensing, and governing-law structures.',
    admissions: ['India', 'New York'],
    experience: '14 years'
  },
  {
    id: 't3',
    name: 'Dr. Sofia Lindqvist',
    role: 'Head of Data & Privacy',
    specialty: 'Data Protection & Cyber Governance',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
    bio: 'Dr. Lindqvist counsels on European GDPR, UK GDPR, and APAC frameworks. Former advisor to the EDPB working group on Standard Contractual Clauses.',
    admissions: ['Sweden', 'United Kingdom'],
    experience: '12 years'
  },
  {
    id: 't4',
    name: 'Adv. Rohan Desai',
    role: 'Consumer Lead',
    specialty: 'E-Commerce Liability & Consumer Redress',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    bio: 'Rohan has represented consumer collectives and digital platform operators before appellate commissions, focusing on deceptive patterns and payment disputes.',
    admissions: ['Supreme Court of India'],
    experience: '10 years'
  }
];

// Helpers
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s = '') => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const money = (n) => (n === 0 ? 'Free Open Access' : '₹' + Number(n).toLocaleString('en-IN'));

function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function saveStorage(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

const getEnrollments = () => loadStorage('lga_enrollments', { c4: { completed: ['l1'], quizPassed: false } });
const setEnrollments = (v) => saveStorage('lga_enrollments', v);
const getBookmarks = () => loadStorage('lga_bookmarks', ['p1']);
const setBookmarks = (v) => saveStorage('lga_bookmarks', v);
const getAdminToken = () => sessionStorage.getItem('lga_admin_token') || '';
const setAdminToken = (t) => (t ? sessionStorage.setItem('lga_admin_token', t) : sessionStorage.removeItem('lga_admin_token'));

// Toast System
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// Modal Utilities
function openModal(html) {
  const overlay = $('#modalOverlay');
  const content = $('#modalContent');
  if (!overlay || !content) return;
  content.innerHTML = html;
  overlay.classList.add('open');
  document.body.classList.add('modal-open');
  $$('#modalContent [data-close]').forEach((b) => b.addEventListener('click', closeModal));
}
function closeModal() {
  const overlay = $('#modalOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.classList.remove('modal-open');
}

// ==================== VIEWS CONTROLLER ====================
const app = $('#app');

// 1. Home View
async function renderHome() {
  const posts = await API.getBlogs();
  const courses = await API.getCourses();
  const featuredPost = posts.find((p) => p.featured) || posts[0];
  const latestPosts = posts.slice(0, 3);
  const featuredCourses = courses.slice(0, 3);
  const totalStudents = courses.reduce((acc, c) => acc + (c.students || 0), 0);

  app.innerHTML = `
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">International Legal Excellence</span>
          <h1>Counsel without <em>borders.</em><br>Knowledge without compromise.</h1>
          <p class="lead">Premium legal education and clear, responsible knowledge for practitioners, founders, and global citizens — built on precision, ethics, and practical insight.</p>
          <div class="hero-actions">
            <a href="#/courses" class="btn btn-primary btn-lg">Explore Courses <span class="arrow">→</span></a>
            <a href="#/blogs" class="btn btn-outline btn-lg">Visit Legal Hub</a>
            <button class="btn btn-gold btn-sm" id="homeWriteBtn">+ Write Article</button>
          </div>
          <div class="hero-stats">
            <div class="stat"><strong>${courses.length}</strong><span>Master Programmes</span></div>
            <div class="stat"><strong>${totalStudents.toLocaleString()}+</strong><span>Global Learners</span></div>
            <div class="stat"><strong>${posts.length}</strong><span>Published Guides</span></div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-image">
            <img src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=85" alt="Law Library">
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Blog Spotlight -->
    <section class="bg-ivory-2">
      <div class="wrap">
        <div class="section-head">
          <div>
            <span class="eyebrow">The Legal Hub</span>
            <h2>Clear thinking on complex questions.</h2>
            <p>Analytical commentaries and statutory checklists authored by practicing international counsel.</p>
          </div>
          <a href="#/blogs" class="btn btn-outline">Browse All Articles →</a>
        </div>

        ${featuredPost ? `
          <article class="featured-post">
            <a class="media" href="#/blog/${esc(featuredPost.slug)}">
              <img src="${esc(featuredPost.image)}" alt="${esc(featuredPost.title)}">
            </a>
            <div class="body">
              <span class="eyebrow">${esc(featuredPost.category)}</span>
              <h2><a href="#/blog/${esc(featuredPost.slug)}">${esc(featuredPost.title)}</a></h2>
              <p>${esc(featuredPost.subtitle || '')}</p>
              <div class="card-meta" style="margin-top:1.2rem;">
                <span>By ${esc(featuredPost.author)}</span>•<span>${featuredPost.date}</span>•<span>${esc(featuredPost.readTime || '6 min read')}</span>
              </div>
              <div style="margin-top:1.5rem;">
                <a href="#/blog/${esc(featuredPost.slug)}" class="btn btn-primary">Read Complete Guide <span class="arrow">→</span></a>
              </div>
            </div>
          </article>
        ` : ''}

        <div class="grid-3">
          ${latestPosts.map(postCardHtml).join('')}
        </div>
      </div>
    </section>

    <!-- Featured Courses -->
    <section>
      <div class="wrap">
        <div class="section-head">
          <div>
            <span class="eyebrow">Executive Academy</span>
            <h2>Study with practicing authorities.</h2>
            <p>Master programmes with lessons, resources, and accredited certifications.</p>
          </div>
          <a href="#/courses" class="btn btn-outline">View All Courses →</a>
        </div>
        <div class="grid-3">
          ${featuredCourses.map(courseCardHtml).join('')}
        </div>
      </div>
    </section>
  `;

  $('#homeWriteBtn').onclick = () => openBlogEditorModal();
  bindCardButtons();
}

function postCardHtml(p) {
  const isSaved = getBookmarks().includes(p.id);
  return `
    <article class="card">
      <a href="#/blog/${esc(p.slug)}" class="card-media">
        <img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">
        <span class="badge">${esc(p.category)}</span>
      </a>
      <div class="card-body">
        <div class="card-meta">
          <span>${esc(p.author)}</span>•<span>${p.date}</span>•<span>${esc(p.readTime || '6 min read')}</span>
        </div>
        <h3 class="card-title"><a href="#/blog/${esc(p.slug)}">${esc(p.title)}</a></h3>
        <p class="card-desc">${esc(p.subtitle || '')}</p>
        <div class="card-foot">
          <button class="btn btn-ghost btn-sm" data-bookmark="${esc(p.id)}">
            ${isSaved ? '♥ Saved' : '♡ Save'}
          </button>
          <a href="#/blog/${esc(p.slug)}" class="btn btn-outline btn-sm">Read <span class="arrow">→</span></a>
        </div>
      </div>
    </article>
  `;
}

function courseCardHtml(c) {
  return `
    <article class="card">
      <a href="#/course/${esc(c.slug)}" class="card-media">
        <img src="${esc(c.image)}" alt="${esc(c.title)}" loading="lazy">
        <span class="badge">${esc(c.level)}</span>
      </a>
      <div class="card-body">
        <div class="card-meta"><span>${esc(c.category)}</span>•<span>${esc(c.duration)}</span></div>
        <h3 class="card-title"><a href="#/course/${esc(c.slug)}">${esc(c.title)}</a></h3>
        <p class="card-desc">${esc(c.description)}</p>
        <div class="card-foot">
          <strong style="color:var(--navy); font-size:1.1rem;">${money(c.price)}</strong>
          <a href="#/course/${esc(c.slug)}" class="btn btn-primary btn-sm">View Syllabus</a>
        </div>
      </div>
    </article>
  `;
}

// 2. Blogs List View
async function renderBlogs() {
  const posts = await API.getBlogs();
  const categories = Array.from(new Set(posts.map((p) => p.category)));

  app.innerHTML = `
    <section>
      <div class="wrap">
        <div class="section-head">
          <div>
            <span class="eyebrow">The Legal Hub</span>
            <h1>International Jurisprudence & Legal Guides</h1>
            <p>Explore authoritative legal commentaries, statutory analysis, and cross-border practice notes.</p>
          </div>
          <button class="btn btn-primary" id="writeArticleBtn">+ Write New Article</button>
        </div>

        <div class="filter-bar">
          <div class="field">
            <label for="bSearch">Search</label>
            <input id="bSearch" type="search" placeholder="Search by statute, issue, author...">
          </div>
          <div class="field">
            <label for="bCategory">Category</label>
            <select id="bCategory">
              <option value="">All Categories</option>
              ${categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="bSort">Sort</label>
            <select id="bSort">
              <option value="newest">Newest First</option>
              <option value="likes">Most Appreciated</option>
            </select>
          </div>
          <div class="field">
            <label>&nbsp;</label>
            <button class="btn btn-outline" id="bReset" style="width:100%;">Reset</button>
          </div>
        </div>

        <div id="blogGrid" class="grid-3">
          ${posts.map(postCardHtml).join('')}
        </div>
      </div>
    </section>
  `;

  $('#writeArticleBtn').onclick = () => openBlogEditorModal();
  $('#bReset').onclick = () => renderBlogs();

  const filterAction = () => {
    const q = ($('#bSearch').value || '').toLowerCase().trim();
    const cat = $('#bCategory').value;
    const sort = $('#bSort').value;

    let list = posts.filter((p) => {
      const matchQ = !q || p.title.toLowerCase().includes(q) || (p.subtitle || '').toLowerCase().includes(q) || p.author.toLowerCase().includes(q);
      const matchCat = !cat || p.category === cat;
      return matchQ && matchCat;
    });

    if (sort === 'likes') list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    else list.sort((a, b) => new Date(b.date) - new Date(a.date));

    $('#blogGrid').innerHTML = list.length
      ? list.map(postCardHtml).join('')
      : `<div style="grid-column:1/-1; padding:3rem; text-align:center; background:#fff; border-radius:12px;"><h3>No matching articles found.</h3></div>`;
    bindCardButtons();
  };

  $('#bSearch').oninput = filterAction;
  $('#bCategory').onchange = filterAction;
  $('#bSort').onchange = filterAction;
  bindCardButtons();
}

// 3. Blog Detail View
async function renderBlogDetail(slug) {
  const post = await API.getBlogBySlug(slug);
  if (!post) {
    app.innerHTML = `<div class="wrap" style="padding:4rem 0; text-align:center;"><h2>Article not found</h2><a href="#/blogs" class="btn btn-primary" style="margin-top:1rem;">Back to Legal Hub</a></div>`;
    return;
  }

  // Parse headings for Table of Contents
  const temp = document.createElement('div');
  temp.innerHTML = post.content || '';
  const headings = [...temp.querySelectorAll('h2, h3')];
  headings.forEach((h, i) => { h.id = 'sec-' + i; });
  const contentWithIds = temp.innerHTML;

  app.innerHTML = `
    <div class="reading-progress" id="rProgress"></div>
    <section>
      <div class="wrap" style="max-width:980px;">
        <div style="font-size:0.75rem; color:var(--muted); margin-bottom:1rem;">
          <a href="#/">Home</a> / <a href="#/blogs">Legal Hub</a> / <strong style="color:var(--navy);">${esc(post.category)}</strong>
        </div>

        <span class="eyebrow">${esc(post.category)}</span>
        <h1 style="color:var(--navy); margin:0.8rem 0 1rem;">${esc(post.title)}</h1>
        <p class="lead">${esc(post.subtitle || '')}</p>

        <div class="card-meta" style="margin:1.4rem 0; padding-bottom:1.4rem; border-bottom:1px solid var(--line);">
          <span>By <strong>${esc(post.author)}</strong></span>•
          <span>Published ${post.date}</span>•
          <span>${esc(post.readTime || '6 min read')}</span>
        </div>

        <div style="border-radius:var(--radius); overflow:hidden; margin-bottom:2.5rem; max-height:460px;">
          <img src="${esc(post.image)}" alt="${esc(post.title)}" style="width:100%; height:100%; object-fit:cover;">
        </div>

        <div class="article-layout">
          <div>
            <div style="display:flex; gap:0.6rem; margin-bottom:1.5rem; flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm" id="artLikeBtn">♥ Appreciate (${post.likes || 0})</button>
              <button class="btn btn-outline btn-sm" id="artSaveBtn">Bookmark</button>
              <button class="btn btn-outline btn-sm" id="artShareBtn">Copy Link</button>
              <button class="btn btn-outline btn-sm" onclick="window.print()">Print</button>
            </div>

            <div class="article-body">
              ${contentWithIds}
            </div>

            <!-- Comments Section -->
            <div style="margin-top:3.5rem; padding-top:2rem; border-top:1px solid var(--line);">
              <h3 style="color:var(--navy); margin-bottom:1rem;">Practitioner Discussion (${post.comments ? post.comments.length : 0})</h3>
              <form id="commentForm" style="display:grid; gap:0.8rem; margin-bottom:2rem; background:#fff; padding:1.2rem; border-radius:12px; border:1px solid var(--line);">
                <input id="cAuthor" placeholder="Your name and title (e.g. Adv. John Doe)" required style="padding:0.6rem; border:1px solid var(--line); border-radius:8px;">
                <textarea id="cContent" rows="3" placeholder="Share your legal perspective or case observation..." required style="padding:0.6rem; border:1px solid var(--line); border-radius:8px;"></textarea>
                <button type="submit" class="btn btn-primary btn-sm" style="justify-self:start;">Post Comment</button>
              </form>

              <div id="commentsList" style="display:grid; gap:1rem;">
                ${(post.comments || []).map((c) => `
                  <div style="background:#fff; padding:1rem; border-radius:10px; border:1px solid var(--line);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
                      <strong style="color:var(--navy); font-size:0.85rem;">${esc(c.author)}</strong>
                      <span style="font-size:0.75rem; color:var(--muted);">${c.date}</span>
                    </div>
                    <p style="font-size:0.88rem; color:#39465A;">${esc(c.content)}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <aside>
            <div class="toc">
              <h4>On this Page</h4>
              ${headings.map((h, i) => `<a href="#sec-${i}">${esc(h.textContent)}</a>`).join('')}
            </div>
          </aside>
        </div>
      </div>
    </section>
  `;

  // Reading progress scroll listener
  const prog = $('#rProgress');
  window.onscroll = () => {
    const el = document.documentElement;
    const max = el.scrollHeight - el.clientHeight;
    prog.style.width = max > 0 ? (el.scrollTop / max) * 100 + '%' : '0%';
  };

  $('#artLikeBtn').onclick = async () => {
    const res = await API.likeBlog(post.id);
    $('#artLikeBtn').textContent = `♥ Appreciated (${res.likes})`;
    toast('Appreciation recorded.');
  };

  $('#artSaveBtn').onclick = () => {
    let bm = getBookmarks();
    if (bm.includes(post.id)) {
      bm = bm.filter((x) => x !== post.id);
      toast('Removed from saved list.');
    } else {
      bm.push(post.id);
      toast('Saved to your reading list.');
    }
    setBookmarks(bm);
  };

  $('#artShareBtn').onclick = () => {
    navigator.clipboard.writeText(window.location.href);
    toast('Article URL copied to clipboard.');
  };

  $('#commentForm').onsubmit = async (e) => {
    e.preventDefault();
    const author = $('#cAuthor').value;
    const content = $('#cContent').value;
    try {
      const comment = await API.addComment(post.id, { author, content });
      toast('Comment posted.');
      $('#commentForm').reset();
      const list = $('#commentsList');
      list.insertAdjacentHTML(
        'afterbegin',
        `<div style="background:#fff; padding:1rem; border-radius:10px; border:1px solid var(--line);"><div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;"><strong style="color:var(--navy); font-size:0.85rem;">${esc(comment.author)}</strong><span style="font-size:0.75rem; color:var(--muted);">${comment.date}</span></div><p style="font-size:0.88rem; color:#39465A;">${esc(comment.content)}</p></div>`
      );
    } catch (err) {
      toast('Could not post comment.');
    }
  };
}

// 4. Courses Catalog View
async function renderCourses() {
  const courses = await API.getCourses();
  app.innerHTML = `
    <section>
      <div class="wrap">
        <div class="section-head">
          <div>
            <span class="eyebrow">Executive Academy</span>
            <h1>Masterclasses & Executive Curricula</h1>
            <p>Study with verified practitioners. Complete modules and exams to earn accredited certificates.</p>
          </div>
        </div>
        <div class="grid-3">
          ${courses.map(courseCardHtml).join('')}
        </div>
      </div>
    </section>
  `;
}

// 5. Course Detail View
async function renderCourseDetail(slug) {
  const courses = await API.getCourses();
  const c = courses.find((x) => x.slug === slug);
  if (!c) {
    app.innerHTML = `<div class="wrap" style="padding:4rem 0;"><h2>Course not found</h2></div>`;
    return;
  }

  const enr = getEnrollments()[c.id];

  app.innerHTML = `
    <section>
      <div class="wrap">
        <span class="eyebrow">${esc(c.category)}</span>
        <h1 style="color:var(--navy); margin:0.8rem 0 1rem;">${esc(c.title)}</h1>
        <p class="lead">${esc(c.description)}</p>

        <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:3rem; margin-top:2.5rem; align-items:start;">
          <div>
            <h3 style="color:var(--navy); margin-bottom:1rem;">Curriculum Modules</h3>
            <div style="display:grid; gap:0.8rem;">
              ${(c.curriculum || []).map((m, mi) => `
                <div style="background:#fff; padding:1.2rem; border-radius:12px; border:1px solid var(--line);">
                  <strong style="color:var(--navy); font-size:1rem;">Module ${mi + 1}: ${esc(m.title)}</strong>
                  <div style="margin-top:0.8rem; display:grid; gap:0.5rem;">
                    ${m.lessons.map((l) => `
                      <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding:0.4rem 0; border-bottom:1px dashed var(--line);">
                        <span>${esc(l.title)}</span>
                        <span style="color:var(--muted);">${l.duration}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <aside class="side-card" style="position:sticky; top:110px;">
            <div style="font-family:var(--serif); font-size:2rem; color:var(--navy); font-weight:700;">
              ${money(c.price)}
            </div>
            <p style="font-size:0.8rem; margin:0.4rem 0 1.2rem;">Includes verifiable Certificate of Completion upon passing exam.</p>
            ${enr ? `
              <a href="#/learn" class="btn btn-primary" style="width:100%;">Continue Learning →</a>
            ` : `
              <button class="btn btn-primary" id="enrollBtn" style="width:100%;">Enroll in Programme</button>
            `}
          </aside>
        </div>
      </div>
    </section>
  `;

  const b = $('#enrollBtn');
  if (b) {
    b.onclick = () => {
      const en = getEnrollments();
      en[c.id] = { completed: [], quizPassed: false };
      setEnrollments(en);
      toast('Enrolled successfully.');
      location.hash = '#/learn';
    };
  }
}

// 6. My Learning LMS View
async function renderLearn() {
  const courses = await API.getCourses();
  const enr = getEnrollments();
  const enrolledCourses = courses.filter((c) => enr[c.id]);

  if (!enrolledCourses.length) {
    app.innerHTML = `
      <section><div class="wrap" style="text-align:center; padding:5rem 0;">
        <h2>You are not enrolled in any course yet.</h2>
        <p style="margin:1rem 0;">Browse our catalogue to enroll in a free or master programme.</p>
        <a href="#/courses" class="btn btn-primary">Browse Courses →</a>
      </div></section>
    `;
    return;
  }

  const active = enrolledCourses[0];
  const e = enr[active.id];
  const total = active.curriculum.reduce((n, m) => n + m.lessons.length, 0);
  const done = e.completed ? e.completed.length : 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  app.innerHTML = `
    <section>
      <div class="wrap">
        <span class="eyebrow">Learning Management Workspace</span>
        <h1 style="color:var(--navy); margin:0.8rem 0 1rem;">${esc(active.title)}</h1>
        <div class="dash-grid" style="margin-top:2rem;">
          <aside class="side-card">
            <h4>Progress: ${pct}%</h4>
            <div class="progress-track" style="margin:0.8rem 0;"><div class="progress-fill" style="width:${pct}%;"></div></div>
            <p style="font-size:0.78rem;">${done} of ${total} lessons checked</p>
          </aside>

          <div class="side-card">
            <h3>Syllabus Checklist</h3>
            <div style="margin-top:1.2rem; display:grid; gap:0.6rem;">
              ${active.curriculum.flatMap((m) => m.lessons).map((l) => {
                const isDone = (e.completed || []).includes(l.id);
                return `
                  <div class="lesson-row">
                    <button class="lesson-check ${isDone ? 'done' : ''}" data-lesson="${l.id}">✓</button>
                    <div style="flex:1;">
                      <div style="font-weight:600; font-size:0.88rem;">${esc(l.title)}</div>
                      <span style="font-size:0.75rem; color:var(--muted);">${l.duration}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Quiz Card -->
            <div style="margin-top:2rem; padding:1.5rem; background:var(--ivory-2); border-radius:12px; border:1px solid var(--line);">
              <span class="eyebrow">Knowledge Check</span>
              <h4 style="margin:0.5rem 0; color:var(--navy);">${esc(active.quiz.question)}</h4>
              <form id="quizForm" style="display:grid; gap:0.5rem; margin-top:0.8rem;">
                ${active.quiz.options.map((opt, i) => `
                  <label style="display:flex; gap:0.6rem; font-size:0.85rem; cursor:pointer;">
                    <input type="radio" name="quiz" value="${i}" required>
                    <span>${esc(opt)}</span>
                  </label>
                `).join('')}
                <button type="submit" class="btn btn-primary btn-sm" style="justify-self:start; margin-top:0.6rem;">Submit Answer</button>
              </form>
            </div>

            ${done >= total && e.quizPassed ? `
              <div class="certificate">
                <span class="eyebrow center">Verified Credential</span>
                <h2 style="color:var(--navy); margin:0.8rem 0;">Certificate of Completion</h2>
                <p>Awarded to Enrolled Legal Practitioner for completing ${esc(active.title)}.</p>
                <button class="btn btn-gold btn-sm" onclick="window.print()" style="margin-top:1.2rem;">Print / Save Certificate</button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </section>
  `;

  $$('[data-lesson]').forEach((btn) => {
    btn.onclick = () => {
      const en = getEnrollments();
      const curr = en[active.id];
      if (curr.completed.includes(btn.dataset.lesson)) {
        curr.completed = curr.completed.filter((x) => x !== btn.dataset.lesson);
      } else {
        curr.completed.push(btn.dataset.lesson);
      }
      setEnrollments(en);
      renderLearn();
    };
  });

  $('#quizForm').onsubmit = (ev) => {
    ev.preventDefault();
    const val = Number(new FormData(ev.target).get('quiz'));
    const isCorrect = val === active.quiz.answer;
    const en = getEnrollments();
    en[active.id].quizPassed = isCorrect;
    setEnrollments(en);
    if (isCorrect) {
      toast('Correct! Quiz passed.');
      renderLearn();
    } else {
      toast('Incorrect answer. Please review the material and try again.');
    }
  };
}

// 7. Blog Editor Modal
function openBlogEditorModal(existingPost = null) {
  const isEdit = Boolean(existingPost);
  const p = existingPost || {
    title: '',
    slug: '',
    subtitle: '',
    category: 'Arbitration',
    author: 'Dr. Amara Okonkwo',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=80',
    content: '<p class="lead">Write your analysis introduction...</p><h2>First Legal Section</h2><p>Provide statutory explanation...</p>'
  };

  openModal(`
    <div class="modal-head">
      <h3 style="color:var(--navy);">${isEdit ? 'Edit Legal Analysis' : 'Write & Publish Article'}</h3>
      <button class="btn btn-outline btn-sm" data-close>✕</button>
    </div>
    <div class="modal-body">
      <form id="editorForm" style="display:grid; gap:0.9rem;">
        <div class="field">
          <label>Headline *</label>
          <input id="edTitle" value="${esc(p.title)}" required placeholder="e.g. Sovereign Immunity in Treaty Arbitration">
        </div>
        <div class="field">
          <label>URL Slug</label>
          <input id="edSlug" value="${esc(p.slug)}" placeholder="sovereign-immunity-treaty-arbitration">
        </div>
        <div class="field">
          <label>Subtitle / Excerpt</label>
          <input id="edSub" value="${esc(p.subtitle)}" placeholder="Summary of procedural principles...">
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.8rem;">
          <div class="field">
            <label>Category</label>
            <select id="edCat">
              <option ${p.category === 'Arbitration' ? 'selected' : ''}>Arbitration</option>
              <option ${p.category === 'Cross-Border Contracts' ? 'selected' : ''}>Cross-Border Contracts</option>
              <option ${p.category === 'Data & Privacy' ? 'selected' : ''}>Data & Privacy</option>
              <option ${p.category === 'Consumer Protection' ? 'selected' : ''}>Consumer Protection</option>
              <option ${p.category === 'Legal Writing' ? 'selected' : ''}>Legal Writing</option>
            </select>
          </div>
          <div class="field">
            <label>Author</label>
            <input id="edAuthor" value="${esc(p.author)}" required>
          </div>
        </div>
        <div class="field">
          <label>Cover Image URL</label>
          <input id="edImage" value="${esc(p.image)}" required>
        </div>
        <div class="field">
          <label>Article Content (HTML)</label>
          <textarea id="edContent" rows="8" required style="font-family:monospace; font-size:0.82rem;">${esc(p.content)}</textarea>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.6rem; margin-top:0.6rem;">
          <button type="button" class="btn btn-outline" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Publish Article'}</button>
        </div>
      </form>
    </div>
  `);

  $('#editorForm').onsubmit = async (e) => {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) {
      toast('Admin authentication token required. Enter password in Admin CMS.');
      closeModal();
      location.hash = '#/admin';
      return;
    }

    const title = $('#edTitle').value.trim();
    const slug = ($('#edSlug').value || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const data = {
      title,
      slug,
      subtitle: $('#edSub').value.trim(),
      category: $('#edCat').value,
      author: $('#edAuthor').value.trim(),
      image: $('#edImage').value.trim(),
      content: $('#edContent').value,
      published: true
    };

    try {
      if (isEdit) {
        await API.updateBlog(existingPost.id, data, token);
        toast('Article updated.');
      } else {
        await API.createBlog(data, token);
        toast('Article published to Legal Hub.');
      }
      closeModal();
      location.hash = `#/blog/${slug}`;
    } catch (err) {
      toast('Operation failed: ' + err.message);
    }
  };
}

// 8. Admin CMS View
function renderAdmin() {
  const token = getAdminToken();

  app.innerHTML = `
    <section>
      <div class="wrap" style="max-width:700px;">
        <span class="eyebrow">Institutional Registrar</span>
        <h1 style="color:var(--navy); margin:0.8rem 0 1rem;">Admin & CMS Portal</h1>
        ${!token ? `
          <div class="side-card" style="margin-top:1.5rem;">
            <h3>Admin Password Required</h3>
            <p style="font-size:0.85rem; margin:0.6rem 0 1.2rem;">Enter the administrative key to create, edit, or delete articles and manage client intake.</p>
            <form id="adminLoginForm" style="display:grid; gap:0.8rem;">
              <input type="password" id="adminPw" placeholder="Default: lexglobal2026" required style="padding:0.7rem; border:1px solid var(--line); border-radius:8px;">
              <button type="submit" class="btn btn-primary" style="justify-self:start;">Unlock Admin Access →</button>
            </form>
          </div>
        ` : `
          <div class="side-card" style="margin-top:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h3>Admin Session Active ✓</h3>
              <button class="btn btn-outline btn-sm" id="adminLogout">Lock Session</button>
            </div>
            <p style="margin:1rem 0; font-size:0.88rem;">You have administrative access to publish articles, modify courses, and view client intake inquiries.</p>
            <div style="display:flex; gap:0.8rem; flex-wrap:wrap;">
              <button class="btn btn-gold" id="adminNewArt">+ Create Article</button>
              <a href="#/blogs" class="btn btn-outline">Visit Legal Hub</a>
            </div>
          </div>
        `}
      </div>
    </section>
  `;

  if (!token) {
    $('#adminLoginForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        const res = await API.loginAdmin($('#adminPw').value);
        setAdminToken(res.token);
        toast('Admin access unlocked.');
        renderAdmin();
      } catch (err) {
        toast('Authentication failed.');
      }
    };
  } else {
    $('#adminLogout').onclick = () => {
      setAdminToken('');
      toast('Session closed.');
      renderAdmin();
    };
    $('#adminNewArt').onclick = () => openBlogEditorModal();
  }
}

// 9. Confidential Consultation Intake Modal
function openConsultationModal() {
  openModal(`
    <div class="modal-head">
      <h3 style="color:var(--navy);">Instruct Counsel / Intake Inquiry</h3>
      <button class="btn btn-outline btn-sm" data-close>✕</button>
    </div>
    <div class="modal-body">
      <form id="intakeForm" style="display:grid; gap:0.8rem;">
        <div class="field"><label>Your Full Name *</label><input id="inqName" required placeholder="Adv. Julian Sterling"></div>
        <div class="field"><label>Corporate / Legal Email *</label><input type="email" id="inqEmail" required placeholder="counsel@chambers.com"></div>
        <div class="field"><label>Organization</label><input id="inqOrg" placeholder="Enterprise / Sovereign Fund"></div>
        <div class="field"><label>Practice Area</label>
          <select id="inqArea">
            <option>International Arbitration</option>
            <option>Cross-Border Contracts</option>
            <option>Data & Privacy (GDPR)</option>
            <option>Consumer Protection</option>
          </select>
        </div>
        <div class="field"><label>Matter Synopsis *</label><textarea id="inqDesc" rows="3" required placeholder="Brief summary for conflicts check..."></textarea></div>
        <button type="submit" class="btn btn-primary" style="margin-top:0.4rem;">Submit Confidential Inquiry →</button>
      </form>
    </div>
  `);

  $('#intakeForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await API.submitInquiry({
        name: $('#inqName').value,
        email: $('#inqEmail').value,
        organization: $('#inqOrg').value,
        practiceArea: $('#inqArea').value,
        description: $('#inqDesc').value
      });
      closeModal();
      toast('Inquiry submitted. Counsel will reach out within 24 hours.');
    } catch (err) {
      toast('Submission error: ' + err.message);
    }
  };
}

// 10. Card Click Handlers
function bindCardButtons() {
  $$('[data-bookmark]').forEach((b) => {
    b.onclick = (e) => {
      e.preventDefault();
      let bm = getBookmarks();
      const id = b.dataset.bookmark;
      if (bm.includes(id)) {
        bm = bm.filter((x) => x !== id);
        b.textContent = '♡ Save';
        toast('Removed from saved list.');
      } else {
        bm.push(id);
        b.textContent = '♥ Saved';
        toast('Saved to reading list.');
      }
      setBookmarks(bm);
    };
  });
}

// ==================== ROUTER & INIT ====================
function router() {
  window.scrollTo({ top: 0, behavior: 'instant' });
  const hash = location.hash.replace(/^#/, '') || '/';
  const parts = hash.split('?')[0].split('/').filter(Boolean);

  if (parts.length === 0) { renderHome(); return; }
  if (parts[0] === 'blogs') { renderBlogs(); return; }
  if (parts[0] === 'blog' && parts[1]) { renderBlogDetail(parts[1]); return; }
  if (parts[0] === 'courses') { renderCourses(); return; }
  if (parts[0] === 'course' && parts[1]) { renderCourseDetail(parts[1]); return; }
  if (parts[0] === 'learn') { renderLearn(); return; }
  if (parts[0] === 'admin') { renderAdmin(); return; }
  renderHome();
}

window.addEventListener('hashchange', router);

document.addEventListener('DOMContentLoaded', () => {
  const consultBtn = $('#consultTrigger');
  if (consultBtn) consultBtn.onclick = openConsultationModal;
  const menuToggle = $('#menuToggle');
  if (menuToggle) menuToggle.onclick = () => $('#mobileNav').classList.toggle('open');
  router();
});

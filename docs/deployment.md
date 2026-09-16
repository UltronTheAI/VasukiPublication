# VasukiPublication — Production Deployment Guide (Vercel & MongoDB)

This guide provides end-to-end instructions for deploying **VasukiPublication** to Vercel with MongoDB Atlas connectivity.

---

## 1. Prerequisites

1. **Vercel Account**: An active account on [Vercel](https://vercel.com).
2. **MongoDB Atlas Cluster**: A running MongoDB cluster (M0 free tier or higher) containing the canonical database shared with VasukiSquare.
3. **Repository Access**: Access to the `UltronTheAI/VasukiPublication` GitHub repository.

---

## 2. Production Environment Variables

Configure the following environment variables in **Vercel Project Settings > Environment Variables**:

| Variable | Scope | Required | Description | Production Example |
| :--- | :--- | :--- | :--- | :--- |
| `MONGODB_URI` | Server (Production, Preview) | **Yes** | MongoDB connection string | `mongodb+srv://<username>:<password>@<cluster-address>/...` |
| `MONGODB_DATABASE` | Server (Production, Preview) | **Yes** | Shared database name | `vasukisquare` |
| `ADMIN_ACCESS_TOKEN` | Server (Production) | **Yes** | Secret access token for `/admin/login` | `<your_secure_admin_token>` |
| `ADMIN_SESSION_SECRET` | Server (Production) | **Yes** | 32+ char secret for signing HMAC-SHA256 session cookies | `<your_32_character_random_secret>` |
| `NEXT_PUBLIC_SITE_URL` | Client & Server | **Yes** | Canonical production domain without trailing slash | `https://vasukipublication.com` |
| `NEXT_PUBLIC_SITE_NAME` | Client & Server | **Yes** | Website branding display name | `Vasuki Publication` |
| `NODE_ENV` | System | **Yes** | Application environment | `production` |

> [!WARNING]
> Never prefix `ADMIN_ACCESS_TOKEN`, `ADMIN_SESSION_SECRET`, or `MONGODB_URI` with `NEXT_PUBLIC_`. Keep them strictly server-only.

---

## 3. MongoDB Atlas Configuration

### 3.1 Network Access (IP Whitelist)
- In MongoDB Atlas, navigate to **Security > Network Access**.
- Add IP Access List entry: `0.0.0.0/0` (Allow Access from Anywhere) to permit dynamic Vercel serverless function IPs to connect securely via TLS/SSL.

### 3.2 Database User Permissions
- Create a dedicated database user (e.g. `vasuki_publication_app`).
- Grant read/write access to the `vasukisquare` database (reads for public books/pages/covers/ads, writes for admin operations and ad impression/click logging).

### 3.3 Required Database Indexes
Execute the index script from `docs/mongodb.md` in MongoDB Compass or `mongosh`:

```javascript
// books collection
db.books.createIndex({ "slug": 1 }, { unique: true });
db.books.createIndex({ "publication.status": 1, "publication.visibility": 1, "updated_at": -1 });
db.books.createIndex({ "featured.pinned": 1, "featured.position": 1 });
db.books.createIndex({ "title": "text", "description": "text", "discovery.search_title": "text", "discovery.keywords": "text" });

// pages collection
db.pages.createIndex({ "book_id": 1, "page_number": 1 }, { unique: true });
db.pages.createIndex({ "book_id": 1 });

// covers collection
db.covers.createIndex({ "book_id": 1 }, { unique: true });

// ads collection
db.ads.createIndex({ "active": 1 });
db.ads.createIndex({ "priority": 1 });
db.ads.createIndex({ "placements": 1 });
```

---

## 4. Vercel Project Setup

1. **Import Repository**:
   - Go to Vercel Dashboard > **Add New... > Project**.
   - Select the `VasukiPublication` repository.
2. **Framework Preset**:
   - Framework: **Next.js**
   - Root Directory: `./`
   - Build Command: `next build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)
3. **Add Environment Variables**:
   - Input all variables from Section 2 above.
4. **Deploy**:
   - Click **Deploy** and wait for the production build to complete.

---

## 5. Post-Deployment Verification Checklist

Once deployed, verify the complete production flow:

- [ ] **Homepage & Discovery (`/`)**: Verify hero section, pinned books showcase, and public catalog render properly.
- [ ] **Search & Pagination**: Test `/?q=guide` and `/?page=2` to ensure URL state works cleanly.
- [ ] **Book Detail (`/book/[slug]`)**: Open a published book and verify metadata, chapter list, and dynamic cover preview.
- [ ] **Dynamic OpenGraph Image**: Check `/book/[slug]/opengraph-image` in a browser tab to verify 1200x630 social card rendering.
- [ ] **Interactive Reader (`/book/[slug]/read`)**: Verify A4 page layout, lazy page streaming, keyboard navigation (left/right arrows), and complete absence of advertisements.
- [ ] **Saved Books (`/saved`)**: Bookmark a book, navigate to `/saved`, and confirm browser-local persistence and retrieval via batch API.
- [ ] **Sitemap & Robots**:
  - Open `/sitemap.xml`: verify all public books, `/privacy`, and `/terms` are listed. Verify `/admin` and private books are excluded.
  - Open `/robots.txt`: verify `Disallow: /admin`, `Disallow: /api/*`, and sitemap link.
- [ ] **Admin Console (`/admin/login`)**:
  - Log in with `ADMIN_ACCESS_TOKEN`.
  - Check overview stats, publications table, cover live editor, and native ads manager.
  - Log out and verify session cookie is cleared.
- [ ] **Security Headers**: Inspect HTTP response headers using browser dev tools or `curl -I` to verify CSP, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security`.

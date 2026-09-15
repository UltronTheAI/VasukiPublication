# VasukiPublication — Administrative System Architecture

The VasukiPublication administrative portal is a private, single-operator management interface located beneath `/admin`. It allows real-time inspection, metadata editing, hero pinning, cover customisation, ad management, and safe cascade deletion of MongoDB publication data.

---

## 1. Authentication & Security Architecture

```
┌─────────────────┐       Token Entry        ┌─────────────────────────────┐
│  /admin/login   ├─────────────────────────►│  lib/security/admin-auth.ts │
│ (Operator Form) │                          │  crypto.timingSafeEqual     │
└─────────────────┘                          └──────────────┬──────────────┘
                                                            │ Signed Session
                                                            ▼
┌─────────────────┐     HttpOnly Cookie      ┌─────────────────────────────┐
│  /admin/*       │◄─────────────────────────┤ vasuki_admin_session        │
│ (Server Layout) │                          │ HMAC-SHA256 (8h validity)   │
└─────────────────┘                          └─────────────────────────────┘
```

### 1.1 Access Token Verification
- Single administrator access controlled by server-only environment variable `ADMIN_ACCESS_TOKEN`.
- Verified in constant time using `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
- Never exposed to browser JavaScript.

### 1.2 Stateless Signed Sessions
- Signed HMAC-SHA256 session token stored in `vasuki_admin_session` cookie.
- Flags: `HttpOnly`, `SameSite=Strict`, `Secure` in production, `Path=/`, `MaxAge=28800` (8 hours).
- Payload contains `authenticated: true`, timestamps, and random 16-byte nonce.

### 1.3 Brute-Force Rate Limiting
- In-memory rate limiting map tracking IP addresses.
- Locks out an IP address after 5 consecutive failed login attempts for 15 minutes.
- Resets on successful authentication.

### 1.4 CSRF & Origin Validation
- Server actions verify matching `Origin` and `Host` headers on mutating requests via `validateRequestOrigin()`.

---

## 2. Administrative Modules

### 2.1 Overview Dashboard (`/admin`)
- Metric cards: Total Publications, Published (Public), Drafts & Private, Hero Pinned count, Active Native Ads.
- Hero Pinned Ranking table (positions 1..5).
- Quick action navigation and recent publication stream.

### 2.2 Publications Directory (`/admin/books`)
- Search by title, slug, or keywords.
- Filters by Publication Status (`all`, `published`, `draft`, `unpublished`) and Visibility (`all`, `public`, `private`).
- Inline Hero Pin toggle and position assignment.
- Pagination controls.

### 2.3 Publication & Cover Editor (`/admin/books/[id]`)
- **Metadata Tab**: Title, slug, description, subtitle, author, chapter count, page count, reading time estimate.
- **Publication & SEO Tab**: Status, visibility, SEO title, SEO description, canonical slug.
- **Pinning Tab**: Hero showcase toggle and position ranking (1..5).
- **Pages Inspector**: Read-only overview of chapter pages, themes, layout models, word counts, and block summaries.
- **Cover Editor**: Real-time styling editor (title, subtitle, background theme palette, contrast mode, hero icon) with instant live preview powered by `CoverPreview`.
- **Danger Zone**: Safe destructive cascade deletion requiring exact publication title confirmation.

### 2.4 Advertisements Manager (`/admin/ads`)
- Campaign table displaying sponsor, headline, placements, priority weight, active status, impressions, clicks, and computed CTR.
- Modal editor for creating and updating native ads.
- Live native component preview (`NativeAdBanner` and `NativeAdSidebar`).

---

## 3. Safe Cascade Deletion Invariant

Deleting a publication from the admin console executes a safe cascade deletion:
1. Target `books` document matching `id` is deleted.
2. All linked `pages` matching `book_id === id` are deleted.
3. Linked `covers` matching `book_id === id` are deleted.
4. **Invariant**: `ads` documents are **never** touched by book deletion operations.


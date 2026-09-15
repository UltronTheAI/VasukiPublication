# VasukiPublication — Testing Strategy & Quality Assurance Plan

This document defines the comprehensive testing strategy, test suites, acceptance criteria, and quality gates for VasukiPublication.

---

## 1. Testing Pyramid & Categories

```
           / \
          /   \     E2E & Visual Regression (Playwright)
         /-----\
        /       \   Integration & Route Tests (Next.js API & Server Components)
       /---------\
      /           \ Component & Security Tests (React Testing Library & Sanitizers)
     /-------------\
    /               \ Unit & Repository Tests (Jest / Vitest & MongoDB In-Memory)
   -------------------
```

### 1.1 Unit Tests
- **Environment Validation**: `lib/env.ts` handles missing or invalid variables, distinguishing dev and production behaviors.
- **Security Helpers**:
  - `isSafeUrl()` permits `http://` and `https://`, rejecting `javascript:`, `data:`, and malformed URIs.
  - `getSafeHostname()` extracts root hostnames accurately.
  - `timingSafeCompare()` performs constant-time equality checks.
  - `sanitizeHtml()` strips `<script>`, `<iframe>`, `on*` event handlers, and malicious attributes.
- **Icon Resolution**: `resolveVasukiIconName()` maps legacy and variations (`check_circle`, `book-open`) to valid Lucide component names.
- **Priority Ad Selection**: `selectWeightedAd()` properly respects priority weights (10, 5, 2) and filters expired/inactive ads.

### 1.2 Repository & Data Access Tests
- **Public Query Isolation**: `getPublicBooks()` and `getPublicBookBySlug()` strictly exclude books where `publication.status !== "published"` or `publication.visibility !== "public"`.
- **Deterministic Pagination**:
  - Default limit is 20 items per page.
  - Maximum limit is capped at 50 items.
  - Out-of-bounds page requests return empty item lists with accurate total pages, without throwing unhandled exceptions.
- **Featured Book Constraint**: `getPinnedBooks()` returns at most 5 items sorted strictly by `featured.position` (1 to 5).
- **Search Robustness**: `searchBooks()` sanitizes regex special characters (e.g. `.*+?^${}()|[]\`) to avoid ReDoS or invalid regex syntax errors.
- **Linked-List Navigation**: `getLinkedPages()` correctly traverses `next_page_id` chains without circular infinite loops.

### 1.3 Book Rendering & Reader Isolation Tests
- **Visual Isolation**: Book pages do not inherit conflicting website layout styles.
- **Aspect Ratio Fidelity**: Page container maintains A4 aspect ratio (1:1.4142) across responsive resizes.
- **Theme Alternation**: Odd chapters render in light theme; even chapters render in dark theme (or respect explicit `Page.theme`).
- **No Ads in Reader**: Assert that reader viewports and page loops contain 0 advertisement nodes.
- **Lazy Page Loading**: Reader only requests necessary page chunks instead of loading an entire book's content upfront.

### 1.4 Native Ads & Monetization Tests
- **Eligibility Window**: Ads with `starts_at` in the future or `ends_at` in the past are excluded.
- **Placement Filtering**: `getActiveAds("home_banner")` returns only ads targeted to that placement.
- **XSS Immunity**: Ad headlines, descriptions, and sponsor fields containing `<script>` or HTML tags are stripped.
- **Outbound Link Security**: Rendered ad anchors always contain `target="_blank"` and `rel="noopener noreferrer nofollow"`.

### 1.5 Client State & Saved Books Tests
- **Persistence**: Saved books in local storage persist across page reloads and browser restarts.
- **Deduplication**: Adding an already saved book slug updates timestamps without duplicating entries.
- **Offline Resilience**: Saved books drawer displays cached local data if offline.

### 1.6 SEO & Sitemap Tests
- **Sitemap Completeness**: `getSitemapBooks()` generates entries exclusively for public published books.
- **Metadata Generation**: Dynamic OpenGraph tags, canonical URLs, and structured JSON-LD schemas generate valid metadata for all public book pages.
- **Draft Concealment**: Draft or private books return `robots: { index: false, follow: false }` and `404 Not Found` on public routes.

### 1.7 Admin Authentication & Management Tests
- **Timing-Safe Verification**: `timingSafeCompare()` performs constant-time equality check on admin access token.
- **Session Cryptography**: `signSessionPayload()` produces HMAC-SHA256 tokens; `verifySessionToken()` rejects altered payloads, forged signatures, and expired sessions.
- **Brute-Force Rate Limiting**: 5 consecutive failed login attempts locks out client IP for 15 minutes; successful login resets counters.
- **Cascade Deletion Invariant**: Deleting a book safely deletes the book document, all chapter pages, and cover artwork while strictly preserving unrelated ads.
- **Hero Pin Ranking Invariants**: Maximum 5 pinned publications enforced at the repository level; duplicate positions resolved automatically.
- **Origin / CSRF Verification**: Privileged write actions require valid Origin/Host header match.

### 1.8 Failure & Recovery Tests
- **MongoDB Disconnection**: If MongoDB is unreachable, repository calls reject with clean error payloads and render graceful error boundaries rather than hanging indefinitely.
- **Serverless Cold Start**: MongoDB connection caching survives warm serverless invocations.

---

## 2. Concrete Acceptance Criteria Matrix

| Test Scenario | Input / Action | Expected Result |
| :--- | :--- | :--- |
| **Draft Book Access** | `getPublicBookBySlug("internal-draft-book")` | Returns `null` |
| **Pagination Limit** | Request `/api/books?limit=500` | Capped at 50 results |
| **Featured Books** | Query `getPinnedBooks()` | Maximum 5 items returned, ordered by position 1..5 |
| **Negative Page Number** | `getPublicBooks(-1)` | Normalized to page 1 |
| **Malicious URL in Ad** | Ad URL `javascript:alert(1)` | `isSafeUrl()` returns `false`, link not rendered |
| **Injected HTML in Page** | Stored `<script>malicious()</script><p>Text</p>` | Sanitizer strips `<script>`, leaving `<p>Text</p>` |
| **Admin Secret Client Check** | Inspect production client JS bundles | `ADMIN_ACCESS_TOKEN` and `MONGODB_URI` are completely absent |
| **Reader Ad Check** | Inspect `/book/[slug]/read` DOM tree | Zero `.ad-banner` or ad placement nodes exist |
| **Sitemap Integrity** | Fetch `/sitemap.xml` | Excludes all unpublished or private books |
| **Connection Timeout** | Database offline / invalid URI | Returns user-friendly 503 / ErrorBoundary without process crash |

---

## 3. Continuous Integration & Quality Gates

1. **Static Analysis**:
   - `npm run lint` must pass with 0 warnings and 0 errors.
   - `tsc --noEmit` must pass with strict TypeScript checks.
2. **Production Build**:
   - `npm run build` must compile successfully with zero bundle leakages.
3. **Automated Test Suite**:
   - All unit and integration test assertions must pass.


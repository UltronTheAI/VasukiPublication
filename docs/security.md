# VasukiPublication — Security Architecture & Guidelines

VasukiPublication enforces defense-in-depth security across environment variables, database access, persisted content rendering, administrative access, and external links.

---

## 1. Secrets & Environment Isolation

- **Server-Only Separation**:
  - `MONGODB_URI`, `ADMIN_ACCESS_TOKEN`, and `ADMIN_SESSION_SECRET` are strictly server-only.
  - Runtime validation in `lib/env.ts` guarantees that secrets are never bundled into client-side code.
  - Only variables explicitly prefixed with `NEXT_PUBLIC_` are accessible on the client.
- **Timing-Safe Verification**:
  - All token comparisons (e.g. admin access tokens or authentication webhooks) strictly use `timingSafeCompare()` from `lib/security/crypto.ts` to prevent timing side-channel attacks.

---

## 2. Admin Authentication & Session Security

- **Single-Administrator Access**:
  - No public user registration, passwords, or MongoDB user collections.
  - Access is authenticated by verifying `ADMIN_ACCESS_TOKEN` via constant-time comparison.
- **Signed Session Token (HMAC-SHA256)**:
  - On successful authentication, an HMAC-SHA256 signed session token is created via `signSessionPayload()`.
  - Stored in an `HttpOnly`, `SameSite=Strict`, `Secure` (production) cookie named `vasuki_admin_session`.
  - Expired or tampered sessions are rejected server-side automatically.
  - Raw access tokens are never stored in browser memory, `localStorage`, or client-accessible cookies.
- **Brute-Force Rate Limiting**:
  - An in-memory rate limiter tracks failed login attempts by client IP (5 attempts per 15-minute window with a 15-minute lockout).
- **CSRF Defense & Origin Verification**:
  - Privileged write actions validate the `Origin` and `Host` request headers via `validateRequestOrigin()`.
- **Safe Audit Logging**:
  - Meaningful administrative operations (publishing, pinning, deletions, ad creation) are logged server-side without credentials or secrets.

---

## 3. Database Access Boundaries

- **Zero Client-Side Queries**:
  - React Client Components cannot import MongoDB drivers or execute database queries directly.
  - All database operations are channeled through the server-only repository layer (`lib/repositories/*`).
- **Input Sanitization & Projection**:
  - Public queries automatically inject `publication.status: "published"` and `publication.visibility: "public"`.
  - Search queries escape regex meta-characters to prevent Regular Expression Denial of Service (ReDoS).

---

## 4. HTML Sanitization & Stored XSS Defense

Because page and cover documents may contain pre-rendered markup strings, the application treats all persisted HTML with strict safety protocols:

- **Automated Stripping**:
  - `lib/security/html.ts` strips executable `<script>`, `<iframe>`, `<object>`, `<embed>`, and `<form>` elements.
  - All inline `on*` event handlers (e.g. `onclick`, `onload`, `onerror`) and `javascript:` URIs are purged.
- **Component-Level Safety**:
  - `dangerouslySetInnerHTML` is only used in conjunction with `sanitizePageHtml()` or `sanitizeCoverHtml()`.

---

## 5. Native Ads & External Links

- **URL Protocol Verification**:
  - `isSafeUrl()` / `isValidHttpUrl()` rejects any protocol other than `http:` or `https:`.
  - Malformed URLs, data URLs (`data:text/html,...`), and script protocols (`javascript:...`) are blocked at runtime.
- **Anchor Tag Hardening**:
  - All external hyperlinks and advertisement targets must include:
    ```html
    <a href="..." target="_blank" rel="noopener noreferrer nofollow">
    ```
  - This prevents `window.opener` hijacking and protects search reputation.

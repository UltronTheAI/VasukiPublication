# VasukiPublication — Security Architecture & Guidelines

VasukiPublication enforces defense-in-depth security across environment variables, database access, persisted content rendering, and external links.

---

## 1. Secrets & Environment Isolation

- **Server-Only Separation**:
  - `MONGODB_URI`, `ADMIN_ACCESS_TOKEN`, and `ADMIN_SESSION_SECRET` are strictly server-only.
  - Runtime validation in `lib/env.ts` guarantees that secrets are never bundled into client-side code.
  - Only variables explicitly prefixed with `NEXT_PUBLIC_` are accessible on the client.
- **Timing-Safe Verification**:
  - All token comparisons (e.g. future admin webhooks or authentication) must use `timingSafeCompare()` from `lib/security/crypto.ts` to prevent timing side-channel attacks.

---

## 2. Database Access Boundaries

- **Zero Client-Side Queries**:
  - React Client Components cannot import MongoDB drivers or execute database queries directly.
  - All database operations are channeled through the server-only repository layer (`lib/repositories/*`).
- **Input Sanitization & Projection**:
  - Public queries automatically inject `publication.status: "published"` and `publication.visibility: "public"`.
  - Search queries escape regex meta-characters to prevent Regular Expression Denial of Service (ReDoS).

---

## 3. HTML Sanitization & Stored XSS Defense

Because page and cover documents may contain pre-rendered markup strings, the application treats all persisted HTML with strict safety protocols:

- **Automated Stripping**:
  - `lib/security/html.ts` strips executable `<script>`, `<iframe>`, `<object>`, `<embed>`, and `<form>` elements.
  - All inline `on*` event handlers (e.g. `onclick`, `onload`, `onerror`) and `javascript:` URIs are purged.
- **Component-Level Safety**:
  - `dangerouslySetInnerHTML` should only be used in conjunction with `sanitizePageHtml()` or `sanitizeCoverHtml()`.

---

## 4. Native Ads & External Links

- **URL Protocol Verification**:
  - `isSafeUrl()` rejects any protocol other than `http:` or `https:`.
  - Malformed URLs, data URLs (`data:text/html,...`), and script protocols (`javascript:...`) are blocked at runtime.
- **Anchor Tag Hardening**:
  - All external hyperlinks and advertisement targets must include:
    ```html
    <a href="..." target="_blank" rel="noopener noreferrer nofollow">
    ```
  - This prevents `window.opener` hijacking and protects search reputation.


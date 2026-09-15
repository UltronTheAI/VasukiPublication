# VasukiPublication — Search Engine Optimization (SEO) Architecture

VasukiPublication is built from the ground up for search engine discovery, canonical indexing, social card generation, and rich snippet integration without duplicate indexing universes or PDF parsing.

---

## 1. Canonical URL Model

To prevent duplicate indexing universes across query parameters and reader routes:

| Route | Canonical Target | Robots Directives | Description |
| :--- | :--- | :--- | :--- |
| `/` | `https://vasukipublication.com/` | `index, follow` | Primary discovery homepage |
| `/?q=database` | `https://vasukipublication.com/` | `noindex, follow` | Search query permutations are crawled but not indexed separately |
| `/?page=2` | `https://vasukipublication.com/` | `noindex, follow` | Pagination states preserve link equity while consolidating canonical signals |
| `/book/[slug]` | `https://vasukipublication.com/book/[slug]` | `index, follow` | Authoritative canonical detail page for the publication |
| `/book/[slug]/read` | `https://vasukipublication.com/book/[slug]` | `noindex, follow` | Reader points back to book detail page to consolidate indexing signals |
| `/saved` | `https://vasukipublication.com/saved` | `noindex, follow` | Browser-local reading queue is excluded from search indexes |
| `/privacy` | `https://vasukipublication.com/privacy` | `index, follow` | Platform privacy policy |
| `/terms` | `https://vasukipublication.com/terms` | `index, follow` | Platform terms of service |
| `/admin/*` | N/A | `noindex, nofollow` | Administrative interface strictly excluded |

---

## 2. Dynamic Sitemap (`app/sitemap.ts`)

The sitemap is dynamically generated according to Next.js 16 App Router conventions (`MetadataRoute.Sitemap`) and accessible at `/sitemap.xml`.

### Included Entries
- **Core Static Routes**: `/`, `/privacy`, `/terms`.
- **Public Published Books**: Direct lookup from MongoDB (`publication.status === "published"` and `publication.visibility === "public"`). Includes `lastModified` timestamp from `updated_at`.

### Strictly Excluded
- Draft or unpublished books (`publication.status === "draft"`).
- Private publications (`publication.visibility === "private"`).
- Reader route variants (`/book/[slug]/read`).
- Search and pagination URL permutations (`?q=...`, `?page=...`).
- Internal `/admin/*` management routes.
- API endpoints (`/api/*`).

---

## 3. Robots Exclusion Standard (`app/robots.ts`)

The dynamic robots manifest is served at `/robots.txt` via Next.js `MetadataRoute.Robots`:

```typescript
export default function robots(): MetadataRoute.Robots {
  const baseUrl = (publicEnv.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/*", "/saved"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

## 4. Structured Data (JSON-LD)

Every public book detail page (`/book/[slug]`) injects valid Schema.org `Book` structured data in a `<script type="application/ld+json">` tag:

```json
{
  "@context": "https://schema.org",
  "@type": "Book",
  "name": "Designing Distributed Systems",
  "headline": "Patterns for Scalable Architecture",
  "description": "Comprehensive guide to distributed consensus...",
  "inLanguage": "en",
  "numberOfPages": 48,
  "author": {
    "@type": "Person",
    "name": "Swaraj Puppalwar"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Vasuki Publication",
    "url": "https://vasukipublication.com"
  },
  "url": "https://vasukipublication.com/book/designing-distributed-systems",
  "mainEntityOfPage": "https://vasukipublication.com/book/designing-distributed-systems",
  "datePublished": "2026-09-15T00:00:00.000Z",
  "dateModified": "2026-09-15T12:00:00.000Z"
}
```

---

## 5. Dynamic OpenGraph Social Previews (`/book/[slug]/opengraph-image`)

Each publication includes dynamic edge-rendered 1200x630 OpenGraph cards using Next.js `ImageResponse` from `next/og`:
- Reconstructs cover artwork palettes, typography, chapter count, and reading time badges dynamically.
- Delivers crisp social cards for Twitter, Discord, Slack, and LinkedIn shares.


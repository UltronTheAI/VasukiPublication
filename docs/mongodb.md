# VasukiPublication — MongoDB Data Model & Indexes

VasukiPublication connects directly to the canonical MongoDB database shared with VasukiSquare (default database name: `vasukisquare`).

---

## 1. Collections & Relationships

```
┌────────────────────────┐         1:1         ┌────────────────────────┐
│         books          ├────────────────────►│         covers         │
│  _id, slug, title, ... │                     │  _id, book_id, design  │
└───────────┬────────────┘                     └────────────────────────┘
            │
            │ 1:N
            ▼
┌────────────────────────┐                     ┌────────────────────────┐
│         pages          │                     │          ads           │
│  _id, book_id, page_no │                     │  _id, title, url, ...  │
│  prev_id, next_id      │                     │  (Independent pool)    │
└────────────────────────┘                     └────────────────────────┘
```

### 1.1 `books` Collection
Contains top-level metadata, chapter hierarchy, editorial categorization, and publication lifecycle.

- **Primary Identifier**: `_id` / `id` (UUID string)
- **Slug**: `slug` (Unique, collision-safe URL slug)
- **Publication State**:
  - `publication.status`: `"draft"` | `"published"` | `"unpublished"`
  - `publication.visibility`: `"public"` | `"private"`
  - `publication.published_at`: UTC Timestamp
- **Featured Curation**:
  - `featured.pinned`: `boolean`
  - `featured.position`: `1` .. `5` (Only when `pinned: true`)
- **Discovery**: `discovery.search_title`, `discovery.keywords`, `discovery.category`
- **Starting Reference**: `starting_page_id`, `cover_id`

### 1.2 `pages` Collection
Stores individual rendered pages. Each document represents exactly one physical A4 page.

- **Composite Key**: `(book_id, page_number)` (Unique)
- **Pointers**: `previous_page_id` and `next_page_id` form a bidirectional linked list.
- **Content**: `content` object containing structured `blocks` (`code`, `callout`, `table`, `terminal`, etc.).
- **Style**: `style` object with `theme` (`"light"` | `"dark"`), font, and accent tokens.
- **HTML Cache**: `html` contains pre-rendered, sanitized markup for instant reader streaming.

### 1.3 `covers` Collection
Stores cover artwork metadata, art-directed layout compositions, and background palettes.

- **Relationship**: `book_id` references `books._id` (Unique index).
- **Dimensions**: Standard 1600x2560 aspect ratio.
- **Design Payload**: `design` containing typography alignments, hero icons, geometric motifs, and contrast modes.

### 1.4 `ads` Collection
Stores native, high-quality promotional cards.

- **Placements**: `["home_banner", "home_sidebar", "saved_banner", "saved_sidebar"]`
- **Priority**: `1` (Weight 10), `2` (Weight 5), `3` (Weight 2)
- **Active Window**: `starts_at <= now <= ends_at` and `active === true`

---

## 2. Required Indexes

```javascript
// books collection
db.books.createIndex({ "slug": 1 }, { unique: true, name: "books_slug_unique" });
db.books.createIndex(
  { "publication.status": 1, "publication.visibility": 1, "updated_at": -1 },
  { name: "books_publication_idx" }
);
db.books.createIndex(
  { "featured.pinned": 1, "featured.position": 1 },
  { name: "books_featured_idx" }
);
db.books.createIndex(
  {
    "discovery.search_title": "text",
    "title": "text",
    "description": "text",
    "discovery.keywords": "text"
  },
  { name: "books_text_search" }
);

// pages collection
db.pages.createIndex({ "book_id": 1, "page_number": 1 }, { unique: true, name: "pages_book_page_unique" });
db.pages.createIndex({ "book_id": 1 }, { name: "pages_book_id_idx" });

// covers collection
db.covers.createIndex({ "book_id": 1 }, { unique: true, name: "covers_book_id_unique" });

// ads collection
db.ads.createIndex({ "active": 1 }, { name: "ads_active_idx" });
db.ads.createIndex({ "priority": 1 }, { name: "ads_priority_idx" });
db.ads.createIndex({ "placements": 1 }, { name: "ads_placements_idx" });
db.ads.createIndex({ "starts_at": 1, "ends_at": 1 }, { name: "ads_dates_idx" });
```

---

## 3. Public Publication Filters

All public client queries must strictly enforce:

```typescript
const publicFilter = {
  "publication.status": "published",
  "publication.visibility": "public",
};
```

